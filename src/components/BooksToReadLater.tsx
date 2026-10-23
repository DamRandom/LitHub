'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, ChevronRight, X, BookOpen, Play } from 'lucide-react'
import { useApp } from '@/lib/context'
import AddBookModal from './AddBookModal'
import BookDetailModal from './BookDetailModal'
import { Book } from '@/lib/store'

export default function BooksToReadLater() {
  const { data, openReader } = useApp()
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  // Books that are unread, or added as reading but haven't been opened on the website yet
  const pendingBooks = data.books.filter((b) => {
    if (b.status === 'finished') return false
    if (b.status === 'reading' && (b.lastOpenedAt || b.progress > 0)) return false
    return true
  })

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  const closeModal = () => setOpen(false)

  return (
    <>
      <section id="want-to-read-section" className="py-6 sm:py-10 px-3 sm:px-6 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-4 sm:space-y-6 relative"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Want to Read</h2>
                <span className="text-xs font-semibold bg-neutral-900/5 text-neutral-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-neutral-200/60">
                  {pendingBooks.length}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 font-normal">
                Libros pendientes en tu lista de lectura
              </p>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={15} />
              <span>Añadir libro</span>
            </button>
          </div>

          {pendingBooks.length === 0 ? (
            <div className="lithub-card rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center relative overflow-hidden">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <BookOpen size={22} className="stroke-[1.75]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">No hay libros pendientes</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1.5 mb-4 sm:mb-5 leading-relaxed">
                Añade los libros físicos o digitales que planeas leer para organizar tu lista de espera y medir tus progresos.
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus size={15} />
                <span>Añadir a lista</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 sm:py-3 px-1 pr-6 sm:pr-10">
                {pendingBooks.map((book) => (
                  <div
                    key={book.id}
                    className="book-spine-effect relative flex-shrink-0 w-24 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] overflow-hidden bg-neutral-100 cursor-pointer group"
                  >
                    <div onClick={() => setSelectedBook(book)} className="w-full h-full">
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                          <BookOpen size={24} className="text-neutral-400 mb-1 stroke-[1.5]" />
                          <span className="text-[10px] font-semibold text-neutral-700 line-clamp-2">{book.title}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick action overlay */}
                    <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2.5 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openReader(book)
                        }}
                        className="w-full py-1.5 px-2 bg-white text-neutral-900 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 hover:bg-neutral-100 transition hover:scale-[1.02]"
                        title="Comenzar a leer este libro"
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Leer</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBook(book)
                        }}
                        className="w-full py-1.5 px-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[11px] font-medium border border-white/20 transition"
                      >
                        Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingBooks.length > 4 && (
                <>
                  <div className="pointer-events-none absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white via-white/80 to-transparent" />
                  <button
                    onClick={() => setOpen(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-900 text-white hover:bg-neutral-800 p-2.5 rounded-full shadow-lg transition-transform hover:scale-105 z-10 cursor-pointer"
                    aria-label="Ver todos los libros pendientes"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          )}

          {open && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2.5 sm:p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18),0_8px_24px_-8px_rgba(0,0,0,0.08)] border border-neutral-200/90 max-w-5xl w-full max-h-[92dvh] sm:max-h-[85vh] p-4 sm:p-7 relative overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={closeModal}
                  className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-7 shrink-0">
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                    All books to read
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-bold bg-neutral-900 text-white px-2 sm:px-2.5 py-0.5 rounded-full">
                    {pendingBooks.length}
                  </span>
                </div>

                <div className="overflow-y-auto pr-1 sm:pr-2 flex-1 min-h-0 no-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {pendingBooks.map((book) => (
                      <div
                        key={book.id}
                        className="group relative flex flex-col"
                      >
                        <div
                          onClick={() => {
                            closeModal()
                            setSelectedBook(book)
                          }}
                          className="relative w-full aspect-[2/3] overflow-hidden rounded-xl shadow-md cursor-pointer bg-neutral-100 group-hover:shadow-lg transition-all duration-200"
                        >
                          {book.coverImage ? (
                            <Image
                              src={book.coverImage}
                              alt={book.title}
                              fill
                              sizes="150px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                              <BookOpen size={22} className="text-neutral-400 mb-1 stroke-[1.5]" />
                              <span className="text-[10px] font-semibold text-neutral-700 line-clamp-2">{book.title}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                closeModal()
                                openReader(book)
                              }}
                              className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-neutral-900 rounded-xl text-xs font-bold shadow-lg transition transform translate-y-1 group-hover:translate-y-0 hover:scale-[1.03]"
                            >
                              Leer ahora
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-neutral-900 mt-1.5 truncate">{book.title}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{book.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </section>

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  )
}
