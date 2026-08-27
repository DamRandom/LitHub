'use client'

import Navbar from '@/components/Navbar'
import Stats from '@/components/Stats'
import Footer from '@/components/Footer'

export default function StatsPage() {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full pt-24 pb-12 px-4 sm:px-6">
        <div className="bg-white/40 shadow-2xl rounded-2xl max-w-5xl mx-auto min-h-[70vh]">
          <Stats />
        </div>
      </main>
      <Footer />
    </div>
  )
}
