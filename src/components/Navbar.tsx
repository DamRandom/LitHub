'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { FiUser, FiPlus } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import AddBookModal from './AddBookModal'

const navLinks = [
  { name: 'Biblioteca', href: '/' },
  { name: 'Colecciones', href: '/collections' },
  { name: 'Frases', href: '/quotes' },
  { name: 'Estadísticas', href: '/stats' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isMini, setIsMini] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const lastScroll = useRef(0)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
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
      } else {
        setVisible(true)
        setIsMini(false)
      }
      lastScroll.current = currentScroll
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        animate={{
          y: visible ? 0 : -60,
          height: isMini ? 8 : 64,
          opacity: 1,
          borderBottomLeftRadius: isMini ? '8px' : '1rem',
          borderBottomRightRadius: isMini ? '8px' : '1rem',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => isMini && setVisible(true)}
        onMouseLeave={() => isMini && setVisible(false)}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 backdrop-blur-lg bg-white/10 shadow-2xl rounded-b-xl px-6 max-w-5xl w-full flex justify-between items-center text-gray-600 select-none overflow-hidden"
        style={{ width: 'min(90vw, 1024px)' }}
      >
        <div className="w-full flex justify-between items-center py-2">
          <Link href="/" className="w-24 h-8 relative mr-8 flex-shrink-0">
            <Image
              src="/logo/lithub.png"
              alt="LitHub Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>

          <div className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <button
              onClick={() => setAddOpen(true)}
              className="ml-2 flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >
              <FiPlus size={16} />
              Añadir
            </button>

            <button
              className="ml-1 p-2 rounded-full hover:bg-gray-800 hover:text-white transition"
              aria-label="Perfil"
            >
              <FiUser size={20} />
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900 transition focus:outline-none"
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

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden flex flex-col space-y-2 text-gray-600 px-4 pb-4"
            >
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
              <button
                onClick={() => { setAddOpen(true); setMenuOpen(false) }}
                className="flex items-center gap-1.5 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                <FiPlus size={16} />
                Añadir libro
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
