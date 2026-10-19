// Central data store using localStorage
export interface Book {
  id: string
  usuario?: string              // User owner (FK to User.usuario)
  title: string
  author: string
  sagaId?: string | null
  pages: number
  format: 'physical' | 'pdf' | 'epub'
  description: string
  status: 'reading' | 'finished' | 'unread' | 'abandoned'
  progress: number
  genres?: string[]
  tags?: string[]
  publisher?: string
  isbn?: string
  publicationDate?: string
  coverImage?: string | null
  filePath?: string | null       // local file path for pdf/epub
  fileUrl?: string | null        // uploaded file url
  dateStarted?: string | null
  dateFinished?: string | null
  rating?: number | null
  language?: string
  favorite?: boolean
  notesCount?: number
  addedAt?: string
  updatedAt?: string
  lastOpenedAt?: string | null
}

export interface Collection {
  id: string
  usuario?: string              // User owner (FK to User.usuario)
  name: string
  description?: string
  coverColor?: string
  createdAt: string
}

export interface Quote {
  id: string
  usuario?: string              // User owner (FK to User.usuario)
  bookId: string
  text: string
  page?: number
  chapter?: string
  createdAt: string
  favorite: boolean
}

export interface Note {
  id: string
  usuario?: string              // User owner (FK to User.usuario)
  bookId: string
  text: string
  page?: number
  chapter?: string
  createdAt: string
  updatedAt: string
}

export interface ReadingSession {
  id: string
  usuario?: string              // User owner (FK to User.usuario)
  bookId: string
  date: string                  // ISO date string YYYY-MM-DD
  minutes: number
  pagesRead: number
}

export interface AppData {
  books: Book[]
  collections: Collection[]
  quotes: Quote[]
  notes: Note[]
  sessions: ReadingSession[]
}

const STORE_KEY = 'lithub_data'

export function getDefaultData(): AppData {
  return {
    books: [],
    collections: [],
    quotes: [],
    notes: [],
    sessions: [],
  }
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return getDefaultData()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return getDefaultData()
    return JSON.parse(raw) as AppData
  } catch {
    return getDefaultData()
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORE_KEY, JSON.stringify(data))
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORE_KEY)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ---------- Book helpers ----------
export function getBooks(): Book[] {
  return loadData().books
}

export function addBook(book: Omit<Book, 'id' | 'addedAt'>): Book {
  const data = loadData()
  const newBook: Book = {
    ...book,
    id: generateId(),
    addedAt: new Date().toISOString(),
  }
  data.books.push(newBook)
  saveData(data)
  return newBook
}

export function updateBook(id: string, updates: Partial<Book>): void {
  const data = loadData()
  const idx = data.books.findIndex((b) => b.id === id)
  if (idx !== -1) {
    data.books[idx] = { ...data.books[idx], ...updates }
    saveData(data)
  }
}

export function deleteBook(id: string): void {
  const data = loadData()
  data.books = data.books.filter((b) => b.id !== id)
  data.quotes = data.quotes.filter((q) => q.bookId !== id)
  data.notes = data.notes.filter((n) => n.bookId !== id)
  data.sessions = data.sessions.filter((s) => s.bookId !== id)
  saveData(data)
}

// ---------- Collection helpers ----------
export function addCollection(name: string, description?: string, coverColor?: string, usuario?: string): Collection {
  const data = loadData()
  const col: Collection = {
    id: generateId(),
    usuario,
    name,
    description,
    coverColor: coverColor || '#6366f1',
    createdAt: new Date().toISOString(),
  }
  data.collections.push(col)
  saveData(data)
  return col
}

export function updateCollection(id: string, updates: Partial<Collection>): void {
  const data = loadData()
  const idx = data.collections.findIndex((c) => c.id === id)
  if (idx !== -1) {
    data.collections[idx] = { ...data.collections[idx], ...updates }
    saveData(data)
  }
}

export function deleteCollection(id: string): void {
  const data = loadData()
  data.collections = data.collections.filter((c) => c.id !== id)
  // Remove sagaId references from books
  data.books = data.books.map((b) =>
    b.sagaId === id ? { ...b, sagaId: null } : b
  )
  saveData(data)
}

// ---------- Quote helpers ----------
export function addQuote(q: Omit<Quote, 'id' | 'createdAt'>): Quote {
  const data = loadData()
  const quote: Quote = {
    ...q,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  data.quotes.push(quote)
  saveData(data)
  return quote
}

export function updateQuote(id: string, updates: Partial<Quote>): void {
  const data = loadData()
  const idx = data.quotes.findIndex((q) => q.id === id)
  if (idx !== -1) {
    data.quotes[idx] = { ...data.quotes[idx], ...updates }
    saveData(data)
  }
}

export function deleteQuote(id: string): void {
  const data = loadData()
  data.quotes = data.quotes.filter((q) => q.id !== id)
  saveData(data)
}

// ---------- Note helpers ----------
export function addNote(n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const data = loadData()
  const now = new Date().toISOString()
  const note: Note = {
    ...n,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  data.notes.push(note)
  saveData(data)
  return note
}

export function updateNote(id: string, updates: Partial<Note>): void {
  const data = loadData()
  const idx = data.notes.findIndex((n) => n.id === id)
  if (idx !== -1) {
    data.notes[idx] = {
      ...data.notes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveData(data)
  }
}

export function deleteNote(id: string): void {
  const data = loadData()
  data.notes = data.notes.filter((n) => n.id !== id)
  saveData(data)
}

// ---------- Session helpers ----------
export function addSession(s: Omit<ReadingSession, 'id'>): ReadingSession {
  const data = loadData()
  const session: ReadingSession = { ...s, id: generateId() }
  data.sessions.push(session)
  saveData(data)
  return session
}

export function deleteSession(id: string): void {
  const data = loadData()
  data.sessions = data.sessions.filter((s) => s.id !== id)
  saveData(data)
}

// ---------- Stats helpers ----------
export function getTotalMinutes(): number {
  return loadData().sessions.reduce((acc, s) => acc + s.minutes, 0)
}

export function getMonthlyStats(year: number): { month: number; minutes: number; books: number }[] {
  const data = loadData()
  const result: { month: number; minutes: number; books: Set<string> }[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    minutes: 0,
    books: new Set<string>(),
  }))

  for (const session of data.sessions) {
    const d = new Date(session.date)
    if (d.getFullYear() === year) {
      const m = d.getMonth()
      result[m].minutes += session.minutes
      result[m].books.add(session.bookId)
    }
  }

  return result.map((r) => ({
    month: r.month,
    minutes: r.minutes,
    books: r.books.size,
  }))
}

export function getFinishedBooksPerYear(year: number): Book[] {
  return loadData().books.filter((b) => {
    if (b.status !== 'finished' || !b.dateFinished) return false
    return new Date(b.dateFinished).getFullYear() === year
  })
}
