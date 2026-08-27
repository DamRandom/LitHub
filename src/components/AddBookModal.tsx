'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, BookOpen, FileText } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Book } from '@/lib/store'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'source' | 'details'

export default function AddBookModal({ open, onClose }: Props) {
  const { addBook, data } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('source')
  const [form, setForm] = useState({
    title: '',
    author: '',
    pages: '',
    format: 'physical' as Book['format'],
    description: '',
    status: 'unread' as Book['status'],
    tags: '',
    sagaId: '',
    isbn: '',
    language: 'es',
    coverImage: null as string | null,
    filePath: null as string | null,
    fileName: '',
  })

  function reset() {
    setStep('source')
    setForm({
      title: '', author: '', pages: '', format: 'physical',
      description: '', status: 'unread', tags: '', sagaId: '',
      isbn: '', language: 'es', coverImage: null, filePath: null, fileName: '',
    })
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf' || ext === 'epub') {
      const url = URL.createObjectURL(file)
      setForm((f) => ({
        ...f,
        format: ext as 'pdf' | 'epub',
        filePath: url,
        fileName: file.name,
        title: f.title || file.name.replace(/\.(pdf|epub)$/i, ''),
      }))
      setStep('details')
    }
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, coverImage: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.author.trim()) return
    addBook({
      title: form.title.trim(),
      author: form.author.trim(),
      pages: parseInt(form.pages) || 0,
      format: form.format,
      description: form.description.trim(),
      status: form.status,
      progress: 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      sagaId: form.sagaId || null,
      isbn: form.isbn.trim(),
      language: form.language,
      coverImage: form.coverImage,
      filePath: form.filePath,
      dateStarted: form.status === 'reading' ? new Date().toISOString().slice(0, 10) : null,
      dateFinished: null,
      rating: null,
      favorite: false,
    })
    handleClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {step === 'source' ? 'Añadir libro' : 'Detalles del libro'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {step === 'source' ? 'Elige cómo quieres añadir el libro' : 'Completa la información'}
            </p>

            {step === 'source' && (
              <div className="space-y-3">
                {/* Physical book */}
                <button
                  onClick={() => { setForm((f) => ({ ...f, format: 'physical' })); setStep('details') }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition">
                    <BookOpen size={20} className="text-gray-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">Libro físico</p>
                    <p className="text-xs text-gray-500">Registra un libro que tienes en papel</p>
                  </div>
                </button>

                {/* PDF / EPUB */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition">
                    <FileText size={20} className="text-gray-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">Archivo PDF / EPUB</p>
                    <p className="text-xs text-gray-500">Importa un archivo desde tu dispositivo</p>
                  </div>
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.epub"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                {/* Cover */}
                <div className="flex gap-4 items-start">
                  <label className="cursor-pointer flex-shrink-0">
                    <div className="w-20 h-28 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 overflow-hidden">
                      {form.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.coverImage} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={18} />
                          <span className="text-[10px] mt-1 text-center px-1">Portada</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                  </label>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        placeholder="Título del libro"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Autor *</label>
                      <input
                        type="text"
                        value={form.author}
                        onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        placeholder="Nombre del autor"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Páginas</label>
                    <input
                      type="number"
                      value={form.pages}
                      onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Book['status'] }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                    >
                      <option value="unread">Por leer</option>
                      <option value="reading">Leyendo</option>
                      <option value="finished">Terminado</option>
                      <option value="abandoned">Abandonado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Colección / Saga</label>
                  <select
                    value={form.sagaId}
                    onChange={(e) => setForm((f) => ({ ...f, sagaId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                  >
                    <option value="">Sin colección</option>
                    {data.collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    placeholder="Sinopsis del libro..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Etiquetas <span className="text-gray-400 font-normal">(separadas por coma)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="fantasía, aventura, misterio"
                  />
                </div>

                {form.fileName && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <FileText size={14} className="text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate">{form.fileName}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep('source')}
                    className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.title.trim() || !form.author.trim()}
                    className="flex-1 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                  >
                    Añadir libro
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
