'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  AppData,
  Book,
  Collection,
  Quote,
  Note,
  ReadingSession,
} from './store'
import { useAuth } from './auth-context'
import { getGuestInitialData } from './sample-books'
import BookReaderModal from '@/components/reader/BookReaderModal'

interface AppContextValue {
  data: AppData
  isLoadingData: boolean
  refresh: () => Promise<void>
  addBook: (book: Omit<Book, 'id' | 'addedAt'>) => Promise<Book | null>
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  addCollection: (name: string, description?: string, coverColor?: string) => Promise<Collection | null>
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  addQuote: (q: Omit<Quote, 'id' | 'createdAt'>) => Promise<Quote | null>
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note | null>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  addSession: (s: Omit<ReadingSession, 'id'>) => Promise<ReadingSession | null>
  deleteSession: (id: string) => Promise<void>
  activeReaderBook: Book | null
  openReader: (book: Book) => Promise<void>
  closeReader: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    books: [],
    collections: [],
    quotes: [],
    notes: [],
    sessions: [],
  })
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)
  const [activeReaderBook, setActiveReaderBook] = useState<Book | null>(null)
  const { currentUser, isAuthenticated, isGuest } = useAuth()

  const refresh = useCallback(async () => {
    setIsLoadingData(true)
    try {
      if (isGuest) {
        try {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('lithub_guest_data') : null
          if (stored) {
            setData(JSON.parse(stored))
            return
          }
        } catch {
          /* fallback to default */
        }
        const initial = getGuestInitialData()
        setData(initial)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('lithub_guest_data', JSON.stringify(initial))
          }
        } catch {
          /* ignore */
        }
        return
      }

      if (!isAuthenticated || !currentUser) {
        setData({ books: [], collections: [], quotes: [], notes: [], sessions: [] })
        return
      }

      const [booksRes, colsRes, quotesRes, notesRes] = await Promise.all([
        fetch('/api/books', { cache: 'no-store' }),
        fetch('/api/collections', { cache: 'no-store' }),
        fetch('/api/quotes', { cache: 'no-store' }),
        fetch('/api/notes', { cache: 'no-store' }),
      ])

      const booksData = booksRes.ok ? await booksRes.json() : { books: [] }
      const colsData = colsRes.ok ? await colsRes.json() : { collections: [] }
      const quotesData = quotesRes.ok ? await quotesRes.json() : { quotes: [] }
      const notesData = notesRes.ok ? await notesRes.json() : { notes: [] }

      setData({
        books: booksData.books || [],
        collections: colsData.collections || [],
        quotes: quotesData.quotes || [],
        notes: notesData.notes || [],
        sessions: [],
      })
    } catch (err) {
      console.error('Error synchronizing data with server:', err)
    } finally {
      setIsLoadingData(false)
    }
  }, [currentUser, isAuthenticated, isGuest])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addBook = async (book: Omit<Book, 'id' | 'addedAt'>): Promise<Book | null> => {
    if (isGuest) {
      const newBook: Book = {
        ...book,
        id: `guest-book-${Date.now()}`,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setData((prev) => {
        const updated = { ...prev, books: [newBook, ...prev.books] }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {
          /* ignore */
        }
        return updated
      })
      return newBook
    }

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.book) {
          setData((prev) => ({
            ...prev,
            books: [result.book, ...prev.books],
          }))
          return result.book
        }
      }
      return null
    } catch (error) {
      console.error('Error adding book:', error)
      return null
    }
  }

  const updateBook = async (id: string, updates: Partial<Book>) => {
    if (isGuest) {
      setData((prev) => {
        const updated = {
          ...prev,
          books: prev.books.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b)),
        }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {
          /* ignore */
        }
        return updated
      })
      return
    }

    try {
      setData((prev) => ({
        ...prev,
        books: prev.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }))
      await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error('Error updating book:', error)
      refresh()
    }
  }

  const deleteBook = async (id: string) => {
    if (isGuest) {
      setData((prev) => {
        const updated = {
          ...prev,
          books: prev.books.filter((b) => b.id !== id),
          quotes: prev.quotes.filter((q) => q.bookId !== id),
        }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {
          /* ignore */
        }
        return updated
      })
      return
    }

    try {
      setData((prev) => ({
        ...prev,
        books: prev.books.filter((b) => b.id !== id),
        quotes: prev.quotes.filter((q) => q.bookId !== id),
      }))
      await fetch(`/api/books/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error deleting book:', error)
      refresh()
    }
  }

  const addCollection = async (
    name: string,
    description?: string
  ): Promise<Collection | null> => {
    if (isGuest) {
      const newCol: Collection = {
        id: `guest-col-${Date.now()}`,
        name,
        description,
        createdAt: new Date().toISOString(),
      }
      setData((prev) => {
        const updated = { ...prev, collections: [newCol, ...prev.collections] }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {
          /* ignore */
        }
        return updated
      })
      return newCol
    }

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.collection) {
          setData((prev) => ({
            ...prev,
            collections: [result.collection, ...prev.collections],
          }))
          return result.collection
        }
      }
      return null
    } catch (error) {
      console.error('Error creating collection:', error)
      return null
    }
  }

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      setData((prev) => ({
        ...prev,
        collections: prev.collections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }))
      await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error('Error updating collection:', error)
      refresh()
    }
  }

  const deleteCollection = async (id: string) => {
    try {
      setData((prev) => ({
        ...prev,
        collections: prev.collections.filter((c) => c.id !== id),
        books: prev.books.map((b) => (b.sagaId === id ? { ...b, sagaId: null } : b)),
      }))
      await fetch(`/api/collections/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error deleting collection:', error)
      refresh()
    }
  }

  const addQuote = async (q: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote | null> => {
    if (isGuest) {
      const quote: Quote = {
        ...q,
        id: `guest-quote-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setData((prev) => {
        const updated = { ...prev, quotes: [quote, ...prev.quotes] }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {}
        return updated
      })
      return quote
    }

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.quote) {
          setData((prev) => ({
            ...prev,
            quotes: [result.quote, ...prev.quotes],
          }))
          return result.quote
        }
      }
      return null
    } catch (error) {
      console.error('Error creating quote:', error)
      return null
    }
  }

  const updateQuote = async (id: string, updates: Partial<Quote>): Promise<void> => {
    if (isGuest) {
      setData((prev) => {
        const updated = {
          ...prev,
          quotes: prev.quotes.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {}
        return updated
      })
      return
    }

    try {
      setData((prev) => ({
        ...prev,
        quotes: prev.quotes.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      }))
      await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error('Error updating quote:', error)
      refresh()
    }
  }

  const deleteQuote = async (id: string) => {
    if (isGuest) {
      setData((prev) => {
        const updated = {
          ...prev,
          quotes: prev.quotes.filter((q) => q.id !== id),
        }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {}
        return updated
      })
      return
    }

    try {
      setData((prev) => ({
        ...prev,
        quotes: prev.quotes.filter((q) => q.id !== id),
      }))
      await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error deleting quote:', error)
      refresh()
    }
  }

  const addNote = async (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> => {
    if (isGuest) {
      const note: Note = {
        ...n,
        id: `guest-note-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setData((prev) => {
        const updated = { ...prev, notes: [note, ...prev.notes] }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {}
        return updated
      })
      return note
    }

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n),
      })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.note) {
          setData((prev) => ({
            ...prev,
            notes: [result.note, ...prev.notes],
          }))
          return result.note
        }
      }
      return null
    } catch (error) {
      console.error('Error creating note:', error)
      return null
    }
  }

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }))
  }

  const deleteNote = async (id: string) => {
    if (isGuest) {
      setData((prev) => {
        const updated = {
          ...prev,
          notes: prev.notes.filter((n) => n.id !== id),
        }
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {}
        return updated
      })
      return
    }

    try {
      setData((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
      }))
      await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error deleting note:', error)
      refresh()
    }
  }

  const addSession = async (s: Omit<ReadingSession, 'id'>): Promise<ReadingSession | null> => {
    const session: ReadingSession = { ...s, id: Date.now().toString() }
    setData((prev) => ({ ...prev, sessions: [session, ...prev.sessions] }))
    return session
  }

  const deleteSession = async (id: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }))
  }

  const openReader = async (book: Book) => {
    const now = new Date().toISOString()
    const updates: Partial<Book> = {
      lastOpenedAt: now,
      status: 'reading',
    }
    if (!book.dateStarted) {
      updates.dateStarted = now.slice(0, 10)
    }

    const updatedBook: Book = { ...book, ...updates }
    setData((prev) => {
      const updated = {
        ...prev,
        books: prev.books.map((b) => (b.id === book.id ? { ...b, ...updates } : b)),
      }
      if (isGuest) {
        try {
          localStorage.setItem('lithub_guest_data', JSON.stringify(updated))
        } catch {
          /* ignore */
        }
      }
      return updated
    })
    setActiveReaderBook(updatedBook)

    if (isGuest) return

    try {
      await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch (err) {
      console.error('Error updating book last opened:', err)
    }
  }

  const closeReader = () => {
    setActiveReaderBook(null)
  }

  return (
    <AppContext.Provider
      value={{
        data,
        isLoadingData,
        refresh,
        addBook,
        updateBook,
        deleteBook,
        addCollection,
        updateCollection,
        deleteCollection,
        addQuote,
        updateQuote,
        deleteQuote,
        addNote,
        updateNote,
        deleteNote,
        addSession,
        deleteSession,
        activeReaderBook,
        openReader,
        closeReader,
      }}
    >
      {children}
      {activeReaderBook && (
        <BookReaderModal
          book={activeReaderBook}
          open={!!activeReaderBook}
          onClose={closeReader}
        />
      )}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
