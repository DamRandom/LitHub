'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { FiUser, FiPlus, FiLogOut, FiLogIn } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import AddBookModal from './AddBookModal'
import { useAuth } from '@/lib/auth-context'

const navLinks = [
  { name: 'Library', href: '/dashboard' },
  { name: 'Collections', href: '/collections' },
  { name: 'Quotes', href: '/quotes' },
  { name: 'Stats', href: '/stats' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isMini, setIsMini] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const lastScroll = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const { currentUser, isAuthenticated, isGuest, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) return
      const currentScroll = window.scrollY
      if (currentScroll <= 0) {
        setVisible(true)
        setIsMini(false)
        lastScroll.current = 0
        return
      }
      const scrollDown = currentScroll > lastScroll.current
      if (scrollDown) {
        setVisible(false)
        setIsMini(true)
        setUserDropdownOpen(false)
      } else {
        setVisible(true)
        setIsMini(false)
      }
      lastScroll.current = currentScroll
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [menuOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setUserDropdownOpen(false)
    router.push('/')
  }

  return (
    <>
      <motion.nav
        animate={{
          y: visible ? 0 : -60,
          height: isMini ? 8 : (menuOpen ? 'auto' : 64),
          opacity: 1,
          borderBottomLeftRadius: isMini ? '8px' : '1.25rem',
          borderBottomRightRadius: isMini ? '8px' : '1.25rem',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => isMini && setVisible(true)}
        onMouseLeave={() => isMini && setVisible(false)}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 backdrop-blur-2xl bg-white/95 shadow-[0_10px_36px_rgba(0,0,0,0.08)] rounded-b-2xl sm:rounded-b-3xl px-3.5 sm:px-6 max-w-5xl w-[calc(100%-1.25rem)] sm:w-[min(92vw,1080px)] flex flex-col text-neutral-800 select-none overflow-hidden sm:overflow-visible border-b border-neutral-200/70 ring-1 ring-black/[0.04]"
      >
        <div className="w-full flex justify-between items-center py-2 sm:py-2.5 h-16 shrink-0">
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="w-22 sm:w-24 h-7 sm:h-8 relative mr-3 sm:mr-6 flex-shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Image
              src="/logo/lithub.png"
              alt="LitHub Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>

          <div className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}

            <button
              onClick={() => setAddOpen(true)}
              className="ml-2 flex items-center gap-1.5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FiPlus size={15} />
              <span>Add</span>
            </button>

            {/* User Profile & Menu */}
            <div className="relative ml-2" ref={dropdownRef}>
              {isAuthenticated && currentUser ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/80 hover:bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs transition-all text-neutral-800 cursor-pointer"
                  aria-label="User profile"
                >
                  <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.nombre.charAt(0)}
                    {currentUser.apellido.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold max-w-[100px] truncate text-neutral-900">
                    {currentUser.nombre}
                  </span>
                </button>
              ) : isGuest ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-amber-50 hover:bg-amber-100/70 border border-amber-200/70 shadow-2xs transition-all text-amber-900 cursor-pointer"
                  aria-label="Guest user"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-400 text-amber-950 font-bold text-[11px] flex items-center justify-center shadow-xs">
                    ✦
                  </div>
                  <span className="text-xs font-semibold text-amber-900">Guest</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FiLogIn size={14} />
                  <span>Sign In</span>
                </Link>
              )}

              {/* User Dropdown */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-200/80 py-2 text-neutral-700 z-50 overflow-hidden"
                  >
                    {currentUser ? (
                      <>
                        {/* User summary */}
                        <div className="px-4 py-2.5 border-b border-neutral-100 bg-neutral-50/70">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {currentUser.nombre} {currentUser.apellido}
                          </p>
                          <p className="text-[11px] font-mono text-neutral-500 truncate">
                            @{currentUser.usuario}
                          </p>
                          <span className="inline-block mt-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                            {currentUser.rol || 'user'}
                          </span>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
                          >
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span>My Profile</span>
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
                          >
                            <FiLogOut className="w-4 h-4 text-red-400" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </>
                    ) : isGuest ? (
                      <>
                        {/* Guest summary */}
                        <div className="px-4 py-2.5 border-b border-neutral-100 bg-amber-50/60">
                          <p className="text-xs font-bold text-amber-900">Browsing as Guest</p>
                          <p className="text-[10.5px] text-amber-700 mt-0.5 leading-relaxed">
                            Your data won&apos;t be saved. Create an account to keep your library.
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-gray-50 hover:text-gray-900 transition"
                          >
                            <FiLogIn className="w-4 h-4 text-gray-400" />
                            <span>Sign In</span>
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
                          >
                            <FiLogOut className="w-4 h-4 text-red-400" />
                            <span>Exit guest mode</span>
                          </button>
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-700 hover:text-gray-900 transition focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden w-full flex flex-col space-y-2 text-gray-700 px-1 pb-4 pt-2 border-t border-neutral-100"
            >
              {currentUser ? (
                <div className="p-3 bg-gray-50 rounded-xl mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {currentUser.nombre} {currentUser.apellido}
                    </p>
                    <p className="text-[10px] font-mono text-gray-500">@{currentUser.usuario}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-600 font-medium hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : isGuest ? (
                <div className="p-3 bg-amber-50 rounded-xl mb-2 border border-amber-100">
                  <p className="text-xs font-bold text-amber-900">Browsing as Guest</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Data won&apos;t be saved.</p>
                  <div className="flex gap-2 mt-2">
                    <Link
                      href="/"
                      onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="flex-1 py-1.5 text-center bg-gray-900 text-white rounded-lg text-[10px] font-medium"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 my-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 py-2 text-center bg-gray-900 text-white rounded-xl text-xs font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 py-2 text-center bg-gray-100 text-gray-800 rounded-xl text-xs font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {currentUser && (
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-800"
                >
                  My Profile
                </Link>
              )}

              <button
                onClick={() => {
                  setAddOpen(true)
                  setMenuOpen(false)
                }}
                className="flex items-center justify-center gap-1.5 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium mt-2"
              >
                <FiPlus size={16} />
                Add book
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
