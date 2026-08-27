'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, Book } from 'lucide-react'
import { useApp } from '@/lib/context'
import Image from 'next/image'

export default function Quotes() {
  const { data, updateQuote } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')

  const quotes = data.quotes.filter(q => {
    if (filter === 'favorites' && !q.favorite) return false
    if (search) {
      const s = search.toLowerCase()
      return q.text.toLowerCase().includes(s) || data.books.find(b => b.id === q.bookId)?.title.toLowerCase().includes(s)
    }
    return true
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <section className="py-6 px-4 max-w-4xl mx-auto space-y-6">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tus Frases</h2>
          <p className="text-gray-500 text-sm mt-1">Colección de tus fragmentos favoritos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
                type="text"
                placeholder="Buscar frase o libro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 text-sm rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
             />
          </div>
          <div className="flex bg-gray-100 rounded-full p-1 w-full sm:w-auto">
             <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none text-xs font-medium px-4 py-1.5 rounded-full transition ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
                Todas
             </button>
             <button
                onClick={() => setFilter('favorites')}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-full transition ${filter === 'favorites' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <Heart size={12} fill={filter === 'favorites' ? 'currentColor' : 'none'} className={filter === 'favorites' ? 'text-red-500' : ''} />
                Favoritas
             </button>
          </div>
        </div>
       </header>

       {quotes.length === 0 ? (
          <div className="text-center py-20">
             <div className="text-6xl mb-4 opacity-50">💬</div>
             <h3 className="text-lg font-medium text-gray-900">No hay frases para mostrar</h3>
             <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2">Guarda tus citas favoritas desde los detalles de cada libro para verlas aquí.</p>
          </div>
       ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
             <AnimatePresence>
                {quotes.map((quote, i) => {
                   const book = data.books.find(b => b.id === quote.bookId)
                   return (
                      <motion.div
                         layout
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         transition={{ duration: 0.3, delay: i * 0.05 }}
                         key={quote.id}
                         className="break-inside-avoid bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition group relative"
                      >
                         <button
                           onClick={() => updateQuote(quote.id, { favorite: !quote.favorite })}
                           className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-50/0 hover:bg-gray-50 transition"
                         >
                           <Heart size={16} fill={quote.favorite ? '#ef4444' : 'none'} className={quote.favorite ? 'text-red-500' : 'text-gray-300 group-hover:text-gray-400'} />
                         </button>
                         <p className="text-gray-800 text-[15px] leading-relaxed italic pr-6">&quot;{quote.text}&quot;</p>
                         
                         {book && (
                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
                               <div className="w-8 h-12 flex-shrink-0 bg-gray-100 rounded shadow-sm overflow-hidden relative">
                                  {book.coverImage ? (
                                    <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Book size={12} /></div>
                                  )}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{book.title}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{book.author}</p>
                                  {quote.page && <p className="text-[10px] text-gray-400 mt-0.5">Pág. {quote.page}</p>}
                               </div>
                            </div>
                         )}
                      </motion.div>
                   )
                })}
             </AnimatePresence>
          </div>
       )}
    </section>
  )
}
