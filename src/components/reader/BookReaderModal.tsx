/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  Upload,
  ZoomIn,
  ZoomOut,
  Check,
  Play,
  Pause,
  RotateCcw,
  Quote as QuoteIcon,
  FileText,
  Loader2,
  Trash2,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Book } from '@/lib/store'
import { useApp } from '@/lib/context'

interface Props {
  book: Book
  open: boolean
  onClose: () => void
}

type ReaderTheme = 'light' | 'sepia' | 'dark'

interface ClampedPosition {
  left: number
  top: number
  isFlipped: boolean
  arrowX: number
}

function getClampedCoordinates(params: {
  textCenterX: number
  textTopY: number
  textBottomY: number
  containerWidth: number
  containerHeight: number
  toolbarWidth: number
  toolbarHeight: number
}): ClampedPosition {
  const {
    textCenterX,
    textTopY,
    textBottomY,
    containerWidth,
    containerHeight,
    toolbarWidth,
    toolbarHeight,
  } = params

  const paddingX = 16
  const paddingY = 10
  const gap = 8

  // Ensure toolbar is strictly constrained within [paddingX, containerWidth - toolbarWidth - paddingX]
  const maxLeft = Math.max(paddingX, containerWidth - toolbarWidth - paddingX)
  const idealLeft = textCenterX - toolbarWidth / 2
  const left = Math.max(paddingX, Math.min(maxLeft, idealLeft))

  // Arrow position relative to toolbar's left edge (clamped within rounded corners)
  const rawArrowX = textCenterX - left
  const arrowX = Math.max(22, Math.min(toolbarWidth - 22, rawArrowX))

  // Vertical placement: prefer above selection, flip below if not enough space at top
  const idealTopAbove = textTopY - toolbarHeight - gap
  const fitsAbove = idealTopAbove >= paddingY
  const isFlipped = !fitsAbove

  const top = isFlipped
    ? Math.min(containerHeight - toolbarHeight - paddingY, textBottomY + gap)
    : Math.max(paddingY, idealTopAbove)

  return { left, top, isFlipped, arrowX }
}

export default function BookReaderModal({ book, open, onClose }: Props) {
  const { updateBook, data, addSession, addQuote, addNote, deleteQuote, deleteNote } = useApp()
  const currentBook = data.books.find((b) => b.id === book.id) || book

  const totalPages = currentBook.pages || 100
  const initialCalculatedPage =
    currentBook.pages > 0 && (currentBook.progress || 0) > 0
      ? Math.max(1, Math.round((currentBook.pages * currentBook.progress) / 100))
      : 1

  const [theme, setTheme] = useState<ReaderTheme>('light')
  const [fontSize, setFontSize] = useState<number>(100)
  const [currentPage, setCurrentPage] = useState<number>(initialCalculatedPage)
  const [progress, setProgress] = useState<number>(currentBook.progress || 0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Text selection and notes state
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectionPosition, setSelectionPosition] = useState<{
    left: number
    top: number
    isFlipped: boolean
    arrowX: number
    rawCoords: {
      textCenterX: number
      textTopY: number
      textBottomY: number
    }
  } | null>(null)
  const [showSelectionBar, setShowSelectionBar] = useState<boolean>(false)
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false)
  const [noteInput, setNoteInput] = useState<string>('')
  const [notesDrawerOpen, setNotesDrawerOpen] = useState<boolean>(false)
  const [drawerTab, setDrawerTab] = useState<'quotes' | 'notes'>('quotes')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const updateSelectionFromRangeRef = useRef<any>(null)

  // Timer for reading sessions
  const [timerActive, setTimerActive] = useState(false)
  const [secondsRead, setSecondsRead] = useState(0)

  // EPUB State
  const viewerRef = useRef<HTMLDivElement>(null)
  const epubRenditionRef = useRef<any>(null)
  const epubBookRef = useRef<any>(null)
  const [epubLoading, setEpubLoading] = useState(false)
  const [epubError, setEpubError] = useState<string | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Streamlined Reader UI State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const [jumpInputOpen, setJumpInputOpen] = useState(false)
  const [jumpInputVal, setJumpInputVal] = useState('')
  const settingsRef = useRef<HTMLDivElement>(null)

  // Touch swipe & page turn animation state
  const [dragOffset, setDragOffset] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [flipAnimation, setFlipAnimation] = useState<{
    direction: 'next' | 'prev'
  } | null>(null)

  const touchStateRef = useRef<{
    startX: number
    startY: number
    startTime: number
    isSwiping: boolean
    isLockedVertical: boolean
    active: boolean
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    isLockedVertical: false,
    active: false,
  })

  const touchStartRef = useRef<((clientX: number, clientY: number, hasSelection?: boolean) => void) | null>(null)
  const touchMoveRef = useRef<((clientX: number, clientY: number, cancelEvent?: () => void) => void) | null>(null)
  const touchEndRef = useRef<((clientX: number, clientY?: number, cancel?: boolean) => void) | null>(null)

  // Close settings popover when clicking outside
  useEffect(() => {
    if (!settingsOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  const themeRef = useRef<ReaderTheme>(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  // Robust theme applier that directly styles epub.js contents and prevents stale dark styles
  const applyThemeToRendition = useCallback((selectedTheme: ReaderTheme) => {
    const bg = selectedTheme === 'dark' ? '#18181b' : selectedTheme === 'sepia' ? '#fbf0d9' : '#ffffff'
    const color = selectedTheme === 'dark' ? '#f4f4f5' : selectedTheme === 'sepia' ? '#5f4b32' : '#14171a'
    const linkColor = selectedTheme === 'dark' ? '#93c5fd' : selectedTheme === 'sepia' ? '#8c5e2d' : '#2563eb'

    // Direct background on wrapper elements
    if (viewerRef.current) {
      viewerRef.current.style.backgroundColor = bg
    }
    if (mainContainerRef.current) {
      mainContainerRef.current.style.backgroundColor = bg
    }

    if (!epubRenditionRef.current) return
    const rendition = epubRenditionRef.current

    try {
      rendition.themes.select(selectedTheme)
    } catch {}

    const applyDocStyles = (doc: Document) => {
      if (!doc) return
      try {
        if (doc.documentElement) {
          doc.documentElement.style.setProperty('background-color', bg, 'important')
          doc.documentElement.style.setProperty('background', bg, 'important')
          doc.documentElement.style.setProperty('color', color, 'important')
        }
        if (doc.body) {
          doc.body.style.setProperty('background-color', bg, 'important')
          doc.body.style.setProperty('background', bg, 'important')
          doc.body.style.setProperty('color', color, 'important')
          doc.body.style.backgroundColor = bg
          doc.body.style.color = color
          doc.body.classList.remove('dark', 'sepia', 'light')
          doc.body.classList.add(selectedTheme)
        }

        let styleTag = doc.getElementById('lithub-epub-theme-fix') as HTMLStyleElement | null
        if (!styleTag) {
          styleTag = doc.createElement('style')
          styleTag.id = 'lithub-epub-theme-fix'
          if (doc.head) {
            doc.head.appendChild(styleTag)
          } else if (doc.body) {
            doc.body.appendChild(styleTag)
          }
        } else {
          // Always append to head so it wins over epub.js dynamic stylesheets
          doc.head?.appendChild(styleTag)
        }
        styleTag.textContent = `
          html, body {
            background-color: ${bg} !important;
            background: ${bg} !important;
            color: ${color} !important;
          }
          *, *::before, *::after {
            color: ${color} !important;
          }
          p, span, div, h1, h2, h3, h4, h5, h6, li, blockquote, dd, dt, em, strong, b, i, section, article {
            background-color: transparent !important;
            color: ${color} !important;
          }
          a, a:link, a:visited {
            color: ${linkColor} !important;
          }
        `
      } catch (e) {
        console.warn('Error styling doc:', e)
      }
    }

    try {
      // 1. Apply to contents tracked by epubjs
      const contentsList = rendition.getContents ? rendition.getContents() : []
      contentsList.forEach((contents: any) => {
        if (contents.document) {
          applyDocStyles(contents.document)
        }
      })

      // 2. Query all actual iframes in the DOM to catch any that epubjs getContents missed
      const iframes = viewerRef.current?.querySelectorAll('iframe')
      if (iframes && iframes.length > 0) {
        iframes.forEach((iframe) => {
          try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document
            if (doc) applyDocStyles(doc)
          } catch {}
        })
      }
    } catch (e) {
      console.warn('Error applying iframe theme styles:', e)
    }
  }, [])

  // Current active file URL
  const activeFileUrl = currentBook.fileUrl || currentBook.filePath || null
  const isEpub = currentBook.format === 'epub' || !!activeFileUrl?.toLowerCase().endsWith('.epub')
  const isPdf = currentBook.format === 'pdf' || !!activeFileUrl?.toLowerCase().endsWith('.pdf')

  // Filter notes and quotes for this book
  const bookQuotes = data.quotes.filter((q) => q.bookId === currentBook.id)
  const bookNotes = data.notes.filter((n) => n.bookId === currentBook.id)

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Auto-save progress helper (debounced)
  const triggerAutoSave = useCallback(
    (newProgress: number, targetPage?: number) => {
      const clampedProgress = Math.min(100, Math.max(0, Math.round(newProgress)))
      const calculatedPage =
        targetPage ||
        (currentBook.pages > 0
          ? Math.max(1, Math.round((currentBook.pages * clampedProgress) / 100))
          : 1)

      setProgress(clampedProgress)
      setCurrentPage(calculatedPage)
      setSaveStatus('saving')

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          const updates: Partial<Book> = {
            progress: clampedProgress,
            status: clampedProgress >= 100 ? 'finished' : 'reading',
            lastOpenedAt: new Date().toISOString(),
          }
          if (clampedProgress >= 100 && !currentBook.dateFinished) {
            updates.dateFinished = new Date().toISOString().slice(0, 10)
          }
          if (!currentBook.dateStarted) {
            updates.dateStarted = new Date().toISOString().slice(0, 10)
          }

          // If minutes were tracked, log session
          if (secondsRead >= 60) {
            const mins = Math.round(secondsRead / 60)
            const pagesRead = calculatedPage ? Math.max(0, calculatedPage - currentPage) : 0
            addSession({
              bookId: currentBook.id,
              date: new Date().toISOString().slice(0, 10),
              minutes: mins,
              pagesRead: pagesRead || 1,
            })
          }

          await updateBook(currentBook.id, updates)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2500)
        } catch (err) {
          console.error('Auto-save error:', err)
          setSaveStatus('idle')
        }
      }, 500)
    },
    [currentBook, updateBook, secondsRead, currentPage, addSession]
  )

  // When modal opens, sync book state and mark as reading & last opened
  useEffect(() => {
    if (open && currentBook) {
      const now = new Date().toISOString()
      const updates: Partial<Book> = {
        lastOpenedAt: now,
        status: currentBook.status === 'finished' ? 'reading' : 'reading',
      }
      if (!currentBook.dateStarted) {
        updates.dateStarted = now.slice(0, 10)
      }
      updateBook(currentBook.id, updates)
    }
  }, [open, currentBook?.id])

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsRead((s) => s + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive])

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Jump to percentage in EPUB
  const jumpToPercentage = useCallback(
    (pct: number) => {
      if (isEpub && epubBookRef.current && epubRenditionRef.current) {
        try {
          if (
            epubBookRef.current.locations &&
            typeof epubBookRef.current.locations.length === 'function' &&
            epubBookRef.current.locations.length() > 0
          ) {
            const cfi = epubBookRef.current.locations.cfiFromPercentage(pct / 100)
            if (cfi) {
              epubRenditionRef.current.display(cfi)
              return
            }
          }
          if (epubBookRef.current.spine?.items?.length) {
            const idx = Math.min(
              epubBookRef.current.spine.items.length - 1,
              Math.max(0, Math.floor(epubBookRef.current.spine.items.length * (pct / 100)))
            )
            epubRenditionRef.current.display(epubBookRef.current.spine.items[idx].href)
          }
        } catch (err) {
          console.warn('Error jumping to percentage:', err)
        }
      }
    },
    [isEpub]
  )

  // Handle manual page change (for PDF, EPUB or physical)
  const handlePageChange = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(newPage, totalPages))
      setCurrentPage(clamped)
      const newProg = Math.round((clamped / totalPages) * 100)
      triggerAutoSave(newProg, clamped)
      jumpToPercentage(newProg)
    },
    [totalPages, triggerAutoSave, jumpToPercentage]
  )

  // Trigger page turn with realistic 3D book page flip animation
  const triggerPageTurn = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'prev' && currentPage <= 1) {
        setDragOffset(0)
        setIsDragging(false)
        return
      }
      if (direction === 'next' && currentPage >= totalPages) {
        setDragOffset(0)
        setIsDragging(false)
        return
      }

      // Start the 3D page flip animation
      setFlipAnimation({ direction })
      setDragOffset(0)
      setIsDragging(false)

      if (isEpub && epubRenditionRef.current) {
        if (direction === 'next') {
          epubRenditionRef.current.next()
        } else {
          epubRenditionRef.current.prev()
        }
      } else {
        if (direction === 'next') {
          handlePageChange(currentPage + 1)
        } else {
          handlePageChange(currentPage - 1)
        }
      }

      setTimeout(() => {
        setFlipAnimation(null)
      }, 420)
    },
    [currentPage, totalPages, isEpub, handlePageChange]
  )

  // Unified touch gesture handlers for mobile page-turn swiping
  const onTouchStartGeneral = useCallback(
    (clientX: number, clientY: number, hasSelection: boolean = false) => {
      if (hasSelection) return
      touchStateRef.current = {
        startX: clientX,
        startY: clientY,
        startTime: Date.now(),
        isSwiping: false,
        isLockedVertical: false,
        active: true,
      }
    },
    []
  )

  const onTouchMoveGeneral = useCallback(
    (clientX: number, clientY: number, cancelEvent?: () => void) => {
      const state = touchStateRef.current
      if (!state.active) return

      const dx = clientX - state.startX
      const dy = clientY - state.startY

      if (!state.isSwiping) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          state.isSwiping = true
        }
      }

      if (state.isSwiping) {
        if (cancelEvent) {
          try {
            cancelEvent()
          } catch {}
        }
        let clampedDx = dx
        if ((currentPage <= 1 && dx > 0) || (currentPage >= totalPages && dx < 0)) {
          clampedDx = dx * 0.25
        }
        setDragOffset(clampedDx)
        setIsDragging(true)
      }
    },
    [currentPage, totalPages]
  )

  const onTouchEndGeneral = useCallback(
    (clientX: number, clientY?: number, cancel: boolean = false) => {
      const state = touchStateRef.current
      if (cancel || !state.active) {
        state.active = false
        state.isSwiping = false
        setDragOffset(0)
        setIsDragging(false)
        return
      }

      const dx = clientX - state.startX
      const dy = clientY !== undefined ? clientY - state.startY : 0
      const dt = Math.max(1, Date.now() - state.startTime)
      const velocity = Math.abs(dx) / dt

      const isSwipeNext = dx < -35 || (dx < -15 && velocity > 0.22)
      const isSwipePrev = dx > 35 || (dx > 15 && velocity > 0.22)

      const containerW =
        mainContainerRef.current?.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 360)
      const isTap = Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300

      if (isSwipeNext) {
        triggerPageTurn('next')
      } else if (isSwipePrev) {
        triggerPageTurn('prev')
      } else if (isTap) {
        // Tap on page edges to turn page
        if (clientX > containerW * 0.75) {
          triggerPageTurn('next')
        } else if (clientX < containerW * 0.25) {
          triggerPageTurn('prev')
        } else {
          setDragOffset(0)
          setIsDragging(false)
        }
      } else {
        setDragOffset(0)
        setIsDragging(false)
      }

      state.active = false
      state.isSwiping = false
    },
    [triggerPageTurn]
  )

  useEffect(() => {
    touchStartRef.current = onTouchStartGeneral
    touchMoveRef.current = onTouchMoveGeneral
    touchEndRef.current = onTouchEndGeneral
  }, [onTouchStartGeneral, onTouchMoveGeneral, onTouchEndGeneral])

  // Calculate selection position relative to mainContainer with edge collision detection & boundary clamping
  const updateSelectionFromRange = useCallback((range: Range, iframeEl?: HTMLElement | null) => {
    const text = range.toString()?.trim()
    if (!text || text.length < 1) return

    const rects = range.getClientRects()
    const firstRect = rects.length > 0 ? rects[0] : range.getBoundingClientRect()
    const lastRect = rects.length > 0 ? rects[rects.length - 1] : firstRect

    if (firstRect.width === 0 && firstRect.height === 0) return

    const iframeRect = iframeEl ? iframeEl.getBoundingClientRect() : { top: 0, left: 0 }
    const container = mainContainerRef.current
    const containerRect = container?.getBoundingClientRect() || {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const activeRect = rects.length > 1 ? lastRect : firstRect
    const textCenterX = iframeRect.left + activeRect.left + activeRect.width / 2 - containerRect.left
    const textTopY = iframeRect.top + firstRect.top - containerRect.top
    const textBottomY = iframeRect.top + lastRect.bottom - containerRect.top

    // Toolbar dimensions (use measured or robust fallback)
    const tb = toolbarRef.current
    const toolbarWidth = tb?.offsetWidth || 340
    const toolbarHeight = tb?.offsetHeight || 44

    const pos = getClampedCoordinates({
      textCenterX,
      textTopY,
      textBottomY,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      toolbarWidth,
      toolbarHeight,
    })

    setSelectedText(text)
    setSelectionPosition({
      ...pos,
      rawCoords: { textCenterX, textTopY, textBottomY },
    })
    setShowSelectionBar(true)
  }, [])

  useEffect(() => {
    updateSelectionFromRangeRef.current = updateSelectionFromRange
  }, [updateSelectionFromRange])

  // Re-adjust toolbar position once measured to guarantee zero overflow
  useEffect(() => {
    if (showSelectionBar && toolbarRef.current && selectionPosition?.rawCoords && mainContainerRef.current) {
      const tb = toolbarRef.current
      const container = mainContainerRef.current
      const actualWidth = tb.offsetWidth
      const actualHeight = tb.offsetHeight
      const containerRect = container.getBoundingClientRect()

      const pos = getClampedCoordinates({
        textCenterX: selectionPosition.rawCoords.textCenterX,
        textTopY: selectionPosition.rawCoords.textTopY,
        textBottomY: selectionPosition.rawCoords.textBottomY,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        toolbarWidth: actualWidth,
        toolbarHeight: actualHeight,
      })

      if (
        Math.abs(pos.left - selectionPosition.left) > 1 ||
        Math.abs(pos.top - selectionPosition.top) > 1 ||
        Math.abs(pos.arrowX - selectionPosition.arrowX) > 1 ||
        pos.isFlipped !== selectionPosition.isFlipped
      ) {
        setSelectionPosition({
          ...pos,
          rawCoords: selectionPosition.rawCoords,
        })
      }
    }
  }, [showSelectionBar, selectedText])

  // Clear selection popup on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showSelectionBar) {
        setShowSelectionBar(false)
        setSelectionPosition(null)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showSelectionBar])

  // Handle selection outside iframe (e.g. PDF or container text)
  const handleContainerMouseUp = () => {
    const sel = window.getSelection()
    const text = sel?.toString()?.trim()
    if (sel && text && text.length > 1 && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      updateSelectionFromRange(range)
    }
  }

  // Save selected text as Quote
  const handleSaveAsQuote = async () => {
    if (!selectedText.trim()) return
    const textToSave = selectedText.trim()
    setSelectedText('')
    setShowSelectionBar(false)
    setSelectionPosition(null)

    await addQuote({
      bookId: currentBook.id,
      text: textToSave,
      page: currentPage,
      favorite: false,
    })

    showToast(`✓ Cita guardada (página ${currentPage})`)
    triggerAutoSave(progress, currentPage)
  }

  // Save selected text + user thought as Note
  const handleSaveNote = async () => {
    if (!noteInput.trim()) return
    const thought = noteInput.trim()
    const snippet = selectedText.trim()

    const fullNoteContent = snippet
      ? `${thought}\n\n— Fragmento citado:\n«${snippet}»`
      : thought

    setNoteModalOpen(false)
    setNoteInput('')
    setSelectedText('')
    setSelectionPosition(null)

    await addNote({
      bookId: currentBook.id,
      text: fullNoteContent,
      page: currentPage,
    })

    showToast(`✓ Nota guardada (página ${currentPage})`)
    triggerAutoSave(progress, currentPage)
  }

  // File Upload handler for books with missing file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bookId', currentBook.id)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await res.json()
      if (!res.ok || !uploadData.success) {
        throw new Error(uploadData.message || 'Error al subir el archivo')
      }

      await updateBook(currentBook.id, {
        fileUrl: uploadData.fileUrl,
        filePath: uploadData.fileUrl,
        format: uploadData.format,
      })
    } catch (err: any) {
      console.error(err)
      setUploadError(err.message || 'Error al subir el archivo del libro')
    } finally {
      setIsUploading(false)
    }
  }

  // Load EPUB safely and navigate directly to saved location
  useEffect(() => {
    if (!open || !activeFileUrl || !isEpub) return

    let isMounted = true
    setEpubLoading(true)
    setEpubError(null)

    const initEpub = async () => {
      try {
        const epubModule = await import('epubjs')
        const ePub =
          typeof epubModule.default === 'function'
            ? epubModule.default
            : (epubModule as any).default?.default || epubModule

        if (!isMounted || !viewerRef.current) return

        // Clean previous
        if (epubRenditionRef.current) {
          try {
            epubRenditionRef.current.destroy()
          } catch {}
          epubRenditionRef.current = null
        }
        if (epubBookRef.current) {
          try {
            epubBookRef.current.destroy()
          } catch {}
          epubBookRef.current = null
        }
        if (viewerRef.current) {
          viewerRef.current.innerHTML = ''
        }

        // Fetch ArrayBuffer first for reliability
        let epubBook: any
        try {
          const res = await fetch(activeFileUrl)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const arrayBuffer = await res.arrayBuffer()
          epubBook = ePub(arrayBuffer)
        } catch {
          epubBook = ePub(activeFileUrl)
        }

        if (!isMounted || !viewerRef.current) return
        epubBookRef.current = epubBook

        const rendition = epubBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'auto',
        })
        epubRenditionRef.current = rendition

        // Apply clean theme colors in epub.js
        rendition.themes.register('light', {
          'html, body': { background: '#ffffff', color: '#14171a', 'font-family': 'Georgia, serif' },
        })
        rendition.themes.register('sepia', {
          'html, body': { background: '#fbf0d9', color: '#5f4b32', 'font-family': 'Georgia, serif' },
        })
        rendition.themes.register('dark', {
          'html, body': { background: '#18181b', color: '#f4f4f5', 'font-family': 'Georgia, serif' },
        })

        applyThemeToRendition(themeRef.current)
        rendition.themes.fontSize(`${fontSize}%`)

        // Touch gestures directly on rendition
        rendition.on('touchstart', (e: TouchEvent) => {
          if (!isMounted) return
          if (e.touches && e.touches[0]) {
            touchStartRef.current?.(e.touches[0].clientX, e.touches[0].clientY)
          }
        })

        rendition.on('touchmove', (e: TouchEvent) => {
          if (!isMounted) return
          if (e.touches && e.touches[0]) {
            touchMoveRef.current?.(e.touches[0].clientX, e.touches[0].clientY, () => {
              if (e.cancelable) e.preventDefault()
            })
          }
        })

        rendition.on('touchend', (e: TouchEvent) => {
          if (!isMounted) return
          const t = e.changedTouches?.[0]
          touchEndRef.current?.(t ? t.clientX : 0, t ? t.clientY : undefined)
        })

        rendition.on('touchcancel', () => {
          if (!isMounted) return
          touchEndRef.current?.(0, undefined, true)
        })

        // Capture text selection on mouseup inside the EPUB iframe and position toolbar directly above it
        rendition.hooks.content.register((contents: any) => {
          applyThemeToRendition(themeRef.current)
          const doc = contents.document
          if (!doc) return

          doc.addEventListener('mouseup', () => {
            if (!isMounted) return
            const win = contents.window
            const sel = win?.getSelection()
            if (sel && sel.rangeCount > 0 && sel.toString()?.trim()?.length > 1) {
              const range = sel.getRangeAt(0)
              const iframeEl = doc.defaultView?.frameElement || viewerRef.current?.querySelector('iframe')
              updateSelectionFromRangeRef.current?.(range, iframeEl)
            }
          })

          doc.addEventListener('mousedown', () => {
            if (!isMounted) return
            const win = contents.window
            const sel = win?.getSelection()
            if (!sel || sel.isCollapsed) {
              setShowSelectionBar(false)
              setSelectionPosition(null)
            }
          })

          // Touch gestures for mobile page-turn animation inside EPUB iframe
          doc.addEventListener(
            'touchstart',
            (e: TouchEvent) => {
              if (!isMounted) return
              const win = contents.window
              const sel = win?.getSelection()
              const hasSel = !!(sel && sel.toString()?.trim()?.length > 1)
              if (e.touches && e.touches[0]) {
                touchStartRef.current?.(e.touches[0].clientX, e.touches[0].clientY, hasSel)
              }
            },
            { passive: true }
          )

          doc.addEventListener(
            'touchmove',
            (e: TouchEvent) => {
              if (!isMounted) return
              if (e.touches && e.touches[0]) {
                touchMoveRef.current?.(e.touches[0].clientX, e.touches[0].clientY, () => {
                  if (e.cancelable) e.preventDefault()
                })
              }
            },
            { passive: false }
          )

          doc.addEventListener(
            'touchend',
            (e: TouchEvent) => {
              if (!isMounted) return
              const t = e.changedTouches?.[0]
              touchEndRef.current?.(t ? t.clientX : 0, t ? t.clientY : undefined)
            },
            { passive: true }
          )

          doc.addEventListener(
            'touchcancel',
            () => {
              if (!isMounted) return
              touchEndRef.current?.(0, undefined, true)
            },
            { passive: true }
          )
        })

        // Also re-apply theme on rendered event
        rendition.on('rendered', () => {
          if (!isMounted) return
          applyThemeToRendition(themeRef.current)
        })

        // Also listen to rendition.on('selected') as fallback
        rendition.on('selected', (_cfiRange: string, contents: any) => {
          if (!isMounted) return
          const sel = contents?.window?.getSelection()
          if (sel && sel.rangeCount > 0 && sel.toString()?.trim()?.length > 1) {
            const range = sel.getRangeAt(0)
            const iframeEl = contents.document?.defaultView?.frameElement || viewerRef.current?.querySelector('iframe')
            updateSelectionFromRangeRef.current?.(range, iframeEl)
          }
        })

        // Clear selection popup when clicking outside selection
        rendition.on('click', () => {
          if (!isMounted) return
          setShowSelectionBar(false)
          setSelectionPosition(null)
        })

        // Determine saved location and page
        const savedProg = currentBook.progress || 0
        const savedPage =
          currentBook.pages > 0 && savedProg > 0
            ? Math.max(1, Math.round((currentBook.pages * savedProg) / 100))
            : 1

        setCurrentPage(savedPage)
        setProgress(savedProg)

        const savedCfi =
          typeof window !== 'undefined'
            ? localStorage.getItem(`epub_cfi_${currentBook.id}`)
            : null

        await epubBook.ready

        let targetLocation: string | undefined = undefined

        if (savedCfi) {
          targetLocation = savedCfi
        } else if (savedProg > 0 && savedProg < 100) {
          try {
            await epubBook.locations.generate(600)
            const cfi = epubBook.locations.cfiFromPercentage(savedProg / 100)
            if (cfi) {
              targetLocation = cfi
            }
          } catch (e) {
            console.warn('Locations generation fallback:', e)
          }

          if (!targetLocation && epubBook.spine?.items?.length) {
            const spineIndex = Math.min(
              epubBook.spine.items.length - 1,
              Math.max(0, Math.floor(epubBook.spine.items.length * (savedProg / 100)))
            )
            targetLocation = epubBook.spine.items[spineIndex].href
          }
        }

        // Display directly at saved page
        await rendition.display(targetLocation)

        if (!isMounted) return
        setEpubLoading(false)

        // Ensure background locations generation
        if (!epubBook.locations || !epubBook.locations.length || !epubBook.locations.length()) {
          epubBook.locations.generate(600).catch(() => {})
        }

        // Track relocation and auto-save without wiping saved page on first load
        let hasInitialized = false

        rendition.on('relocated', (location: any) => {
          if (!isMounted) return
          applyThemeToRendition(themeRef.current)
          if (location && location.start) {
            if (location.start.cfi && typeof window !== 'undefined') {
              try {
                localStorage.setItem(`epub_cfi_${currentBook.id}`, location.start.cfi)
              } catch {}
            }

            let pct: number | null = null
            if (
              typeof location.start.percentage === 'number' &&
              !isNaN(location.start.percentage) &&
              location.start.percentage > 0
            ) {
              pct = location.start.percentage
            } else if (
              epubBook.locations &&
              typeof epubBook.locations.length === 'function' &&
              epubBook.locations.length() > 0
            ) {
              const p = epubBook.locations.percentageFromCfi(location.start.cfi)
              if (typeof p === 'number' && !isNaN(p) && p > 0) {
                pct = p
              }
            } else if (epubBook.spine?.items?.length && location.start.index !== undefined) {
              pct = location.start.index / epubBook.spine.items.length
            }

            // Guard against resetting to page 1 on first relocation
            if (!hasInitialized) {
              hasInitialized = true
              if ((pct === null || pct === 0) && savedProg > 0) {
                setCurrentPage(savedPage)
                setProgress(savedProg)
                return
              }
            }

            if (pct !== null && !isNaN(pct) && pct >= 0) {
              const progPercent = Math.min(100, Math.max(0, Math.round(pct * 100)))
              const calculatedPage =
                currentBook.pages > 0
                  ? Math.max(1, Math.round((currentBook.pages * progPercent) / 100))
                  : 1

              setProgress(progPercent)
              setCurrentPage(calculatedPage)
              triggerAutoSave(progPercent, calculatedPage)
            }
          }
        })
      } catch (err: any) {
        console.error('EPUB render error:', err)
        if (isMounted) {
          setEpubError(
            'No se pudo visualizar el EPUB directamente en este navegador. Puedes descargarlo o registrar tu lectura manualmente.'
          )
          setEpubLoading(false)
        }
      }
    }

    const timer = setTimeout(() => {
      initEpub()
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      if (epubRenditionRef.current) {
        try {
          epubRenditionRef.current.destroy()
        } catch {}
        epubRenditionRef.current = null
      }
      if (epubBookRef.current) {
        try {
          epubBookRef.current.destroy()
        } catch {}
        epubBookRef.current = null
      }
    }
  }, [open, activeFileUrl, isEpub, currentBook.id])

  // Update EPUB theme & font size
  useEffect(() => {
    applyThemeToRendition(theme)
    if (epubRenditionRef.current) {
      try {
        epubRenditionRef.current.themes.fontSize(`${fontSize}%`)
      } catch {}
    }
  }, [theme, fontSize, applyThemeToRendition])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept arrow keys if user is typing in inputs or textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key === 'Escape') {
          setJumpInputOpen(false)
        }
        return
      }

      if (e.key === 'ArrowRight') {
        triggerPageTurn('next')
      } else if (e.key === 'ArrowLeft') {
        triggerPageTurn('prev')
      } else if (e.key === 'f' || e.key === 'F') {
        if (!noteModalOpen && !notesDrawerOpen) {
          setIsImmersive((prev) => !prev)
        }
      } else if (e.key === 'Escape') {
        if (isImmersive) {
          setIsImmersive(false)
        } else if (settingsOpen) {
          setSettingsOpen(false)
        } else if (jumpInputOpen) {
          setJumpInputOpen(false)
        } else if (noteModalOpen) {
          setNoteModalOpen(false)
        } else if (notesDrawerOpen) {
          setNotesDrawerOpen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, triggerPageTurn, isImmersive, settingsOpen, jumpInputOpen, noteModalOpen, notesDrawerOpen, onClose])

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={`w-full h-[100dvh] sm:h-full rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${
            isImmersive
              ? 'max-w-none max-h-none sm:max-h-full sm:rounded-none'
              : 'max-w-6xl max-h-[100dvh] sm:max-h-[94vh]'
          } ${
            theme === 'dark'
              ? 'bg-zinc-900 text-zinc-100'
              : theme === 'sepia'
              ? 'bg-[#fbf0d9] text-[#5f4b32]'
              : 'bg-white text-gray-900'
          }`}
        >
          {/* Streamlined, Minimal Header */}
          {!isImmersive && (
            <header
              className={`px-3 sm:px-6 py-2 sm:py-2.5 border-b flex items-center justify-between gap-2 sm:gap-3 z-30 transition-colors shrink-0 ${
                theme === 'dark'
                  ? 'bg-zinc-950/80 border-zinc-800'
                  : theme === 'sepia'
                  ? 'bg-[#f4e4c2]/80 border-[#ecd9b5]'
                  : 'bg-white border-neutral-100 shadow-2xs'
              } backdrop-blur-md`}
            >
              {/* Left: Book info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={onClose}
                  className="p-1 sm:p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer text-neutral-500 hover:text-neutral-900 shrink-0"
                  title="Cerrar visor (Esc)"
                >
                  <X size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold truncate max-w-[130px] sm:max-w-xs md:max-w-md leading-tight">
                    {currentBook.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] opacity-60 truncate">
                    {currentBook.author}
                  </p>
                </div>
              </div>

              {/* Center: Discreet Reading Info Pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-[11px] font-medium text-neutral-600 shrink-0">
                <span>Pág. {currentPage} de {totalPages}</span>
                {timerActive && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="font-mono text-neutral-800 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {formatTime(secondsRead)}
                    </span>
                  </>
                )}
              </div>

              {/* Right: Consolidated Controls (Aa Settings, Notes & Quotes, Immersive Mode) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
                {/* Aa Settings Popover */}
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      settingsOpen
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200/90 hover:border-neutral-300 shadow-2xs'
                    }`}
                    title="Ajustes de lectura (Tema, fuente, cronómetro)"
                  >
                    <span
                      className={`font-serif font-bold text-xs tracking-tight px-1 py-0.5 rounded transition ${
                        settingsOpen
                          ? 'bg-neutral-800 text-white border border-white/20'
                          : 'bg-neutral-100 text-neutral-900 border border-neutral-200/70'
                      }`}
                    >
                      Aa
                    </span>
                    <span className="text-[11px] font-medium hidden sm:inline">Ajustes</span>
                  </button>

                  {/* Aa Settings Dropdown Menu */}
                  <AnimatePresence>
                    {settingsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 border border-neutral-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 space-y-4 text-neutral-800 dark:text-neutral-100 ring-1 ring-black/5"
                      >
                        {/* Tema */}
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">Tema visual</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => setTheme('light')}
                              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                theme === 'light'
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                                  : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                              }`}
                            >
                              <Sun size={13} />
                              <span>Claro</span>
                            </button>
                            <button
                              onClick={() => setTheme('sepia')}
                              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                theme === 'sepia'
                                  ? 'bg-[#5f4b32] text-[#fbf0d9] border-[#5f4b32] shadow-2xs'
                                  : 'bg-[#fbf0d9] hover:bg-[#f4e4c2] text-[#5f4b32] border-[#ecd9b5]'
                              }`}
                            >
                              <BookOpen size={13} />
                              <span>Sepia</span>
                            </button>
                            <button
                              onClick={() => setTheme('dark')}
                              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                theme === 'dark'
                                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-2xs'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                              }`}
                            >
                              <Moon size={13} />
                              <span>Oscuro</span>
                            </button>
                          </div>
                        </div>

                        {/* Tamaño de fuente (EPUB) */}
                        {isEpub && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tamaño de letra</span>
                              <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300">{fontSize}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-neutral-100/90 dark:bg-zinc-800 p-1 rounded-xl">
                              <button
                                onClick={() => setFontSize((s) => Math.max(70, s - 10))}
                                className="flex-1 py-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
                              >
                                <ZoomOut size={13} />
                                <span>A-</span>
                              </button>
                              <button
                                onClick={() => setFontSize(100)}
                                className="px-2 py-1.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                              >
                                Reset
                              </button>
                              <button
                                onClick={() => setFontSize((s) => Math.min(180, s + 10))}
                                className="flex-1 py-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
                              >
                                <ZoomIn size={13} />
                                <span>A+</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Sesión de Lectura (Cronómetro) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Sesión de lectura</span>
                            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">{formatTime(secondsRead)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTimerActive(!timerActive)}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                timerActive
                                  ? 'bg-neutral-800 text-white shadow-xs'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                              }`}
                            >
                              {timerActive ? <Pause size={13} /> : <Play size={13} />}
                              <span>{timerActive ? 'Pausar' : 'Iniciar sesión'}</span>
                            </button>
                            {secondsRead > 0 && !timerActive && (
                              <button
                                onClick={() => setSecondsRead(0)}
                                className="p-2 rounded-xl border border-neutral-200 dark:border-zinc-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                title="Reiniciar cronómetro"
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Estado de sincronización */}
                        <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Sincronización</span>
                          {saveStatus === 'saving' ? (
                            <span className="flex items-center gap-1 text-indigo-500 font-medium">
                              <Loader2 size={11} className="animate-spin" /> Guardando...
                            </span>
                          ) : saveStatus === 'saved' ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <Check size={11} /> Guardado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 opacity-70">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-guardado
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notes & Quotes Drawer Button */}
                <button
                  onClick={() => setNotesDrawerOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs transition-all cursor-pointer"
                  title="Ver notas y citas de este libro"
                >
                  <QuoteIcon size={13} className="text-neutral-700" />
                  <span className="hidden sm:inline">Notas</span>
                  {bookQuotes.length + bookNotes.length > 0 && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-200 px-1.5 py-0.2 rounded-full font-bold">
                      {bookQuotes.length + bookNotes.length}
                    </span>
                  )}
                </button>

                {/* Immersive / Zen Mode Toggle */}
                <button
                  onClick={() => setIsImmersive(true)}
                  className="p-1.5 rounded-xl text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs transition-all cursor-pointer"
                  title="Modo inmersivo a pantalla completa (F)"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </header>
          )}

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs px-4 py-2 rounded-xl shadow-xl border border-white/10 flex items-center gap-2"
              >
                <Sparkles size={14} className="text-neutral-300" />
                <span>{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reader Body */}
          <main
            ref={mainContainerRef}
            onMouseUp={handleContainerMouseUp}
            onTouchStart={(e) => {
              if (e.touches && e.touches[0]) {
                const sel = window.getSelection()
                const hasSel = !!(sel && sel.toString()?.trim()?.length > 1)
                onTouchStartGeneral(e.touches[0].clientX, e.touches[0].clientY, hasSel)
              }
            }}
            onTouchMove={(e) => {
              if (e.touches && e.touches[0]) {
                onTouchMoveGeneral(e.touches[0].clientX, e.touches[0].clientY)
              }
            }}
            onTouchEnd={(e) => {
              const t = e.changedTouches?.[0]
              onTouchEndGeneral(t ? t.clientX : 0, t ? t.clientY : undefined)
            }}
            onTouchCancel={() => {
              onTouchEndGeneral(0, undefined, true)
            }}
            className={`flex-1 min-h-0 w-full relative flex flex-col overflow-hidden select-text transition-colors duration-200 touch-pan-y ${
              theme === 'dark'
                ? 'bg-zinc-900 text-zinc-100'
                : theme === 'sepia'
                ? 'bg-[#fbf0d9] text-[#5f4b32]'
                : 'bg-white text-gray-900'
            }`}
          >
            {/* Main Reading Canvas */}
            <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden select-text">
              {/* If NO file is attached or physical format */}
              {!activeFileUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                  <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 text-3xl">
                    📖
                  </div>
                  <h3 className="text-xl font-bold mb-1">Modo de Lectura y Seguimiento</h3>
                  <p className="text-sm opacity-70 max-w-md mb-6 leading-relaxed">
                    Este libro no tiene un archivo digital adjunto. Puedes registrar tus sesiones de
                    lectura, citas y notas mientras lees tu copia impresa.
                  </p>

                  <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl max-w-sm w-full border border-black/10 dark:border-white/10 text-center">
                    <p className="text-xs font-semibold mb-2">¿Tienes el archivo EPUB o PDF?</p>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl text-xs font-medium hover:opacity-90 transition">
                      <Upload size={14} />
                      <span>{isUploading ? 'Subiendo...' : 'Adjuntar archivo digital'}</span>
                      <input
                        type="file"
                        accept=".epub,.pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                    {uploadError && (
                      <p className="text-xs text-rose-500 mt-2 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-lg">
                        {uploadError}
                      </p>
                    )}
                  </div>
                </div>
              ) : isEpub ? (
                /* EPUB View */
                <div
                  className={`flex-1 relative w-full h-full flex flex-col transition-colors duration-200 ${
                    theme === 'dark'
                      ? 'bg-zinc-900 text-zinc-100'
                      : theme === 'sepia'
                      ? 'bg-[#fbf0d9] text-[#5f4b32]'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  {epubLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-inherit z-20">
                      <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs opacity-70 font-medium">Cargando libro en página {currentPage}...</p>
                    </div>
                  )}

                  {epubError ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-sm opacity-80 mb-4">{epubError}</p>
                      <a
                        href={activeFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-semibold"
                      >
                        Descargar o abrir archivo directamente
                      </a>
                    </div>
                  ) : (
                    <div
                      ref={viewerRef}
                      className={`w-full h-full flex-1 select-text transition-colors duration-200 ${
                        theme === 'dark'
                          ? 'bg-zinc-900 text-zinc-100'
                          : theme === 'sepia'
                          ? 'bg-[#fbf0d9] text-[#5f4b32]'
                          : 'bg-white text-gray-900'
                      }`}
                    />
                  )}
                </div>
              ) : isPdf ? (
                /* PDF View */
                <div className="flex-1 relative w-full h-full">
                  <iframe
                    src={`${activeFileUrl}#page=${currentPage}&toolbar=1`}
                    className="w-full h-full border-none"
                    title={currentBook.title}
                  />
                </div>
              ) : (
                /* Generic Reader View */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm opacity-70 mb-4">Formato no visualizable en este visor estándar.</p>
                  <a
                    href={activeFileUrl}
                    download
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold"
                  >
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>

            {/* 3D Realistic Book Page Flip Layer */}
            <AnimatePresence>
              {(flipAnimation || (isDragging && Math.abs(dragOffset) > 12)) && (
                <div
                  className="absolute inset-0 pointer-events-none z-40 overflow-hidden"
                  style={{ perspective: 1800 }}
                >
                  {/* Dynamic ambient shadow on base page */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: flipAnimation
                        ? 0.35
                        : Math.min(0.4, (Math.abs(dragOffset) / (typeof window !== 'undefined' ? window.innerWidth : 400)) * 0.6),
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 bg-black/25 dark:bg-black/50 pointer-events-none"
                  />

                  {/* The 3D Turning Page Leaf */}
                  <motion.div
                    key="flip-leaf"
                    initial={
                      flipAnimation
                        ? { rotateY: flipAnimation.direction === 'next' ? 0 : -180 }
                        : false
                    }
                    animate={
                      flipAnimation
                        ? { rotateY: flipAnimation.direction === 'next' ? -180 : 0 }
                        : {
                            rotateY:
                              dragOffset < 0
                                ? -Math.min(180, (Math.abs(dragOffset) / (typeof window !== 'undefined' ? window.innerWidth * 0.65 : 250)) * 180)
                                : -180 + Math.min(180, (Math.abs(dragOffset) / (typeof window !== 'undefined' ? window.innerWidth * 0.65 : 250)) * 180),
                          }
                    }
                    exit={{ opacity: 0 }}
                    transition={
                      flipAnimation
                        ? { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                        : { type: 'tween', duration: 0 }
                    }
                    style={{
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                    }}
                    className={`absolute inset-0 w-full h-full shadow-[0_15px_35px_rgba(0,0,0,0.45)] border-r ${
                      theme === 'dark'
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-800'
                        : theme === 'sepia'
                        ? 'bg-[#fbf0d9] text-[#5f4b32] border-[#ebd8b3]'
                        : 'bg-white text-gray-900 border-neutral-200'
                    }`}
                  >
                    {/* Front of Page (visible from 0 to -90 deg) */}
                    <div
                      className="absolute inset-0 w-full h-full p-6 sm:p-10 flex flex-col justify-between overflow-hidden select-none"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex justify-between items-center opacity-40 text-[11px] font-serif border-b border-current/15 pb-2">
                        <span className="truncate max-w-[200px]">{currentBook.title}</span>
                        <span>Página {currentPage}</span>
                      </div>

                      <div className="space-y-3.5 opacity-20 my-auto">
                        <div className="h-2.5 rounded-full bg-current w-full" />
                        <div className="h-2.5 rounded-full bg-current w-[92%]" />
                        <div className="h-2.5 rounded-full bg-current w-[96%]" />
                        <div className="h-2.5 rounded-full bg-current w-[86%]" />
                        <div className="h-2.5 rounded-full bg-current w-[94%]" />
                        <div className="h-2.5 rounded-full bg-current w-[88%]" />
                        <div className="h-2.5 rounded-full bg-current w-[95%]" />
                        <div className="h-2.5 rounded-full bg-current w-[75%]" />
                      </div>

                      {/* Spine Crease Shadow */}
                      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />

                      <div className="flex justify-between items-center opacity-40 text-[11px] font-serif border-t border-current/15 pt-2">
                        <span>{currentBook.author || 'LitHub'}</span>
                        <span>{Math.round((currentPage / totalPages) * 100)}%</span>
                      </div>
                    </div>

                    {/* Back of Page (visible from -90 to -180 deg) */}
                    <div
                      className="absolute inset-0 w-full h-full p-6 sm:p-10 flex flex-col justify-between overflow-hidden select-none"
                      style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      <div className="flex justify-between items-center opacity-40 text-[11px] font-serif border-b border-current/15 pb-2">
                        <span>Página {dragOffset < 0 || flipAnimation?.direction === 'next' ? Math.min(totalPages, currentPage + 1) : Math.max(1, currentPage - 1)}</span>
                        <span className="truncate max-w-[200px]">{currentBook.title}</span>
                      </div>

                      <div className="space-y-3.5 opacity-20 my-auto">
                        <div className="h-2.5 rounded-full bg-current w-[90%]" />
                        <div className="h-2.5 rounded-full bg-current w-[95%]" />
                        <div className="h-2.5 rounded-full bg-current w-[85%]" />
                        <div className="h-2.5 rounded-full bg-current w-[93%]" />
                        <div className="h-2.5 rounded-full bg-current w-[88%]" />
                      </div>

                      {/* Reverse Spine Shadow */}
                      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 via-black/10 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />

                      <div className="flex justify-between items-center opacity-40 text-[11px] font-serif border-t border-current/15 pt-2">
                        <span>{Math.round(((dragOffset < 0 || flipAnimation?.direction === 'next' ? Math.min(totalPages, currentPage + 1) : Math.max(1, currentPage - 1)) / totalPages) * 100)}%</span>
                        <span>{currentBook.author || 'LitHub'}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Mobile Touch Drag Indicator Badge */}
            <AnimatePresence>
              {isDragging && Math.abs(dragOffset) > 28 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className={`pointer-events-none fixed bottom-16 sm:bottom-20 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-xl border border-black/10 dark:border-white/10 ${
                    dragOffset < 0
                      ? 'right-4 sm:right-8 bg-neutral-900/90 text-white dark:bg-white/95 dark:text-neutral-950'
                      : 'left-4 sm:left-8 bg-neutral-900/90 text-white dark:bg-white/95 dark:text-neutral-950'
                  }`}
                >
                  {dragOffset < 0 ? (
                    <>
                      <span>Página siguiente</span>
                      <ChevronRight size={14} className="animate-pulse" />
                    </>
                  ) : (
                    <>
                      <ChevronLeft size={14} className="animate-pulse" />
                      <span>Página anterior</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Selection Tool (Quote / Note) directly above selected text */}
            <AnimatePresence>
              {showSelectionBar && selectedText && selectionPosition && (
                <motion.div
                  ref={toolbarRef}
                  initial={{ opacity: 0, scale: 0.95, y: selectionPosition.isFlipped ? -6 : 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: selectionPosition.isFlipped ? -6 : 6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  style={{
                    position: 'absolute',
                    left: `${selectionPosition.left}px`,
                    top: `${selectionPosition.top}px`,
                  }}
                  className="z-50 bg-white text-neutral-900 rounded-2xl px-3 py-1.5 shadow-xl border border-neutral-200/90 flex items-center gap-2 max-w-[calc(100%-32px)] select-none pointer-events-auto"
                >
                  {/* Arrow Indicator pointing directly at selected text */}
                  <div
                    style={{
                      left: `${selectionPosition.arrowX}px`,
                    }}
                    className={`absolute -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent pointer-events-none ${
                      selectionPosition.isFlipped
                        ? 'bottom-full -mb-[1px] border-b-[6px] border-b-white'
                        : 'top-full -mt-[1px] border-t-[6px] border-t-white'
                    }`}
                  />

                  <div className="max-w-[120px] sm:max-w-[170px] truncate text-xs text-neutral-500 italic font-serif">
                    «{selectedText}»
                  </div>

                  <div className="h-4 w-[1px] bg-neutral-200 shrink-0" />

                  {/* Cita button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={handleSaveAsQuote}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition active:scale-95 shrink-0 cursor-pointer"
                    title="Guardar como cita"
                  >
                    <QuoteIcon size={12} className="text-neutral-700" />
                    <span>Cita</span>
                  </button>

                  {/* Nota button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => {
                      setShowSelectionBar(false)
                      setNoteModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
                    title="Añadir nota de lectura"
                  >
                    <FileText size={12} />
                    <span>Nota</span>
                  </button>

                  {/* Dismiss button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => {
                      setSelectedText('')
                      setShowSelectionBar(false)
                      setSelectionPosition(null)
                    }}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition shrink-0 ml-0.5 cursor-pointer"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Immersive Exit Pill */}
            {isImmersive && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsImmersive(false)}
                className="absolute top-4 right-4 z-40 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-lg border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-white flex items-center gap-2 transition cursor-pointer"
                title="Salir del modo inmersivo (Esc o F)"
              >
                <Minimize2 size={14} />
                <span className="hidden sm:inline">Salir de inmersión</span>
              </motion.button>
            )}

            {/* Subtle Side Page Turners */}
            <button
              onClick={() => triggerPageTurn('prev')}
              disabled={currentPage <= 1}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-200 shadow-md border border-black/5 dark:border-white/10 opacity-0 hover:opacity-100 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 cursor-pointer"
              title="Página anterior (←)"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => triggerPageTurn('next')}
              disabled={currentPage >= totalPages}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-200 shadow-md border border-black/5 dark:border-white/10 opacity-0 hover:opacity-100 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 cursor-pointer"
              title="Página siguiente (→)"
            >
              <ChevronRight size={18} />
            </button>
          </main>

          {/* Streamlined Bottom Bar: Clean Navigation & Progress */}
          {!isImmersive && (
            <footer
              className={`px-2.5 sm:px-6 py-2 sm:py-2.5 border-t flex items-center justify-between gap-1.5 sm:gap-4 z-30 transition-colors shrink-0 ${
                theme === 'dark'
                  ? 'bg-zinc-950/80 border-zinc-800'
                  : theme === 'sepia'
                  ? 'bg-[#f4e4c2]/80 border-[#ecd9b5]'
                  : 'bg-white border-neutral-100 shadow-xs'
              } backdrop-blur-md`}
            >
              {/* Previous Page Button */}
              <button
                onClick={() => triggerPageTurn('prev')}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                title="Página anterior (←)"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Center Scrubber & Quick Page Indicator */}
              <div className="flex-1 min-w-0 max-w-xl flex items-center gap-1.5 sm:gap-3">
                {/* Clickable Quick Jump Page Indicator */}
                <div className="relative shrink-0">
                  {jumpInputOpen ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const p = parseInt(jumpInputVal)
                        if (!isNaN(p)) {
                          handlePageChange(p)
                        }
                        setJumpInputOpen(false)
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        autoFocus
                        value={jumpInputVal}
                        onChange={(e) => setJumpInputVal(e.target.value)}
                        onBlur={() => setJumpInputOpen(false)}
                        className="w-12 sm:w-14 text-center py-0.5 px-1 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] sm:text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setJumpInputVal(String(currentPage))
                        setJumpInputOpen(true)
                      }}
                      className="text-[11px] sm:text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 px-1.5 sm:px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0"
                      title="Haz clic para saltar a una página específica"
                    >
                      <span>{currentPage}</span>
                      <span className="opacity-50">/{totalPages}</span>
                    </button>
                  )}
                </div>

                {/* Slim Progress Slider */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      const p = Math.max(1, Math.round((totalPages * val) / 100))
                      setCurrentPage(p)
                      setProgress(val)
                      jumpToPercentage(val)
                      triggerAutoSave(val, p)
                    }}
                    className="flex-1 min-w-0 h-1.5 rounded-lg accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold opacity-60 w-7 sm:w-9 text-right shrink-0">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Next Page Button */}
              <button
                onClick={() => triggerPageTurn('next')}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                title="Página siguiente (→)"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </footer>
          )}

          {/* Note Creation Modal */}
          <AnimatePresence>
            {noteModalOpen && (
              <div
                className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setNoteModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-zinc-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold flex items-center gap-2">
                        <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Nueva Nota de Lectura</span>
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {currentBook.title} • Página {currentPage}
                      </p>
                    </div>
                    <button
                      onClick={() => setNoteModalOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {selectedText && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 italic leading-relaxed">
                      «{selectedText}»
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-zinc-300">
                      Tus impresiones o pensamientos:
                    </label>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      rows={4}
                      placeholder="¿Qué te hizo pensar este fragmento o escena? Anota aquí tus reflexiones..."
                      className="w-full text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setNoteModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={!noteInput.trim()}
                      className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 disabled:opacity-40 rounded-xl transition shadow-sm"
                    >
                      Guardar Nota
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Notes & Quotes Drawer Side Panel */}
          <AnimatePresence>
            {notesDrawerOpen && (
              <div
                className="fixed inset-0 z-[125] bg-black/40 backdrop-blur-xs flex justify-end"
                onClick={() => setNotesDrawerOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md h-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800"
                >
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">Anotaciones del Libro</h4>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate max-w-[280px]">
                        {currentBook.title}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotesDrawerOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Drawer Tabs */}
                  <div className="flex border-b border-gray-100 dark:border-zinc-800 text-xs font-semibold">
                    <button
                      onClick={() => setDrawerTab('quotes')}
                      className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
                        drawerTab === 'quotes'
                          ? 'border-b-2 border-gray-900 dark:border-white font-bold'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <QuoteIcon size={13} className="text-amber-500" />
                      <span>Citas ({bookQuotes.length})</span>
                    </button>
                    <button
                      onClick={() => setDrawerTab('notes')}
                      className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
                        drawerTab === 'notes'
                          ? 'border-b-2 border-gray-900 dark:border-white font-bold'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <FileText size={13} className="text-indigo-500" />
                      <span>Notas ({bookNotes.length})</span>
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {drawerTab === 'quotes' && (
                      <>
                        {bookQuotes.length === 0 ? (
                          <div className="py-12 text-center text-gray-400 space-y-2">
                            <QuoteIcon size={24} className="mx-auto opacity-30 text-amber-500" />
                            <p className="text-xs">No hay citas guardadas en este libro.</p>
                            <p className="text-[11px] opacity-70">
                              Selecciona texto en el libro y pulsa &quot;Guardar Cita&quot;.
                            </p>
                          </div>
                        ) : (
                          bookQuotes.map((q) => (
                            <div
                              key={q.id}
                              className="group p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80 relative text-xs space-y-2 hover:shadow-sm transition"
                            >
                              <p className="italic text-gray-800 dark:text-zinc-200 leading-relaxed">
                                «{q.text}»
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-black/5 dark:border-white/5">
                                <span>Pág. {q.page || '—'}</span>
                                <button
                                  onClick={() => deleteQuote(q.id)}
                                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                                  title="Eliminar cita"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}

                    {drawerTab === 'notes' && (
                      <>
                        {bookNotes.length === 0 ? (
                          <div className="py-12 text-center text-gray-400 space-y-2">
                            <FileText size={24} className="mx-auto opacity-30 text-indigo-500" />
                            <p className="text-xs">No hay notas guardadas en este libro.</p>
                            <p className="text-[11px] opacity-70">
                              Selecciona texto y pulsa &quot;Crear Nota&quot; para plasmar tus pensamientos.
                            </p>
                          </div>
                        ) : (
                          bookNotes.map((n) => (
                            <div
                              key={n.id}
                              className="group p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80 relative text-xs space-y-2 hover:shadow-sm transition"
                            >
                              <p className="text-gray-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {n.text}
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-black/5 dark:border-white/5">
                                <span>Pág. {n.page || '—'}</span>
                                <button
                                  onClick={() => deleteNote(n.id)}
                                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                                  title="Eliminar nota"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
