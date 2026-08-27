'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useApp } from '@/lib/context'

interface Props {
  bookId: string
}

export default function NotesList({ bookId }: Props) {
  const { data, addNote, updateNote, deleteNote } = useApp()
  const notes = data.notes.filter((n) => n.bookId === bookId)

  const [newText, setNewText] = useState('')
  const [newPage, setNewPage] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  function handleAdd() {
    if (!newText.trim()) return
    addNote({ bookId, text: newText.trim(), page: newPage ? parseInt(newPage) : undefined })
    setNewText('')
    setNewPage('')
  }

  function startEdit(id: string, text: string) {
    setEditId(id)
    setEditText(text)
  }

  function saveEdit(id: string) {
    if (editText.trim()) updateNote(id, { text: editText.trim() })
    setEditId(null)
  }

  return (
    <div className="space-y-4">
      {/* New note form */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Escribe tu nota..."
          rows={3}
          className="w-full text-sm text-gray-800 bg-transparent resize-none focus:outline-none placeholder:text-gray-400"
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
            Añadir nota
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">📝</p>
          <p className="text-sm text-gray-500">No hay notas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              {editId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(note.id)} className="flex items-center gap-1 text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg">
                      <Check size={12} /> Guardar
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {note.page && <span className="text-xs text-gray-400">p. {note.page}</span>}
                      <span className="text-xs text-gray-300">
                        {new Date(note.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => startEdit(note.id, note.text)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteNote(note.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition">
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
