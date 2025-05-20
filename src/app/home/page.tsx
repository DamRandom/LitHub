'use client'

import Navbar from '@/components/Navbar'
import ContinueReading from '@/components/ContinueReading'
import BooksToReadLater from '@/components/BooksToReadLater'
import TabsSection from '@/components/TabsSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <Navbar />

      <main className="min-h-screen w-full bg-gray-100 p-0 m-0">
        <ContinueReading />
        <BooksToReadLater />
        <TabsSection />
      </main>

      <Footer />
    </div>
  )
}
