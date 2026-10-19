'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FolderPlus, BookOpen } from 'lucide-react'
import SearchInput from './ui/SearchInput'
import SortDirectionButton from './ui/SortDirectionButton'
import SortSelect from './ui/SortSelect'
import { useApp } from '@/lib/context'

type SortField = 'name' | 'added' | 'author'

export default function Collections() {
  const { data, addCollection } = useApp()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [newColName, setNewColName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const books = data.books
  const collections = data.collections

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    addCollection(newColName.trim())
    setNewColName('')
    setShowAdd(false)
  }

  const filteredAndSortedCollections = useMemo(() => {
    const getBooks = (id: string) => books.filter((b) => b.sagaId === id)
    let result = [...collections]

    const q = search.trim().toLowerCase()
    if (q !== '') {
      result = result.filter((col) => {
        if (col.name.toLowerCase().includes(q)) return true
        const colBooks = getBooks(col.id)
        if (colBooks.some((b) => b.author?.toLowerCase().includes(q))) return true
        if (colBooks.some((b) => (b.tags || []).some((tag) => tag.toLowerCase().includes(q)))) return true
        return false
      })
    }

    result.sort((a, b) => {
      const aBooks = getBooks(a.id)
      const bBooks = getBooks(b.id)

      let valA = ''
      let valB = ''

      switch (sortField) {
        case 'name':
          valA = a.name
          valB = b.name
          break
        case 'author':
          valA = aBooks[0]?.author ?? ''
          valB = bBooks[0]?.author ?? ''
          break
        case 'added':
          valA = a.createdAt ?? ''
          valB = b.createdAt ?? ''
          break
      }

      if (sortDir === 'asc') return valA.localeCompare(valB)
      return valB.localeCompare(valA)
    })

    return result
  }, [collections, search, sortField, sortDir, books])

  return (
    <section className="py-4 px-2 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Collections</h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'} ({books.filter((b) => b.sagaId).length} books organized)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search collections…"
            debounceMs={200}
            autoFocus={false}
          />

          <SortSelect
            value={sortField}
            onChange={(val) => setSortField(val as SortField)}
            options={[
              { label: 'Name', value: 'name' },
              { label: 'Author', value: 'author' },
              { label: 'Date', value: 'added' },
            ]}
          />

          <SortDirectionButton
            direction={sortDir}
            onToggle={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          />

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>New</span>
          </button>
        </div>
      </header>

      {showAdd && (
        <form onSubmit={handleCreateCollection} className="p-4 bg-white rounded-2xl border border-neutral-200/90 shadow-sm flex items-center gap-2.5 animate-fadeIn">
          <input
            type="text"
            required
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="Name of the new series or collection..."
            className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:bg-white transition-all text-neutral-800"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition shadow-xs cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="px-3 py-2 text-neutral-500 hover:bg-neutral-100 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {filteredAndSortedCollections.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50/60 rounded-3xl border border-dashed border-neutral-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <BookOpen size={20} className="stroke-[1.75]" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">No collections created</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Create collections or series to organize your favorite books by themes or sagas.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition shadow-xs hover:scale-[1.02] cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>Create my first collection</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedCollections.map((col) => {
            const colBooks = books.filter((b) => b.sagaId === col.id)
            const sample = colBooks[0]
            const mainAuthor = sample?.author ?? ''
            const covers = colBooks.slice(0, 3)

            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white hover:bg-neutral-50 rounded-2xl border border-neutral-200/80 hover:border-neutral-300 p-5 shadow-sm hover:shadow-md transition-all duration-200 grid grid-cols-[96px_1fr] gap-5 items-center group cursor-default"
              >
                <div className="relative h-28 w-full flex items-center justify-center">
                  {covers.length > 0 ? (
                    covers.map((book, i) => {
                      const validSrc = book.coverImage && book.coverImage.trim() !== '' ? book.coverImage : null
                      const rotations = ['-5deg', '0deg', '5deg']
                      const offsets = ['-10px', '0px', '10px']

                      return (
                        <div
                          key={book.id}
                          className="absolute w-16 h-24 rounded-md overflow-hidden shadow-md"
                          style={{
                            transform: `rotate(${rotations[i]}) translateX(${offsets[i]})`,
                            zIndex: 10 - i,
                          }}
                        >
                          {validSrc ? (
                            <Image
                              src={validSrc}
                              alt={book.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-[9px] text-neutral-500 font-medium">
                              No cover
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="w-16 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-md border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-[9px] font-semibold uppercase tracking-wide">
                      Empty
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-neutral-900 tracking-tight">{col.name}</h3>
                    <span className="flex-shrink-0 text-[10px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200/70 px-2 py-0.5 rounded-full">
                      {colBooks.length} {colBooks.length === 1 ? 'book' : 'books'}
                    </span>
                  </div>

                  {mainAuthor && (
                    <p className="text-xs text-neutral-500 font-medium">by {mainAuthor}</p>
                  )}

                  {col.description ? (
                    <p className="text-xs text-neutral-600 leading-snug line-clamp-2 max-w-[48ch]">
                      {col.description}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No description added.</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}
