'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Star, RotateCcw } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Book } from '@/lib/store'
import BookDetailModal from './BookDetailModal'

export default function FinishedBooks() {
  const { data, openReader, updateBook } = useApp()
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const finishedBooks = data.books.filter((b) => b.status === 'finished')

  const handleReread = (book: Book) => {
    updateBook(book.id, {
      status: 'reading',
      progress: 0,
      lastOpenedAt: new Date().toISOString(),
      dateStarted: new Date().toISOString().slice(0, 10),
    })
    openReader(book)
  }

  return (
    <section className="py-4 sm:py-6 px-1 sm:px-2 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={17} className="text-emerald-600 stroke-[2.2]" />
            </span>
            <span>Libros Terminados</span>
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5 ml-10.5">
            {finishedBooks.length} {finishedBooks.length === 1 ? 'libro completado' : 'libros completados'}
          </p>
        </div>
      </header>

      {finishedBooks.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50/60 rounded-3xl border border-dashed border-neutral-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <CheckCircle2 size={22} className="stroke-[1.75]" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">Aún no has terminado ningún libro</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Los libros que completes o marques como terminados se organizarán automáticamente aquí con sus valoraciones y fechas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {finishedBooks.map((book) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white hover:bg-neutral-50 rounded-2xl p-3.5 sm:p-4 border border-neutral-200/80 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group overflow-hidden"
            >
              <div className="flex gap-3.5">
                <div
                  onClick={() => setSelectedBook(book)}
                  className="book-spine-effect book-spine-sm w-16 h-24 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden relative shadow-2xs cursor-pointer"
                >
                  {book.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">📖</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/25 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Completado
                  </span>
                  <h4
                    onClick={() => setSelectedBook(book)}
                    className="text-xs font-bold text-neutral-900 truncate hover:text-black cursor-pointer leading-tight tracking-tight"
                  >
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 truncate mb-1.5 font-medium">{book.author}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-0.5 text-amber-400 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        fill={(book.rating || 0) >= star ? 'currentColor' : 'none'}
                        className={(book.rating || 0) >= star ? 'text-amber-400' : 'text-neutral-200'}
                      />
                    ))}
                  </div>

                  {book.dateFinished && (
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {new Date(book.dateFinished).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100">
                <button
                  onClick={() => setSelectedBook(book)}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer transition-colors"
                >
                  Detalles
                </button>
                <button
                  onClick={() => handleReread(book)}
                  className="inline-flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-xl font-semibold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer group/btn"
                  title="Releer este libro"
                >
                  <RotateCcw size={11} className="group-hover/btn:-rotate-45 transition-transform" />
                  <span>Releer</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </section>
  )
}
