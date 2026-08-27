'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  AppData,
  Book,
  Collection,
  Quote,
  Note,
  ReadingSession,
  loadData,
  saveData,
  generateId,
  seedDemoData,
} from './store'

interface AppContextValue {
  data: AppData
  refresh: () => void
  addBook: (book: Omit<Book, 'id' | 'addedAt'>) => Book
  updateBook: (id: string, updates: Partial<Book>) => void
  deleteBook: (id: string) => void
  addCollection: (name: string, description?: string, coverColor?: string) => Collection
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  addQuote: (q: Omit<Quote, 'id' | 'createdAt'>) => Quote
  updateQuote: (id: string, updates: Partial<Quote>) => void
  deleteQuote: (id: string) => void
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  addSession: (s: Omit<ReadingSession, 'id'>) => ReadingSession
  deleteSession: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({ books: [], collections: [], quotes: [], notes: [], sessions: [] })

  const refresh = useCallback(() => {
    setData(loadData())
  }, [])

  useEffect(() => {
    seedDemoData()
    refresh()
  }, [refresh])

  function mutate(fn: (d: AppData) => void): AppData {
    const d = loadData()
    fn(d)
    saveData(d)
    setData({ ...d })
    return d
  }

  const addBook = (book: Omit<Book, 'id' | 'addedAt'>): Book => {
    let created!: Book
    mutate((d) => {
      created = { ...book, id: generateId(), addedAt: new Date().toISOString() }
      d.books.push(created)
    })
    return created
  }

  const updateBook = (id: string, updates: Partial<Book>) => {
    mutate((d) => {
      const idx = d.books.findIndex((b) => b.id === id)
      if (idx !== -1) d.books[idx] = { ...d.books[idx], ...updates }
    })
  }

  const deleteBook = (id: string) => {
    mutate((d) => {
      d.books = d.books.filter((b) => b.id !== id)
      d.quotes = d.quotes.filter((q) => q.bookId !== id)
      d.notes = d.notes.filter((n) => n.bookId !== id)
      d.sessions = d.sessions.filter((s) => s.bookId !== id)
    })
  }

  const addCollection = (name: string, description?: string, coverColor?: string): Collection => {
    let created!: Collection
    mutate((d) => {
      created = { id: generateId(), name, description, coverColor: coverColor || '#6366f1', createdAt: new Date().toISOString() }
      d.collections.push(created)
    })
    return created
  }

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    mutate((d) => {
      const idx = d.collections.findIndex((c) => c.id === id)
      if (idx !== -1) d.collections[idx] = { ...d.collections[idx], ...updates }
    })
  }

  const deleteCollection = (id: string) => {
    mutate((d) => {
      d.collections = d.collections.filter((c) => c.id !== id)
      d.books = d.books.map((b) => b.sagaId === id ? { ...b, sagaId: null } : b)
    })
  }

  const addQuote = (q: Omit<Quote, 'id' | 'createdAt'>): Quote => {
    let created!: Quote
    mutate((d) => {
      created = { ...q, id: generateId(), createdAt: new Date().toISOString() }
      d.quotes.push(created)
    })
    return created
  }

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    mutate((d) => {
      const idx = d.quotes.findIndex((q) => q.id === id)
      if (idx !== -1) d.quotes[idx] = { ...d.quotes[idx], ...updates }
    })
  }

  const deleteQuote = (id: string) => {
    mutate((d) => { d.quotes = d.quotes.filter((q) => q.id !== id) })
  }

  const addNote = (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    let created!: Note
    mutate((d) => {
      const now = new Date().toISOString()
      created = { ...n, id: generateId(), createdAt: now, updatedAt: now }
      d.notes.push(created)
    })
    return created
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    mutate((d) => {
      const idx = d.notes.findIndex((n) => n.id === id)
      if (idx !== -1) d.notes[idx] = { ...d.notes[idx], ...updates, updatedAt: new Date().toISOString() }
    })
  }

  const deleteNote = (id: string) => {
    mutate((d) => { d.notes = d.notes.filter((n) => n.id !== id) })
  }

  const addSession = (s: Omit<ReadingSession, 'id'>): ReadingSession => {
    let created!: ReadingSession
    mutate((d) => {
      created = { ...s, id: generateId() }
      d.sessions.push(created)
    })
    return created
  }

  const deleteSession = (id: string) => {
    mutate((d) => { d.sessions = d.sessions.filter((s) => s.id !== id) })
  }

  return (
    <AppContext.Provider value={{
      data, refresh,
      addBook, updateBook, deleteBook,
      addCollection, updateCollection, deleteCollection,
      addQuote, updateQuote, deleteQuote,
      addNote, updateNote, deleteNote,
      addSession, deleteSession,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
