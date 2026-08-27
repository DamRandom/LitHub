'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Heart } from 'lucide-react'
import { useApp } from '@/lib/context'

interface Props {
  bookId: string
}

export default function QuotesList({ bookId }: Props) {
  const { data, addQuote, updateQuote, deleteQuote } = useApp()
  const quotes = data.quotes.filter((q) => q.bookId === bookId)

  const [newText, setNewText] = useState('')
  const [newPage, setNewPage] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  function handleAdd() {
    if (!newText.trim()) return
    addQuote({ bookId, text: newText.trim(), page: newPage ? parseInt(newPage) : undefined, favorite: false })
    setNewText('')
    setNewPage('')
  }

  function startEdit(id: string, text: string) {
    setEditId(id)
    setEditText(text)
  }

  function saveEdit(id: string) {
    if (editText.trim()) updateQuote(id, { text: editText.trim() })
    setEditId(null)
  }

  return (
    <div className="space-y-4">
      {/* New quote form */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Escribe la frase..."
          rows={3}
          className="w-full text-sm text-gray-800 bg-transparent resize-none focus:outline-none placeholder:text-gray-400 italic"
        />
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200">
          <input
            type="number"
            value={newPage}
            onChange={(e) => setNewPage(e.target.value)}
            placeholder="Página (opcional)"
            className="text-xs text-gray-600 bg-transparent focus:outline-none w-32 placeholder:text-gray-400"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={12} />
            Añadir frase
          </button>
        </div>
      </div>

      {/* Quotes list */}
      {quotes.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm text-gray-500">No has guardado frases todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <div key={quote.id} className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              {editId === quote.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none italic"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(quote.id)} className="flex items-center gap-1 text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg">
                      <Check size={12} /> Guardar
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap italic">&quot;{quote.text}&quot;</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuote(quote.id, { favorite: !quote.favorite })}
                        className={`transition p-1 rounded hover:bg-gray-50 ${quote.favorite ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}
                      >
                        <Heart size={14} fill={quote.favorite ? 'currentColor' : 'none'} />
                      </button>
                      {quote.page && <span className="text-xs text-gray-400 font-medium">p. {quote.page}</span>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => startEdit(quote.id, quote.text)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteQuote(quote.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
