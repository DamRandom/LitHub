'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, BookOpen, Heart, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Book } from '@/lib/store'
import NotesList from './NotesList'
import QuotesList from './QuotesList'
import SessionLogger from './SessionLogger'

interface Props {
  book: Book
  onClose: () => void
}

const STATUS_LABELS: Record<Book['status'], string> = {
  reading: 'Reading',
  finished: 'Finished',
  unread: 'To Read',
  abandoned: 'Abandoned',
}

const STATUS_COLORS: Record<Book['status'], string> = {
  reading: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  unread: 'bg-gray-100 text-gray-600',
  abandoned: 'bg-red-100 text-red-700',
}

type Tab = 'info' | 'notes' | 'quotes' | 'sessions'

export default function BookDetailModal({ book, onClose }: Props) {
  const { updateBook, deleteBook, data, openReader } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [editingProgress, setEditingProgress] = useState(false)
  const [progress, setProgress] = useState(book.progress)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const collection = data.collections.find((c) => c.id === book.sagaId)
  const quotes = data.quotes.filter((q) => q.bookId === book.id)
  const notes = data.notes.filter((n) => n.bookId === book.id)

  function handleProgressSave() {
    updateBook(book.id, { progress })
    setEditingProgress(false)
  }

  function handleStatusChange(status: Book['status']) {
    const updates: Partial<Book> = { status }
    if (status === 'reading' && !book.dateStarted) {
      updates.dateStarted = new Date().toISOString().slice(0, 10)
    }
    if (status === 'finished') {
      updates.progress = 100
      setProgress(100)
      if (!book.dateFinished) updates.dateFinished = new Date().toISOString().slice(0, 10)
    }
    updateBook(book.id, updates)
  }

  function handleToggleFavorite() {
    updateBook(book.id, { favorite: !book.favorite })
  }

  function handleDelete() {
    deleteBook(book.id)
    onClose()
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'info', label: 'Info' },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'quotes', label: 'Quotes', count: quotes.length },
    { key: 'sessions', label: 'Sessions' },
  ]

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-neutral-200/90 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex gap-5 p-6 pb-5 border-b border-neutral-100 bg-neutral-50/40">
            <div className="book-spine-effect flex-shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-neutral-100 shadow-md">
              {book.coverImage ? (
                book.coverImage.startsWith('data:') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-neutral-900 leading-tight tracking-tight">{book.title}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5 font-medium">by <span className="text-neutral-800 font-semibold">{book.author}</span></p>
                  {collection && (
                    <span className="inline-block text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full mt-1.5 border border-neutral-200/60">
                      {collection.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-1.5 rounded-full transition ${book.favorite ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}
                  >
                    <Heart size={18} fill={book.favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 transition">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap gap-2 mt-3">
                {(Object.keys(STATUS_LABELS) as Book['status'][]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                      book.status === s
                        ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {/* Progress */}
              {book.status === 'reading' && (
                <div className="mt-3">
                  {editingProgress ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="flex-1 accent-gray-800"
                      />
                      <span className="text-xs font-semibold w-8">{progress}%</span>
                      <button onClick={handleProgressSave} className="text-xs bg-gray-800 text-white px-2 py-1 rounded-lg">
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => setEditingProgress(true)}
                    >
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-full bg-gray-800 rounded-full transition-all"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium group-hover:text-gray-900 transition">
                        {book.progress}% <Pencil size={10} className="inline" />
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Rating */}
              {book.status === 'finished' && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateBook(book.id, { rating: star })}
                      className={`transition ${(book.rating || 0) >= star ? 'text-neutral-900' : 'text-neutral-200 hover:text-neutral-400'}`}
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    {book.rating ? `${book.rating}/5` : 'Not rated'}
                  </span>
                </div>
              )}

              {/* Action: Open Reader */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose()
                    openReader(book)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <BookOpen size={14} />
                  <span>{book.progress > 0 ? 'Continuar leyendo' : 'Leer libro'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-100 px-6 gap-2 pt-2 bg-neutral-50/20">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="space-y-4">
                {book.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Synopsis</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{book.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {book.pages > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Pages</p>
                      <p className="font-semibold text-gray-900">{book.pages}</p>
                    </div>
                  )}
                  {book.format && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Format</p>
                      <p className="font-semibold text-gray-900 capitalize">{book.format}</p>
                    </div>
                  )}
                  {book.dateStarted && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="font-semibold text-gray-900">{book.dateStarted}</p>
                    </div>
                  )}
                  {book.dateFinished && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Finished</p>
                      <p className="font-semibold text-gray-900">{book.dateFinished}</p>
                    </div>
                  )}
                  {book.publisher && (
                    <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-gray-500">Publisher</p>
                      <p className="font-semibold text-gray-900">{book.publisher}</p>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-gray-500">ISBN</p>
                      <p className="font-medium text-gray-700 text-sm">{book.isbn}</p>
                    </div>
                  )}
                </div>

                {book.tags && book.tags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {book.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {book.fileUrl || book.filePath ? `Libro digital (${book.format?.toUpperCase() || 'EBOOK'})` : 'Sin archivo adjunto'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {book.fileUrl || book.filePath
                        ? 'Puedes leer este libro en la pantalla completa y guardar tu progreso.'
                        : 'Abre el lector para seleccionar y subir el archivo .epub o .pdf.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose()
                      openReader(book)
                    }}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                  >
                    <BookOpen size={14} />
                    <span>Abrir lector</span>
                  </button>
                </div>

                {/* Delete */}
                <div className="pt-4 border-t border-gray-100">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm transition"
                    >
                      <Trash2 size={14} />
                      Delete book
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                      <button
                        onClick={handleDelete}
                        className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && <NotesList bookId={book.id} />}
            {activeTab === 'quotes' && <QuotesList bookId={book.id} />}
            {activeTab === 'sessions' && <SessionLogger bookId={book.id} />}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
