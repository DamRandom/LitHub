'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TTSSegment,
  TTSExtractionResult,
  TTSVoiceOption,
  PlaybackStatus,
} from './types'

interface UseSpeechSynthesisProps {
  bookLanguage?: string
  onPageComplete?: () => void
  onPrevPage?: () => void
}

type ActiveHighlight =
  | {
    type: 'css-highlight'
    win: (Window & typeof globalThis) | null
    doc: Document
  }
  | {
    type: 'dom-mark'
    marks: HTMLElement[]
    parent: HTMLElement
    doc: Document
  }
  | {
    type: 'element-fallback'
    el: HTMLElement
    prevBg: string
    prevBgPriority: string
    prevRadius: string
    prevRadiusPriority: string
    doc: Document
  }

const STORAGE_KEY_VOICE = 'lithub_tts_voice_uri'
const STORAGE_KEY_RATE = 'lithub_tts_rate'
const STORAGE_KEY_AUTO = 'lithub_tts_auto_advance'

/**
 * Creates a DOM Range across text nodes corresponding to character offsets
 * within a root container.
 */
function createRangeFromCharOffsets(root: HTMLElement, startChar: number, endChar: number): Range | null {
  const doc = root.ownerDocument || document
  const range = doc.createRange()
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)

  let currentChar = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  let node = walker.nextNode() as Text | null
  while (node) {
    const textLen = node.nodeValue?.length || 0
    const nextChar = currentChar + textLen

    if (!startNode && startChar >= currentChar && startChar <= nextChar) {
      startNode = node
      startOffset = Math.max(0, Math.min(startChar - currentChar, textLen))
    }

    if (startNode && endChar >= currentChar && endChar <= nextChar) {
      endNode = node
      endOffset = Math.max(0, Math.min(endChar - currentChar, textLen))
      break
    }

    currentChar = nextChar
    node = walker.nextNode() as Text | null
  }

  if (startNode && endNode) {
    try {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      return range
    } catch {
      return null
    }
  }

  return null
}

/**
 * Locates the exact Range of a sentence within the given root element.
 * Tolerates whitespace differences, non-breaking spaces, and inner markup.
 */
function findSentenceRange(root: HTMLElement, sentenceText: string): Range | null {
  const fullText = root.textContent || ''
  if (!fullText.trim() || !sentenceText.trim()) return null

  // 1. Exact substring match
  let matchStart = fullText.indexOf(sentenceText)
  let matchEnd = matchStart !== -1 ? matchStart + sentenceText.length : -1

  // 2. Whitespace-flexible regex match
  if (matchStart === -1) {
    const words = sentenceText.trim().split(/\s+/).filter(Boolean)
    if (words.length > 0) {
      const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      const regex = new RegExp(escaped.join('\\s+'), 'u')
      const match = regex.exec(fullText)
      if (match) {
        matchStart = match.index
        matchEnd = match.index + match[0].length
      } else if (words.length >= 3) {
        // Loose fallback: start with first 2 words and end with last word
        const startSnippet = escaped.slice(0, 2).join('\\s+')
        const endSnippet = escaped[escaped.length - 1]
        const looseRegex = new RegExp(`${startSnippet}[\\s\\S]*?${endSnippet}`, 'u')
        const looseMatch = looseRegex.exec(fullText)
        if (looseMatch && looseMatch[0].length <= sentenceText.length * 1.6) {
          matchStart = looseMatch.index
          matchEnd = looseMatch.index + looseMatch[0].length
        }
      }
    }
  }

  if (matchStart === -1 || matchEnd === -1) return null

  return createRangeFromCharOffsets(root, matchStart, matchEnd)
}

export function useSpeechSynthesis({
  bookLanguage = 'es',
  onPageComplete,
  onPrevPage,
}: UseSpeechSynthesisProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [voices, setVoices] = useState<TTSVoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRateState] = useState<number>(1.0)
  const [autoAdvancePage, setAutoAdvancePage] = useState<boolean>(true)
  const [segments, setSegmentsState] = useState<TTSSegment[]>([])
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0)

  // Stable refs to prevent stale closure bugs
  const segmentsRef = useRef<TTSSegment[]>([])
  const currentIndexRef = useRef<number>(0)
  const statusRef = useRef<PlaybackStatus>('idle')
  const rateRef = useRef<number>(1.0)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const autoAdvanceRef = useRef<boolean>(true)
  const onPageCompleteRef = useRef(onPageComplete)
  const onPrevPageRef = useRef(onPrevPage)

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const activeHighlightRef = useRef<ActiveHighlight | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    onPageCompleteRef.current = onPageComplete
  }, [onPageComplete])

  useEffect(() => {
    onPrevPageRef.current = onPrevPage
  }, [onPrevPage])

  // Sync state to refs
  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  useEffect(() => {
    currentIndexRef.current = currentSegmentIndex
  }, [currentSegmentIndex])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  useEffect(() => {
    voiceRef.current = selectedVoice
  }, [selectedVoice])

  useEffect(() => {
    autoAdvanceRef.current = autoAdvancePage
  }, [autoAdvancePage])

  // Clear visual highlights completely
  const clearCurrentHighlight = useCallback(() => {
    if (activeHighlightRef.current) {
      const cur = activeHighlightRef.current
      if (cur.type === 'css-highlight') {
        try {
          const highlightMap = (cur.win?.CSS as unknown as { highlights?: Map<string, unknown> })?.highlights
          highlightMap?.delete('tts-active-sentence')
        } catch { }
      } else if (cur.type === 'dom-mark') {
        try {
          for (const m of cur.marks) {
            if (m.parentNode) {
              m.replaceWith(...m.childNodes)
            }
          }
          cur.parent?.normalize()
        } catch { }
      } else if (cur.type === 'element-fallback') {
        try {
          if (cur.prevBg) {
            cur.el.style.setProperty('background-color', cur.prevBg, cur.prevBgPriority)
          } else {
            cur.el.style.removeProperty('background-color')
          }
          if (cur.prevRadius) {
            cur.el.style.setProperty('border-radius', cur.prevRadius, cur.prevRadiusPriority)
          } else {
            cur.el.style.removeProperty('border-radius')
          }
        } catch { }
      }

      // Also clean up any lingering marks in that document if any
      if (cur.doc) {
        try {
          const orphans = cur.doc.querySelectorAll('[data-tts-highlight]')
          orphans.forEach((m) => {
            const p = m.parentNode
            m.replaceWith(...m.childNodes)
            p?.normalize()
          })
        } catch { }
      }

      activeHighlightRef.current = null
    }
  }, [])

  // Highlight the exact sentence currently being read
  const applyHighlightToSegment = useCallback(
    (index: number) => {
      clearCurrentHighlight()

      const seg = segmentsRef.current[index]
      if (!seg || !seg.text?.trim()) return

      const el = seg.element
      if (!el || !el.isConnected) return

      const doc = el.ownerDocument || document
      const win = doc.defaultView as (Window & typeof globalThis) | null

      // Ensure highlight stylesheet is present in iframe document
      if (!doc.getElementById('tts-sentence-highlight-style')) {
        try {
          const style = doc.createElement('style')
          style.id = 'tts-sentence-highlight-style'
          style.textContent = `
            ::highlight(tts-active-sentence) {
              background-color: rgba(99, 102, 241, 0.22);
              color: inherit;
            }
            .tts-sentence-mark {
              background-color: rgba(99, 102, 241, 0.22) !important;
              color: inherit !important;
              border-radius: 3px !important;
              padding: 0 1px !important;
            }
          `
          doc.head?.appendChild(style)
        } catch { }
      }

      const range = findSentenceRange(el, seg.text)
      if (range) {
        let applied = false

        // 1. Try CSS Custom Highlight API (Chrome 105+, Safari 17.2+, Edge 105+, Firefox 132+)
        // Completely non-destructive: zero DOM tree alterations
        const globalHighlight = typeof window !== 'undefined'
          ? (window as unknown as { Highlight?: new (r: Range) => unknown }).Highlight
          : undefined

        if (globalHighlight && win && 'CSS' in win && 'highlights' in (win.CSS as unknown as Record<string, unknown>)) {
          try {
            const highlightMap = (win.CSS as unknown as { highlights: Map<string, unknown> }).highlights
            const highlight = new globalHighlight(range)
            highlightMap.set('tts-active-sentence', highlight)
            activeHighlightRef.current = {
              type: 'css-highlight',
              win,
              doc,
            }
            applied = true
          } catch { }
        }

        // 2. DOM Range fallback if CSS Highlight API not supported
        if (!applied) {
          try {
            if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
              const textNode = range.startContainer as Text
              const selected = textNode.splitText(range.startOffset)
              selected.splitText(range.endOffset - range.startOffset)
              const mark = doc.createElement('mark')
              mark.className = 'tts-sentence-mark'
              mark.setAttribute('data-tts-highlight', 'true')
              selected.parentNode?.insertBefore(mark, selected)
              mark.appendChild(selected)
              activeHighlightRef.current = {
                type: 'dom-mark',
                marks: [mark],
                parent: el,
                doc,
              }
              applied = true
            } else {
              const fragment = range.extractContents()
              const mark = doc.createElement('mark')
              mark.className = 'tts-sentence-mark'
              mark.setAttribute('data-tts-highlight', 'true')
              mark.appendChild(fragment)
              range.insertNode(mark)
              activeHighlightRef.current = {
                type: 'dom-mark',
                marks: [mark],
                parent: el,
                doc,
              }
              applied = true
            }
          } catch { }
        }

        // Smoothly scroll sentence into view if needed
        try {
          const parentEl = range.startContainer.parentElement || el
          parentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        } catch { }

        if (applied) return
      }

      // 3. Fallback: gentle background on element if sentence range couldn't be constructed
      try {
        const prevBg = el.style.getPropertyValue('background-color')
        const prevBgPriority = el.style.getPropertyPriority('background-color')
        const prevRadius = el.style.getPropertyValue('border-radius')
        const prevRadiusPriority = el.style.getPropertyPriority('border-radius')

        el.style.setProperty('background-color', 'rgba(99, 102, 241, 0.12)', 'important')
        el.style.setProperty('border-radius', '4px', 'important')

        activeHighlightRef.current = {
          type: 'element-fallback',
          el,
          prevBg,
          prevBgPriority,
          prevRadius,
          prevRadiusPriority,
          doc,
        }

        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        } catch { }
      } catch { }
    },
    [clearCurrentHighlight]
  )

  // Manage Screen Wake Lock during active listening
  const acquireWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch { }
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release().catch(() => { })
      } catch { }
      wakeLockRef.current = null
    }
  }, [])

  // Safely cancel speech synthesis without firing rogue onend/onerror callbacks
  const cancelSpeaking = useCallback(() => {
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onstart = null
      activeUtteranceRef.current.onend = null
      activeUtteranceRef.current.onerror = null
      activeUtteranceRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Check Web Speech API support and load voices
  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    const rawVoices = window.speechSynthesis.getVoices()
    if (!rawVoices || rawVoices.length === 0) return

    const langPrefix = (bookLanguage || 'es').slice(0, 2).toLowerCase()

    const voiceOptions: TTSVoiceOption[] = rawVoices.map((v) => ({
      voice: v,
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      isLocalService: v.localService,
      isLanguageMatch: v.lang.toLowerCase().startsWith(langPrefix),
    }))

    voiceOptions.sort((a, b) => {
      if (a.isLanguageMatch && !b.isLanguageMatch) return -1
      if (!a.isLanguageMatch && b.isLanguageMatch) return 1
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })

    setVoices(voiceOptions)

    // Load saved voice from localStorage
    let bestMatch: SpeechSynthesisVoice | null = null
    const scopedKey = `${STORAGE_KEY_VOICE}_${langPrefix}`
    const savedUri =
      typeof window !== 'undefined'
        ? localStorage.getItem(scopedKey) || localStorage.getItem(STORAGE_KEY_VOICE)
        : null

    if (savedUri) {
      const found = rawVoices.find((v) => v.voiceURI === savedUri || v.name === savedUri)
      if (found && (found.lang.toLowerCase().startsWith(langPrefix) || !rawVoices.some((v) => v.lang.toLowerCase().startsWith(langPrefix)))) {
        bestMatch = found
      }
    }

    if (!bestMatch) {
      const match = rawVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix))
      bestMatch = match || rawVoices.find((v) => v.default) || rawVoices[0] || null
    }

    setSelectedVoice(bestMatch)
  }, [bookLanguage])

  // Initial setup: voices and saved preferences
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false)
      return
    }

    try {
      const storedRate = localStorage.getItem(STORAGE_KEY_RATE)
      if (storedRate) {
        const parsedRate = parseFloat(storedRate)
        if (!isNaN(parsedRate) && parsedRate >= 0.5 && parsedRate <= 2.5) {
          setRateState(parsedRate)
        }
      }
      const storedAuto = localStorage.getItem(STORAGE_KEY_AUTO)
      if (storedAuto !== null) {
        setAutoAdvancePage(storedAuto === 'true')
      }
    } catch { }

    populateVoices()

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [populateVoices])

  // Keep-alive watchdog timer for Chrome
  useEffect(() => {
    if (status === 'playing') {
      watchdogTimerRef.current = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause()
            window.speechSynthesis.resume()
          }
        }
      }, 9000)
    } else {
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current)
        watchdogTimerRef.current = null
      }
    }

    return () => {
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current)
    }
  }, [status])

  // Stop playback completely
  const stop = useCallback(() => {
    cancelSpeaking()
    setStatus('stopped')
    setCurrentSegmentIndex(0)
    currentIndexRef.current = 0
    clearCurrentHighlight()
    releaseWakeLock()
  }, [cancelSpeaking, clearCurrentHighlight, releaseWakeLock])

  // Speak a specific segment index
  const speakSegment = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

      const currentSegs = segmentsRef.current
      if (!currentSegs || currentSegs.length === 0) {
        setStatus('idle')
        clearCurrentHighlight()
        return
      }

      if (index >= currentSegs.length) {
        clearCurrentHighlight()
        if (autoAdvanceRef.current && onPageCompleteRef.current) {
          setStatus('loading')
          onPageCompleteRef.current()
        } else {
          stop()
        }
        return
      }

      const clampedIndex = Math.max(0, index)
      setCurrentSegmentIndex(clampedIndex)
      currentIndexRef.current = clampedIndex

      const segment = currentSegs[clampedIndex]
      if (!segment || !segment.text?.trim()) {
        speakSegment(clampedIndex + 1)
        return
      }

      // Detach and cancel previous utterance safely
      cancelSpeaking()

      const utterance = new SpeechSynthesisUtterance(segment.text)
      utterance.rate = rateRef.current
      utterance.pitch = 1.0

      if (voiceRef.current) {
        utterance.voice = voiceRef.current
        utterance.lang = voiceRef.current.lang
      } else {
        utterance.lang = (bookLanguage || 'es').startsWith('en') ? 'en-US' : 'es-ES'
      }

      utterance.onstart = () => {
        setStatus('playing')
        applyHighlightToSegment(clampedIndex)
        acquireWakeLock()
      }

      utterance.onend = () => {
        if (statusRef.current === 'playing') {
          speakSegment(currentIndexRef.current + 1)
        } else {
          if (statusRef.current === 'stopped' || statusRef.current === 'idle') {
            clearCurrentHighlight()
          }
        }
      }

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return
        }
        console.warn('[TTS] Utterance error:', e.error)
        if (statusRef.current === 'playing') {
          speakSegment(currentIndexRef.current + 1)
        } else {
          if (statusRef.current === 'stopped' || statusRef.current === 'idle') {
            clearCurrentHighlight()
          }
        }
      }

      activeUtteranceRef.current = utterance

      // Brief timeout to let the browser audio thread clear cancellation IPC before speaking
      setTimeout(() => {
        if (activeUtteranceRef.current === utterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.speak(utterance)
        }
      }, 15)
    },
    [cancelSpeaking, applyHighlightToSegment, clearCurrentHighlight, stop, acquireWakeLock, bookLanguage]
  )

  // Public control methods
  const play = useCallback(() => {
    if (segmentsRef.current.length === 0) return
    setStatus('playing')
    speakSegment(currentIndexRef.current)
  }, [speakSegment])

  const pause = useCallback(() => {
    cancelSpeaking()
    setStatus('paused')
    releaseWakeLock()
  }, [cancelSpeaking, releaseWakeLock])

  const resume = useCallback(() => {
    setStatus('playing')
    speakSegment(currentIndexRef.current)
  }, [speakSegment])

  // Navigate to NEXT sentence segment
  const nextSegment = useCallback(() => {
    cancelSpeaking()

    const segs = segmentsRef.current
    const currentIdx = currentIndexRef.current
    const targetIdx = currentIdx + 1

    if (targetIdx < segs.length) {
      setCurrentSegmentIndex(targetIdx)
      currentIndexRef.current = targetIdx
      applyHighlightToSegment(targetIdx)

      if (statusRef.current === 'playing') {
        speakSegment(targetIdx)
      }
    } else if (onPageCompleteRef.current) {
      clearCurrentHighlight()
      onPageCompleteRef.current()
    }
  }, [cancelSpeaking, applyHighlightToSegment, speakSegment, clearCurrentHighlight])

  // Navigate to PREVIOUS sentence segment
  const prevSegment = useCallback(() => {
    cancelSpeaking()

    const currentIdx = currentIndexRef.current
    const targetIdx = currentIdx - 1

    if (targetIdx >= 0) {
      setCurrentSegmentIndex(targetIdx)
      currentIndexRef.current = targetIdx
      applyHighlightToSegment(targetIdx)

      if (statusRef.current === 'playing') {
        speakSegment(targetIdx)
      }
    } else if (onPrevPageRef.current) {
      clearCurrentHighlight()
      onPrevPageRef.current()
    }
  }, [cancelSpeaking, applyHighlightToSegment, speakSegment, clearCurrentHighlight])

  const selectSegment = useCallback(
    (index: number) => {
      const segs = segmentsRef.current
      if (segs.length === 0) return

      const clamped = Math.max(0, Math.min(index, segs.length - 1))
      cancelSpeaking()

      setCurrentSegmentIndex(clamped)
      currentIndexRef.current = clamped
      applyHighlightToSegment(clamped)

      if (statusRef.current === 'playing') {
        speakSegment(clamped)
      }
    },
    [cancelSpeaking, applyHighlightToSegment, speakSegment]
  )

  const setRate = useCallback(
    (newRate: number) => {
      const clamped = Math.min(2.0, Math.max(0.75, newRate))
      setRateState(clamped)
      rateRef.current = clamped
      try {
        localStorage.setItem(STORAGE_KEY_RATE, String(clamped))
      } catch { }

      if (statusRef.current === 'playing') {
        speakSegment(currentIndexRef.current)
      }
    },
    [speakSegment]
  )

  const setVoice = useCallback(
    (newVoice: SpeechSynthesisVoice) => {
      setSelectedVoice(newVoice)
      voiceRef.current = newVoice
      try {
        const langPrefix = (newVoice.lang || bookLanguage || 'es').slice(0, 2).toLowerCase()
        localStorage.setItem(`${STORAGE_KEY_VOICE}_${langPrefix}`, newVoice.voiceURI || newVoice.name)
        localStorage.setItem(STORAGE_KEY_VOICE, newVoice.voiceURI || newVoice.name)
      } catch { }

      if (statusRef.current === 'playing') {
        speakSegment(currentIndexRef.current)
      }
    },
    [speakSegment, bookLanguage]
  )

  const toggleAutoAdvance = useCallback(() => {
    setAutoAdvancePage((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY_AUTO, String(next))
      } catch { }
      return next
    })
  }, [])

  // Set new page segments
  const setSegments = useCallback(
    (newSegments: TTSSegment[], autoStartIfPlaying = true, initialIndex = 0) => {
      segmentsRef.current = newSegments
      setSegmentsState(newSegments)

      const targetIdx = Math.max(0, Math.min(initialIndex, Math.max(0, newSegments.length - 1)))
      setCurrentSegmentIndex(targetIdx)
      currentIndexRef.current = targetIdx

      if (newSegments.length > 0) {
        applyHighlightToSegment(targetIdx)

        if (statusRef.current === 'playing' && autoStartIfPlaying) {
          speakSegment(targetIdx)
        } else if (statusRef.current === 'loading') {
          setStatus('playing')
          speakSegment(targetIdx)
        }
      } else {
        clearCurrentHighlight()
      }
    },
    [speakSegment, applyHighlightToSegment, clearCurrentHighlight]
  )

  // Backward compatibility wrapper for setContent
  const setContent = useCallback(
    (content: TTSExtractionResult, autoStartIfPlaying = true, initialIndex = 0) => {
      setSegments(content.segments, autoStartIfPlaying, initialIndex)
    },
    [setSegments]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeaking()
      clearCurrentHighlight()
      releaseWakeLock()
    }
  }, [cancelSpeaking, clearCurrentHighlight, releaseWakeLock])

  return {
    isSupported,
    status,
    rate,
    voices,
    selectedVoice,
    segments,
    currentSegmentIndex,
    autoAdvancePage,
    play,
    pause,
    resume,
    stop,
    nextSegment,
    prevSegment,
    selectSegment,
    setRate,
    setVoice,
    toggleAutoAdvance,
    setSegments,
    setContent,
  }
}
