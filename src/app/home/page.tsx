'use client'

import BooksToReadLater from '@/components/BooksToReadLater'
import ContinueReading from '@/components/ContinueReading'

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gray-100 p-0 m-0">
      <ContinueReading />
      <BooksToReadLater />
    </main>
  )
}
