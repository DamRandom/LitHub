'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Stats from '@/components/Stats'
import Footer from '@/components/Footer'
import { useAuth } from '@/lib/auth-context'

export default function StatsPage() {
  const { isAuthenticated, isGuest, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuest) {
      router.replace('/')
    }
  }, [isAuthenticated, isGuest, isLoading, router])

  if (isLoading || (!isAuthenticated && !isGuest)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      <main className="flex-1 w-full pt-20 sm:pt-24 pb-12 px-3 sm:px-6">
        <div className="lithub-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 max-w-5xl mx-auto min-h-[70vh] ring-1 ring-black/[0.03]">
          <Stats />
        </div>
      </main>
      <Footer />
    </div>
  )
}
