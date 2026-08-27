'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useApp } from '@/lib/context'
import { useState } from 'react'
import BookDetailModal from './BookDetailModal'
import { Book } from '@/lib/store'

export default function ContinueReading() {
  const { data } = useApp()
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const readingBook = data.books.find((b) => b.status === 'reading') || null

  return (
    <>
      <main className="flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="backdrop-blur-lg bg-white/10 shadow-2xl rounded-xl p-8 max-w-5xl w-full mt-18 flex flex-col md:flex-row gap-8"
        >
          {readingBook ? (
            <>
              <div className="flex-shrink-0 shadow-2xs w-full md:w-1/3">
                {readingBook.coverImage ? (
                  readingBook.coverImage.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={readingBook.coverImage}
                      alt={readingBook.title}
                      className="w-full h-auto shadow-md object-cover"
                    />
                  ) : (
                    <Image
                      src={readingBook.coverImage}
                      alt={readingBook.title}
                      width={300}
                      height={450}
                      className="shadow-md object-cover"
                      priority
                    />
                  )
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">📖</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between w-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Leyendo ahora
                    </span>
                    {readingBook.format !== 'physical' && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                        {readingBook.format}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {readingBook.title}
                  </h1>
                  <h2 className="text-lg text-gray-500 mb-4">
                    por {readingBook.author}
                  </h2>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed line-clamp-4">
                    {readingBook.description || 'Sin descripción disponible.'}
                  </p>

                  {readingBook.tags && readingBook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {readingBook.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 font-medium">Progreso</span>
                    <span className="text-sm font-semibold text-gray-900">{readingBook.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${readingBook.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gray-800 rounded-full"
                    />
                  </div>
                  {readingBook.pages > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ~{Math.round(readingBook.pages * readingBook.progress / 100)} / {readingBook.pages} páginas
                    </p>
                  )}

                  <button
                    onClick={() => setSelectedBook(readingBook)}
                    className="mt-5 self-start bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded-full shadow-lg transition-colors"
                  >
                    Continuar leyendo
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center py-8">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No estás leyendo nada ahora mismo
              </h2>
              <p className="text-gray-500 text-sm max-w-sm">
                Añade un libro y márcalo como &quot;Leyendo&quot; para que aparezca aquí.
              </p>
            </div>
          )}
        </motion.div>
      </main>

      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  )
}
