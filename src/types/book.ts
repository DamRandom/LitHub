// /types/book.ts
export interface Book {
  id: string
  title: string
  author: string
  saga?: string | null
  pages: number
  format: 'physical' | 'digital'
  description: string
  status: 'reading' | 'read' | 'to-read' | 'abandoned'
  progress: number
  genres?: string[]
  publisher?: string
  isbn?: string
  publicationDate?: string
  coverImage?: string
  dateStarted?: string | null
  dateFinished?: string | null
}
