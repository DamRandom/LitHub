'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { FiUser } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isMini, setIsMini] = useState(false)
  const lastScroll = useRef(0)

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
    <motion.nav
      animate={{
        y: visible ? 0 : -60,
        height: isMini ? 8 : 64,
        opacity: 1,
        borderBottomLeftRadius: isMini ? '8px' : '1rem',
        borderBottomRightRadius: isMini ? '8px' : '1rem',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      onMouseEnter={() => isMini && setVisible(true)}
      onMouseLeave={() => isMini && setVisible(false)}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 backdrop-blur-lg bg-white/10 shadow-2xl rounded-b-xl p-4 max-w-5xl mx-auto flex justify-between items-center text-gray-600 select-none"
    >
      <div className="w-full flex justify-between items-center py-2">
        <a href="#" className="w-24 h-8 relative mr-8 flex-shrink-0">
          <Image
            src="/logo/lithub.png"
            alt="LitHub Logo"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </a>

        <div className="hidden md:flex space-x-6 items-center">
          <a href="#" className="hover:text-gray-900 transition">Collections</a>
          <a href="#" className="hover:text-gray-900 transition">Quotes</a>
          <a href="#" className="hover:text-gray-900 transition">Stats</a>

          <button
            className="p-2 rounded-full hover:bg-gray-800 hover:text-white transition"
            aria-label="Manage Account"
            title="Manage Account"
          >
            <FiUser size={24} />
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
            className="md:hidden flex flex-col space-y-4 text-gray-600 px-4 pb-4"
          >
            <a href="#" className="hover:text-gray-900 transition">Collections</a>
            <a href="#" className="hover:text-gray-900 transition">Quotes</a>
            <a href="#" className="hover:text-gray-900 transition">Stats</a>
            <button
              className="p-2 rounded-full hover:bg-gray-800 hover:text-white transition"
              aria-label="Manage Account"
              title="Manage Account"
            >
              <FiUser size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
