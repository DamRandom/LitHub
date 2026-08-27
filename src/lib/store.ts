// Central data store using localStorage
export interface Book {
  id: string
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
  dateStarted?: string | null
  dateFinished?: string | null
  rating?: number | null
  language?: string
  favorite?: boolean
  notesCount?: number
  addedAt?: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  coverColor?: string
  createdAt: string
}

export interface Quote {
  id: string
  bookId: string
  text: string
  page?: number
  chapter?: string
  createdAt: string
  favorite: boolean
}

export interface Note {
  id: string
  bookId: string
  text: string
  page?: number
  chapter?: string
  createdAt: string
  updatedAt: string
}

export interface ReadingSession {
  id: string
  bookId: string
  date: string          // ISO date string YYYY-MM-DD
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

function getDefaultData(): AppData {
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
export function addCollection(name: string, description?: string, coverColor?: string): Collection {
  const data = loadData()
  const col: Collection = {
    id: generateId(),
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

// ---------- Seed helpers (for demo) ----------
export function seedDemoData(): void {
  const existing = loadData()
  if (existing.books.length > 0) return // already seeded

  const demoBooks: Book[] = [
    {
      id: 'b1',
      title: 'Silence and Shadow',
      author: 'Erin Beaty',
      sagaId: 'c1',
      pages: 464,
      format: 'physical',
      description: 'After confronting a killer and fleeing her home to be with each other, Cat and Simon arrive in the sprawling city of Londunium pretending to be a newly married couple...',
      status: 'reading',
      progress: 48,
      tags: ['fantasy', 'young adult', 'romance', 'mystery', 'magic'],
      coverImage: '/images/books/SilenceandShadow.jpg',
      dateStarted: '2025-05-02',
      dateFinished: null,
      rating: null,
      language: 'en',
      favorite: false,
      publisher: 'Farrar, Straus and Giroux (BYR)',
      isbn: '9781250755841',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b2',
      title: 'Blood and Moonlight',
      author: 'Erin Beaty',
      sagaId: 'c1',
      pages: 448,
      format: 'physical',
      description: 'Rising above the city of Collis is the holy Sanctum, watched over by Catrin, an orphan girl with a rare ability to see structural flaws...',
      status: 'finished',
      progress: 100,
      tags: ['fantasy', 'young adult', 'mystery', 'romance'],
      coverImage: '/images/books/Blood and Moonlight.jpg',
      dateStarted: '2025-01-02',
      dateFinished: '2025-01-18',
      rating: 4,
      language: 'en',
      favorite: false,
      publisher: 'Farrar, Straus and Giroux (BYR)',
      isbn: '9781250755810',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b3',
      title: 'Updraft',
      author: 'Fran Wilde',
      sagaId: 'c2',
      pages: 352,
      format: 'physical',
      description: 'In a city made of living bone that rises high above the clouds, Kirit Densira dreams of joining her mother as a flier and trader...',
      status: 'finished',
      progress: 100,
      tags: ['fantasy', 'young adult', 'fiction', 'steampunk'],
      coverImage: '/images/books/Updraft.jpg',
      dateStarted: '2025-02-26',
      dateFinished: '2025-03-20',
      rating: 4,
      language: 'en',
      favorite: false,
      publisher: 'Tor Books',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b4',
      title: 'Realm of Ruins',
      author: 'Hannah West',
      sagaId: null,
      pages: 464,
      format: 'physical',
      description: 'A century after her legendary ancestors overcame a bloodthirsty tyrant, seventeen-year-old Valory Braiosa trains among the elicromancers...',
      status: 'finished',
      progress: 100,
      tags: ['fantasy', 'young adult', 'romance', 'high fantasy', 'magic'],
      coverImage: '/images/books/Realm of Ruins by Hannah West.jpeg',
      dateStarted: '2025-02-04',
      dateFinished: '2025-02-25',
      rating: 4,
      language: 'en',
      favorite: false,
      publisher: 'Holiday House',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b5',
      title: 'The Floating World',
      author: 'Axie Oh',
      sagaId: 'c3',
      pages: 360,
      format: 'physical',
      description: 'Sunho, an ex-soldier living in the Under World with no memories of his past, takes on a mission to hunt down a girl who wields silver light...',
      status: 'finished',
      progress: 100,
      tags: ['fantasy', 'young adult', 'romance', 'mythology'],
      coverImage: '/images/books/The Floating World by Axie Oh.jpeg',
      dateStarted: '2025-03-21',
      dateFinished: '2025-04-10',
      rating: 4,
      language: 'en',
      favorite: false,
      publisher: 'Feiwel & Friends',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b6',
      title: 'Anya and the Dragon',
      author: 'Sofiya Pasternack',
      sagaId: 'c4',
      pages: 394,
      format: 'physical',
      description: 'In tenth century Kievan Rus\', eleven-year-old Anya, the daughter of the village\'s only Jewish family, is drawn into a dangerous quest...',
      status: 'finished',
      progress: 100,
      tags: ['fantasy', 'middle grade', 'dragons', 'historical fiction'],
      coverImage: '/images/books/Anya and the Dragon.jpg',
      dateStarted: '2025-01-19',
      dateFinished: '2025-02-03',
      rating: 4,
      language: 'en',
      favorite: false,
      publisher: 'Houghton Mifflin Harcourt',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b7',
      title: 'Los Crímenes de Steamfield',
      author: 'Alberto Rey',
      sagaId: null,
      pages: 192,
      format: 'physical',
      description: 'La ciudad de Steamfield es testigo de dos acontecimientos sin precedentes para esta tranquila comunidad...',
      status: 'unread',
      progress: 0,
      tags: ['mystery', 'adventure', 'fiction'],
      coverImage: '/images/books/The Crimes of Steamfield by Alberto Rey.jpeg',
      dateStarted: null,
      dateFinished: null,
      rating: null,
      language: 'es',
      favorite: false,
      publisher: 'Naulibres',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b8',
      title: 'Anya and the Nightingale',
      author: 'Sofiya Pasternack',
      sagaId: 'c4',
      pages: 416,
      format: 'physical',
      description: 'The adventure continues in this sequel to Anya and the Dragon...',
      status: 'unread',
      progress: 0,
      tags: ['fantasy', 'middle grade', 'historical fiction', 'dragons'],
      coverImage: '/images/books/Anya and the Nightingale by Sofia Pasternack.jpeg',
      dateStarted: null,
      dateFinished: null,
      rating: null,
      language: 'en',
      favorite: false,
      publisher: 'Versify',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b9',
      title: 'Cloudbound',
      author: 'Fran Wilde',
      sagaId: 'c2',
      pages: 396,
      format: 'physical',
      description: 'Months after Kirit Densira overturned the order of the Spire, the sky-city built from living bone is collapsing...',
      status: 'unread',
      progress: 0,
      tags: ['fantasy', 'young adult', 'fiction', 'steampunk', 'dystopia'],
      coverImage: '/images/books/Cloudbound.jpg',
      dateStarted: null,
      dateFinished: null,
      rating: null,
      language: 'en',
      favorite: false,
      publisher: 'Tor Books',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'b10',
      title: 'The Demon and the Light',
      author: 'Axie Oh',
      sagaId: 'c3',
      pages: 400,
      format: 'physical',
      description: 'Final Fantasy meets Shadow and Bone in this follow-up to The Floating World...',
      status: 'unread',
      progress: 0,
      tags: ['fantasy', 'young adult', 'romance', 'romantasy'],
      coverImage: '/images/books/The Demon and the Light.jpg',
      dateStarted: null,
      dateFinished: null,
      rating: null,
      language: 'en',
      favorite: false,
      publisher: 'Feiwel & Friends',
      addedAt: new Date().toISOString(),
    },
  ]

  const demoCollections: Collection[] = [
    { id: 'c1', name: 'Blood & Moonlight', description: 'Erin Beaty saga', coverColor: '#6b7280', createdAt: new Date().toISOString() },
    { id: 'c2', name: 'Bone Universe', description: 'Fran Wilde saga', coverColor: '#8b5cf6', createdAt: new Date().toISOString() },
    { id: 'c3', name: 'Floating World', description: 'Axie Oh saga', coverColor: '#0ea5e9', createdAt: new Date().toISOString() },
    { id: 'c4', name: 'Anya Series', description: 'Sofiya Pasternack saga', coverColor: '#f59e0b', createdAt: new Date().toISOString() },
  ]

  const demoQuotes: Quote[] = [
    {
      id: 'q1',
      bookId: 'b2',
      text: 'The truth is rarely pure and never simple.',
      page: 124,
      createdAt: new Date().toISOString(),
      favorite: true,
    },
    {
      id: 'q2',
      bookId: 'b3',
      text: 'We build our worlds from the bones of what came before.',
      page: 67,
      createdAt: new Date().toISOString(),
      favorite: true,
    },
    {
      id: 'q3',
      bookId: 'b5',
      text: 'Sometimes the bravest thing you can do is stay.',
      page: 203,
      createdAt: new Date().toISOString(),
      favorite: false,
    },
  ]

  const demoNotes: Note[] = [
    {
      id: 'n1',
      bookId: 'b1',
      text: 'The world-building here is exceptional. The way magic interacts with the investigation plot is seamless.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      bookId: 'b3',
      text: 'Incredible concept - a city built on living bones that grows upward. The political intrigue is well-executed.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Demo reading sessions spanning several months of 2025
  const demoSessions: ReadingSession[] = [
    { id: 's1', bookId: 'b2', date: '2025-01-05', minutes: 90, pagesRead: 40 },
    { id: 's2', bookId: 'b2', date: '2025-01-10', minutes: 120, pagesRead: 60 },
    { id: 's3', bookId: 'b2', date: '2025-01-15', minutes: 75, pagesRead: 35 },
    { id: 's4', bookId: 'b2', date: '2025-01-18', minutes: 60, pagesRead: 30 },
    { id: 's5', bookId: 'b6', date: '2025-01-22', minutes: 90, pagesRead: 50 },
    { id: 's6', bookId: 'b6', date: '2025-01-28', minutes: 80, pagesRead: 45 },
    { id: 's7', bookId: 'b6', date: '2025-02-02', minutes: 100, pagesRead: 55 },
    { id: 's8', bookId: 'b6', date: '2025-02-06', minutes: 65, pagesRead: 30 },
    { id: 's9', bookId: 'b4', date: '2025-02-10', minutes: 110, pagesRead: 60 },
    { id: 's10', bookId: 'b4', date: '2025-02-15', minutes: 95, pagesRead: 50 },
    { id: 's11', bookId: 'b4', date: '2025-02-20', minutes: 85, pagesRead: 45 },
    { id: 's12', bookId: 'b4', date: '2025-02-25', minutes: 70, pagesRead: 35 },
    { id: 's13', bookId: 'b3', date: '2025-03-05', minutes: 120, pagesRead: 65 },
    { id: 's14', bookId: 'b3', date: '2025-03-12', minutes: 90, pagesRead: 50 },
    { id: 's15', bookId: 'b3', date: '2025-03-18', minutes: 80, pagesRead: 40 },
    { id: 's16', bookId: 'b3', date: '2025-03-20', minutes: 60, pagesRead: 30 },
    { id: 's17', bookId: 'b5', date: '2025-04-02', minutes: 100, pagesRead: 55 },
    { id: 's18', bookId: 'b5', date: '2025-04-08', minutes: 115, pagesRead: 60 },
    { id: 's19', bookId: 'b5', date: '2025-04-10', minutes: 90, pagesRead: 45 },
    { id: 's20', bookId: 'b1', date: '2025-05-05', minutes: 75, pagesRead: 40 },
    { id: 's21', bookId: 'b1', date: '2025-05-12', minutes: 90, pagesRead: 50 },
    { id: 's22', bookId: 'b1', date: '2025-05-20', minutes: 60, pagesRead: 30 },
    { id: 's23', bookId: 'b1', date: '2025-06-03', minutes: 85, pagesRead: 45 },
    { id: 's24', bookId: 'b1', date: '2025-06-10', minutes: 70, pagesRead: 35 },
    { id: 's25', bookId: 'b1', date: '2025-07-01', minutes: 55, pagesRead: 25 },
    { id: 's26', bookId: 'b1', date: '2025-07-15', minutes: 95, pagesRead: 50 },
  ]

  saveData({
    books: demoBooks,
    collections: demoCollections,
    quotes: demoQuotes,
    notes: demoNotes,
    sessions: demoSessions,
  })
}
