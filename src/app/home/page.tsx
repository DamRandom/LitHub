'use client'

import BooksToReadLater from '@/components/BooksToReadLater'
import ContinueReading from '@/components/ContinueReading'
import TabsSection from '@/components/TabsSection'

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gray-100 p-0 m-0">
      <ContinueReading />
      <BooksToReadLater />
      <TabsSection />
    </main>
  )
}
