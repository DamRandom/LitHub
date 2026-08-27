'use client'

import Navbar from '@/components/Navbar'
import Collections from '@/components/Collections'
import Footer from '@/components/Footer'

export default function CollectionsPage() {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full pt-24 pb-12">
        <div className="backdrop-blur-lg bg-white/10 shadow-2xl rounded-xl max-w-5xl mx-auto min-h-[70vh]">
          <Collections />
        </div>
      </main>
      <Footer />
    </div>
  )
}
