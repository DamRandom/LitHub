'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FiUser } from 'react-icons/fi'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="backdrop-blur-lg bg-white/10 shadow-2xl rounded-b-xl p-4 max-w-5xl mx-auto flex justify-between items-center text-gray-600 select-none">
      
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

      {/* Mobile menu toggle */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-gray-600 hover:text-gray-900 transition focus:outline-none"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {menuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white/10 backdrop-blur-lg shadow-2xl rounded-b-xl p-4 md:hidden flex flex-col space-y-4 text-gray-600">
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
      )}
    </nav>
  )
}
