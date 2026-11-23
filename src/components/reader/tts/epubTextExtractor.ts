import { TTSSegment, TTSParagraph, TTSExtractionResult } from './types'

/**
 * Splits plain text into natural, digestible sentence segments.
 * Avoids long utterances that cause Chromium speech synthesis timeouts,
 * while keeping sentence boundaries, dialogue dashes, and punctuation natural.
 */
export function splitIntoSentenceSegments(text: string): string[] {
  if (!text || typeof text !== 'string') return []

  const cleaned = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!cleaned) return []

  // Split on sentence-ending punctuation followed by whitespace, quotes, or dashes
  const rawParts = cleaned.split(/(?<=[.!?…])\s+(?=[A-Z0-9¡¿"'\u201C\u2018\u00C0-\u017E—])/u)

  const segments: string[] = []
  let buffer = ''

  for (const part of rawParts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    // If part is very short (e.g. "Dr.", "Sr.", "No.", "pág.") combine with buffer
    const isAbbreviation = /^(Dr|Dra|Sr|Sra|Srta|Mr|Mrs|Ms|Prof|No|pág|cap|vs)\.$/i.test(trimmed)

    if (buffer) {
      buffer += ' ' + trimmed
      if (!isAbbreviation && buffer.length >= 35) {
        segments.push(buffer.trim())
        buffer = ''
      }
    } else {
      if (isAbbreviation || trimmed.length < 25) {
        buffer = trimmed
      } else {
        segments.push(trimmed)
      }
    }
  }

  if (buffer.trim()) {
    if (segments.length > 0 && buffer.length < 25) {
      // Append leftover fragment to last segment if too short
      segments[segments.length - 1] += ' ' + buffer.trim()
    } else {
      segments.push(buffer.trim())
    }
  }

  // If a single segment is still excessively long (> 300 chars), subdivide at commas or semicolons
  const refinedSegments: string[] = []
  for (const seg of segments) {
    if (seg.length <= 300) {
      refinedSegments.push(seg)
    } else {
      const subParts = seg.split(/(?<=[,;:\u2014])\s+/)
      let subBuffer = ''
      for (const sp of subParts) {
        if ((subBuffer + ' ' + sp).length > 250 && subBuffer) {
          refinedSegments.push(subBuffer.trim())
          subBuffer = sp
        } else {
          subBuffer = subBuffer ? subBuffer + ' ' + sp : sp
        }
      }
      if (subBuffer.trim()) {
        refinedSegments.push(subBuffer.trim())
      }
    }
  }

  return refinedSegments.filter((s) => s.length > 1)
}

interface VisualElementMetrics {
  el: HTMLElement
  screenLeft: number
  screenRight: number
  screenTop: number
  screenBottom: number
  isVisible: boolean
}

/**
 * Calculates physical screen-space metrics of an element inside an iframe
 * relative to the reader's visual container.
 */
function getElementMetrics(
  el: HTMLElement,
  win: Window,
  viewerContainer: HTMLElement | null
): VisualElementMetrics {
  try {
    const elRect = el.getBoundingClientRect()
    if (elRect.width === 0 && elRect.height === 0) {
      return { el, screenLeft: 0, screenRight: 0, screenTop: 0, screenBottom: 0, isVisible: false }
    }

    if (!viewerContainer) {
      const viewW = win.innerWidth || (el.ownerDocument?.documentElement.clientWidth ?? 400)
      const viewH = win.innerHeight || (el.ownerDocument?.documentElement.clientHeight ?? 600)
      const isVisible =
        elRect.right > 4 && elRect.left < viewW - 4 && elRect.bottom > 4 && elRect.top < viewH - 4
      return {
        el,
        screenLeft: elRect.left,
        screenRight: elRect.right,
        screenTop: elRect.top,
        screenBottom: elRect.bottom,
        isVisible,
      }
    }

    const containerRect = viewerContainer.getBoundingClientRect()
    const iframe = (el.ownerDocument?.defaultView?.frameElement as HTMLElement | null)
    const iframeRect = iframe
      ? iframe.getBoundingClientRect()
      : { left: 0, top: 0, right: win.innerWidth, bottom: win.innerHeight }

    const screenLeft = iframeRect.left + elRect.left
    const screenRight = iframeRect.left + elRect.right
    const screenTop = iframeRect.top + elRect.top
    const screenBottom = iframeRect.top + elRect.bottom

    // 1. Horizontal check: element must fall within container's visible page column(s)
    const inHorizontal = screenRight > containerRect.left + 8 && screenLeft < containerRect.right - 8

    // 2. Vertical check: element must have significant readable presence inside viewport
    const inVertical = screenBottom > containerRect.top + 18 && screenTop < containerRect.bottom - 15

    // If element overflows at the top, require at least 26px of readable height in view
    const isTooPartiallyCutAtTop =
      screenTop < containerRect.top && screenBottom - containerRect.top < 26

    const isVisible = inHorizontal && inVertical && !isTooPartiallyCutAtTop

    return { el, screenLeft, screenRight, screenTop, screenBottom, isVisible }
  } catch {
    return { el, screenLeft: 0, screenRight: 0, screenTop: 0, screenBottom: 0, isVisible: true }
  }
}

/**
 * Extracts structured Paragraphs and sentence Segments from the currently rendered EPUB view.
 * Guarantees visual reading order (left column then right column on desktop; top to bottom on mobile).
 */
export function extractContentFromRendition(
  rendition: unknown,
  viewerContainer: HTMLElement | null,
  fallbackText?: string
): TTSExtractionResult {
  const segments: TTSSegment[] = []
  const paragraphs: TTSParagraph[] = []

  try {
    const docList: Array<{ doc: Document; win: Window }> = []

    const typedRendition = rendition as {
      getContents?: () => Array<{ document?: Document; window?: Window }>
      currentLocation?: () => { start?: { cfi?: string } } | null
      location?: { start?: { cfi?: string } } | null
      getRange?: (cfi: string) => Range | null
    } | null

    if (typedRendition?.getContents) {
      try {
        const contents = typedRendition.getContents()
        for (const c of contents) {
          if (c.document && c.window) {
            docList.push({ doc: c.document, win: c.window })
          }
        }
      } catch { }
    }

    if (docList.length === 0 && viewerContainer) {
      const iframes = viewerContainer.querySelectorAll('iframe')
      iframes.forEach((iframe) => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document
          const win = iframe.contentWindow || window
          if (doc) docList.push({ doc, win })
        } catch { }
      })
    }

    if (docList.length > 0) {
      const selector = 'h1, h2, h3, h4, h5, h6, p, blockquote, li, dt, dd'
      const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NAV', 'HEADER', 'FOOTER', 'SVG', 'NOSCRIPT'])

      const allMetrics: VisualElementMetrics[] = []

      for (const { doc, win } of docList) {
        if (!doc.body) continue
        const nodes = doc.querySelectorAll<HTMLElement>(selector)

        nodes.forEach((node) => {
          if (ignoredTags.has(node.tagName)) return
          if (node.classList.contains('epub-type-pagebreak') || node.getAttribute('role') === 'doc-pagebreak') return
          if (node.getAttribute('aria-hidden') === 'true') return
          if (node.closest('header, footer, nav, .pagination, [aria-hidden="true"]')) return
          if (node.querySelector(selector)) return

          const text = node.innerText || node.textContent || ''
          if (!text.trim() || text.trim().length < 2) return

          const metrics = getElementMetrics(node, win, viewerContainer)
          allMetrics.push(metrics)
        })
      }

      // Filter elements physically visible on screen
      let visibleMetrics = allMetrics.filter((m) => m.isVisible)

      // Sort in natural visual reading order:
      // If double-page spread on desktop (container >= 800px), left page column FIRST, then right page column.
      if (viewerContainer && visibleMetrics.length > 0) {
        const containerRect = viewerContainer.getBoundingClientRect()
        const isSpread = containerRect.width >= 800
        const splitX = containerRect.left + containerRect.width * 0.5

        visibleMetrics.sort((a, b) => {
          if (isSpread) {
            const colA = a.screenLeft < splitX ? 0 : 1
            const colB = b.screenLeft < splitX ? 0 : 1
            if (colA !== colB) return colA - colB
          }
          return a.screenTop - b.screenTop
        })
      }

      // Fallback: If physical projection found no elements, use location start CFI
      if (visibleMetrics.length === 0 && allMetrics.length > 0) {
        try {
          const loc =
            (typeof typedRendition?.currentLocation === 'function'
              ? typedRendition.currentLocation()
              : null) || typedRendition?.location
          const startCfi = loc?.start?.cfi

          if (startCfi && typedRendition?.getRange) {
            const range = typedRendition.getRange(startCfi)
            if (range) {
              const startNode = range.startContainer
              const startBlock =
                startNode.nodeType === 1
                  ? (startNode as HTMLElement).closest(selector)
                  : startNode.parentElement?.closest(selector)

              if (startBlock) {
                const startIdx = allMetrics.findIndex((m) => m.el === startBlock)
                if (startIdx !== -1) {
                  visibleMetrics = allMetrics.slice(startIdx)
                }
              }
            }
          }
        } catch { }
      }

      if (visibleMetrics.length === 0) {
        visibleMetrics = allMetrics
      }

      let globalSegmentIndex = 0
      visibleMetrics.forEach((metric, pIdx) => {
        const el = metric.el
        const rawText = el.innerText || el.textContent || ''
        const sentenceChunks = splitIntoSentenceSegments(rawText)

        if (sentenceChunks.length === 0) return

        const pId = `p-${pIdx}-${Date.now().toString(36)}`
        const firstSegIdx = globalSegmentIndex

        sentenceChunks.forEach((chunk, sIdx) => {
          segments.push({
            id: `tts-${globalSegmentIndex}`,
            text: chunk,
            element: el,
            index: globalSegmentIndex,
            paragraphId: pId,
            paragraphIndex: pIdx,
            isFirstInParagraph: sIdx === 0,
            isLastInParagraph: sIdx === sentenceChunks.length - 1,
          })
          globalSegmentIndex++
        })

        paragraphs.push({
          id: pId,
          index: pIdx,
          element: el,
          text: rawText,
          firstSegmentIndex: firstSegIdx,
          segmentCount: sentenceChunks.length,
        })
      })
    }
  } catch (err) {
    console.warn('[TTS] Failed to extract text from EPUB DOM:', err)
  }

  // Fallback: Plain fallback text if DOM had no valid elements
  if (paragraphs.length === 0 && fallbackText?.trim()) {
    const fallbackChunks = splitIntoSentenceSegments(fallbackText)
    const pId = 'p-fb-0'
    fallbackChunks.forEach((chunk, idx) => {
      segments.push({
        id: `tts-fb-${idx}`,
        text: chunk,
        index: idx,
        paragraphId: pId,
        paragraphIndex: 0,
        isFirstInParagraph: idx === 0,
        isLastInParagraph: idx === fallbackChunks.length - 1,
      })
    })
    paragraphs.push({
      id: pId,
      index: 0,
      element: null,
      text: fallbackText,
      firstSegmentIndex: 0,
      segmentCount: fallbackChunks.length,
    })
  }

  return { segments, paragraphs }
}

/**
 * Backward compatibility wrapper returning TTSSegment[]
 */
export function extractSegmentsFromRendition(
  rendition: unknown,
  viewerContainer: HTMLElement | null,
  fallbackText?: string
): TTSSegment[] {
  return extractContentFromRendition(rendition, viewerContainer, fallbackText).segments
}
