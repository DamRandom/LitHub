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
    <section className="py-4 sm:py-6 px-1 sm:px-4 max-w-4xl mx-auto space-y-4 sm:space-y-6">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Your Quotes</h2>
          <p className="text-neutral-500 text-xs mt-0.5">Collection of your favorite excerpts & reflections</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
             <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
             <input 
                type="text"
                placeholder="Search quote or book..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-neutral-200 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:bg-white transition-all text-neutral-800 placeholder-neutral-400 shadow-2xs"
             />
          </div>
          <div className="flex bg-neutral-100/90 border border-neutral-200/60 rounded-xl p-1 w-full sm:w-auto">
             <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${filter === 'all' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'}`}
             >
                All
             </button>
             <button
                onClick={() => setFilter('favorites')}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${filter === 'favorites' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'}`}
             >
                <Heart size={12} fill={filter === 'favorites' ? '#ef4444' : 'none'} className={filter === 'favorites' ? 'text-red-500' : 'text-neutral-400'} />
                <span>Favorites</span>
             </button>
          </div>
        </div>
       </header>

       {quotes.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50/60 rounded-3xl border border-dashed border-neutral-200">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5 shadow-2xs text-xl">
               ✍️
             </div>
             <h3 className="text-sm font-bold text-neutral-900">No quotes to display</h3>
             <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">Save your favorite passages or quotes directly while reading to revisit them anytime.</p>
          </div>
       ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
             <AnimatePresence>
                {quotes.map((quote, i) => {
                   const book = data.books.find(b => b.id === quote.bookId)
                   return (
                      <motion.div
                         layout
                         initial={{ opacity: 0, y: 15 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         transition={{ duration: 0.3, delay: i * 0.04 }}
                         key={quote.id}
                         className="break-inside-avoid bg-white hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 group relative"
                      >
                         <button
                           onClick={() => updateQuote(quote.id, { favorite: !quote.favorite })}
                           className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 transition-transform active:scale-125 cursor-pointer"
                           aria-label="Toggle favorite"
                         >
                           <Heart size={15} fill={quote.favorite ? '#ef4444' : 'none'} className={quote.favorite ? 'text-red-500' : 'text-neutral-300 group-hover:text-neutral-400'} />
                         </button>
                         <div className="mb-2 text-amber-500/30 text-3xl font-serif select-none leading-none">&ldquo;</div>
                         <p className="text-neutral-800 text-[14px] leading-relaxed italic pr-4 font-serif">&quot;{quote.text}&quot;</p>
                         
                         {book && (
                            <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center gap-3">
                               <div className="w-8 h-12 flex-shrink-0 bg-neutral-100 rounded-md shadow-2xs overflow-hidden relative border border-neutral-200/60">
                                  {book.coverImage ? (
                                    <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400"><Book size={12} /></div>
                                  )}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-xs font-bold text-neutral-900 truncate tracking-tight">{book.title}</p>
                                  <p className="text-[11px] text-neutral-500 truncate font-medium">{book.author}</p>
                                  {quote.page && <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">Página {quote.page}</p>}
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
