'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useApp } from '@/lib/context'
import Navbar from '@/components/Navbar'
import ContinueReading from '@/components/ContinueReading'
import BooksToReadLater from '@/components/BooksToReadLater'
import TabsSection from '@/components/TabsSection'
import Footer from '@/components/Footer'

export default function DashboardPage() {
  const { isAuthenticated, isGuest, isLoading } = useAuth()
  const { isLoadingData } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuest) {
      router.replace('/')
    }
  }, [isAuthenticated, isGuest, isLoading, router])

  if (isLoading || (!isAuthenticated && !isGuest) || isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-[3px] border-neutral-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-neutral-500 font-medium tracking-wide">Cargando biblioteca...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-3 sm:px-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2.5 sm:gap-4 bg-neutral-900/90 backdrop-blur-xl text-white rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.3)] border border-white/15 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                ✨
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-none flex items-center gap-1.5 sm:gap-2">
                  <span>Guest mode</span>
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">Preview</span>
                </p>
                <p className="text-[10px] sm:text-[11px] text-white/60 mt-1 truncate">
                  Your library won&apos;t be saved — sign up to keep everything.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="flex-shrink-0 bg-white text-neutral-900 hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all shadow-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
      <main className="flex-1 w-full pt-20">
        <ContinueReading />
        <BooksToReadLater />
        <TabsSection />
      </main>
      <Footer />
    </div>
  )
}
