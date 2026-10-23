'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useApp } from '@/lib/context'
import { useState } from 'react'
import { Plus, BookOpen, Clock, ChevronRight } from 'lucide-react'
import BookDetailModal from './BookDetailModal'
import AddBookModal from './AddBookModal'
import { Book } from '@/lib/store'

export default function ContinueReading() {
  const { data, openReader, isLoadingData } = useApp()
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // Books currently in active reading on the website (must have been opened on website or progress > 0, and not finished)
  const readingBooks = data.books.filter(
    (b) => b.status === 'reading' && (b.lastOpenedAt || b.progress > 0)
  )

  // The last opened book appears in large in the first section
  const sortedReadingBooks = [...readingBooks].sort((a, b) => {
    const tA = new Date(a.lastOpenedAt || a.updatedAt || 0).getTime()
    const tB = new Date(b.lastOpenedAt || b.updatedAt || 0).getTime()
    return tB - tA
  })

  const featuredBook = sortedReadingBooks[0] || null
  const otherReadingBooks = sortedReadingBooks.slice(1)
  const wantToReadCount = data.books.filter(
    (b) => b.status === 'unread' || (b.status === 'reading' && !b.lastOpenedAt && b.progress === 0)
  ).length

  if (isLoadingData) {
    return (
      <main className="flex flex-col items-center justify-center p-4 sm:p-6 pt-24 max-w-5xl mx-auto w-full">
        <div className="lithub-card rounded-3xl p-12 w-full flex flex-col items-center justify-center gap-3 min-h-[300px]">
          <div className="w-8 h-8 border-[3px] border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Cargando libros...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="flex flex-col items-center justify-center p-3 sm:p-6 pt-20 sm:pt-24 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lithub-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 w-full flex flex-col md:flex-row gap-6 sm:gap-10 relative overflow-hidden ring-1 ring-black/[0.03]"
        >
          {/* Extremely subtle ambient accent behind cover */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-400/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

          {featuredBook ? (
            <>
              {/* Cover */}
              <div className="flex-shrink-0 w-full md:w-1/3 flex justify-center items-center">
                <div className="book-spine-effect relative w-40 sm:w-56 md:w-full aspect-[2/3] max-w-[240px] overflow-hidden bg-neutral-200">
                  {featuredBook.coverImage ? (
                    featuredBook.coverImage.startsWith('data:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredBook.coverImage}
                        alt={featuredBook.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={featuredBook.coverImage}
                        alt={featuredBook.title}
                        fill
                        sizes="(max-width: 768px) 250px, 350px"
                        className="object-cover"
                        priority
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-300 flex flex-col items-center justify-center p-4 text-center">
                      <BookOpen size={44} className="text-neutral-400 mb-2 stroke-[1.5]" />
                      <span className="text-xs font-semibold text-neutral-700">{featuredBook.title}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Info */}
              <div className="flex flex-col justify-between w-full relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/25 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Leyendo ahora
                    </span>
                    {featuredBook.format && (
                      <span className="text-[11px] font-semibold bg-white text-neutral-700 border border-neutral-200/90 px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-2xs">
                        {featuredBook.format === 'physical' ? 'Libro Físico' : featuredBook.format.toUpperCase()}
                      </span>
                    )}
                    {featuredBook.lastOpenedAt && (
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1 sm:ml-auto">
                        <Clock size={12} />
                        Última lectura: {new Date(featuredBook.lastOpenedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 mb-1.5 leading-tight tracking-tight">
                    {featuredBook.title}
                  </h1>
                  <h2 className="text-sm sm:text-base text-neutral-500 mb-4 font-medium tracking-wide">
                    por <span className="text-neutral-800 font-semibold">{featuredBook.author}</span>
                  </h2>

                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4 mb-4 font-normal">
                    {featuredBook.description || 'Sin descripción disponible para este libro.'}
                  </p>

                  {featuredBook.tags && featuredBook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {featuredBook.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 text-neutral-600 px-3 py-1 rounded-full border border-neutral-200/60 transition-colors">
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-5 border-t border-neutral-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-500 font-medium">Progreso de lectura</span>
                    <span className="text-sm font-bold text-neutral-900">{featuredBook.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200/70 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${featuredBook.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 rounded-full"
                    />
                  </div>
                  {featuredBook.pages > 0 && (
                    <p className="text-[11px] text-neutral-400 mt-2 font-medium">
                      ~{Math.round((featuredBook.pages * featuredBook.progress) / 100)} de {featuredBook.pages} páginas
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mt-5 sm:mt-6">
                    <button
                      onClick={() => openReader(featuredBook)}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <BookOpen size={16} />
                      <span>{featuredBook.progress > 0 ? 'Continuar leyendo' : 'Comenzar lectura'}</span>
                    </button>
                    <button
                      onClick={() => setSelectedBook(featuredBook)}
                      className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 hover:border-neutral-300 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : data.books.length > 0 ? (
            /* Books in library, but none currently being read */
            <div className="w-full flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 text-3xl shadow-sm">
                📖
              </div>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                Sin lectura activa
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Elige tu próxima lectura
              </h2>
              <p className="text-gray-500 text-sm max-w-md mb-6 leading-relaxed">
                Tienes {wantToReadCount} {wantToReadCount === 1 ? 'libro' : 'libros'} en tu lista de <strong>Want to Read (Por leer)</strong>. Abre uno para empezar y aparecerá aquí en grande para continuar tu progreso.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#want-to-read-section"
                  className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition"
                >
                  <BookOpen size={16} />
                  <span>Ver lista Por Leer</span>
                </a>
                <button
                  onClick={() => setAddOpen(true)}
                  className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <Plus size={16} />
                  <span>Añadir libro</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty Library */
            <div className="w-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4 text-3xl">
                📚
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Tu biblioteca está vacía
              </h2>
              <p className="text-gray-500 text-sm max-w-md mb-6 leading-relaxed">
                Comienza añadiendo tu primer libro físico, PDF o EPUB para registrar tus sesiones de lectura, citas y notas.
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-md transition hover:scale-[1.02]"
              >
                <Plus size={18} />
                <span>Añadir mi primer libro</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* If user is reading MULTIPLE books, show a quick-switcher bar for other active reading books */}
        {otherReadingBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="w-full mt-6 lithub-card rounded-2xl p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 tracking-tight">Otros libros en lectura</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Haz clic en cualquiera para abrirlo y pasarlo a la sección principal</p>
              </div>
              <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-200/60">
                {otherReadingBooks.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {otherReadingBooks.map((other) => (
                <div
                  key={other.id}
                  onClick={() => openReader(other)}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/70 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="book-spine-effect book-spine-sm w-11 h-16 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0 relative shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    {other.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={other.coverImage} alt={other.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">📖</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate group-hover:text-black">
                      {other.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate mb-1.5 font-medium">
                      {other.author}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-neutral-200/80 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-neutral-800 h-full rounded-full transition-all duration-300" style={{ width: `${other.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600">{other.progress}%</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 group-hover:text-neutral-800 group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  )
}
