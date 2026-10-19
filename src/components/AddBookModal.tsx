'use client'

import { useState, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, BookOpen, FileText, Play, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Book } from '@/lib/store'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'source' | 'details'

export default function AddBookModal({ open, onClose }: Props) {
  const { addBook, data, openReader } = useApp()
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
    publisher: '',
    language: 'es',
    coverImage: null as string | null,
    filePath: null as string | null,
    fileName: '',
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionMsg, setExtractionMsg] = useState('')
  const [extractedSuccess, setExtractedSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  function reset() {
    setStep('source')
    setSelectedFile(null)
    setIsSubmitting(false)
    setIsExtracting(false)
    setExtractionMsg('')
    setExtractedSuccess(false)
    setIsDragging(false)
    setForm({
      title: '',
      author: '',
      pages: '',
      format: 'physical',
      description: '',
      status: 'unread',
      tags: '',
      sagaId: '',
      isbn: '',
      publisher: '',
      language: 'es',
      coverImage: null,
      filePath: null,
      fileName: '',
    })
  }

  function handleClose() {
    reset()
    onClose()
  }

  function fallbackFromFilename(filename: string) {
    let clean = filename.replace(/\.(pdf|epub)$/i, '')
    clean = clean.replace(/^\d+[-_]/, '')
    clean = clean.replace(/(_z_library|_1lib|_z_lib|zlibrary).*$/i, '')
    clean = clean.replace(/_/g, ' ').trim()

    let title = clean
    let author = ''
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ')
      author = parts[0].trim()
      title = parts.slice(1).join(' - ').trim()
    } else if (/ by /i.test(clean)) {
      const parts = clean.split(/ by /i)
      title = parts[0].trim()
      author = parts[1].trim()
    }
    return { title, author }
  }

  async function processBookFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'epub' && ext !== 'pdf') {
      alert('Solo se admiten archivos .epub y .pdf')
      return
    }

    setSelectedFile(file)
    setIsExtracting(true)
    setExtractionMsg(
      ext === 'epub'
        ? 'Analizando EPUB: extrayendo título, autor, sinopsis y portada...'
        : 'Analizando PDF: extrayendo metadatos y conteo de páginas...'
    )

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/extract', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.meta) {
          const meta = data.meta
          const fallback = fallbackFromFilename(file.name)

          setForm((f) => ({
            ...f,
            format: (data.format || ext) as 'pdf' | 'epub',
            fileName: file.name,
            filePath: data.fileUrl || null,
            title: meta.title || fallback.title || f.title,
            author: meta.author || fallback.author || f.author,
            description: meta.description || f.description,
            pages: meta.pages ? String(meta.pages) : f.pages,
            isbn: meta.isbn || f.isbn,
            language: meta.language || f.language,
            publisher: meta.publisher || f.publisher,
            coverImage: meta.coverImage || f.coverImage,
          }))

          setExtractedSuccess(true)
          setStep('details')
          return
        }
      }
      throw new Error('Fallback to local parse')
    } catch {
      // Graceful fallback to filename heuristic
      const fallback = fallbackFromFilename(file.name)
      setForm((f) => ({
        ...f,
        format: ext as 'pdf' | 'epub',
        fileName: file.name,
        title: fallback.title || f.title,
        author: fallback.author || f.author,
      }))
      setExtractedSuccess(false)
      setStep('details')
    } finally {
      setIsExtracting(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      processBookFile(file)
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processBookFile(file)
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

  async function handleSubmit(shouldOpenNow: boolean = false) {
    if (!form.title.trim() || !form.author.trim() || isSubmitting) return

    setIsSubmitting(true)
    let uploadedUrl = form.filePath || null

    // If file was not uploaded during extraction (e.g. offline/fallback), upload it now
    if (!uploadedUrl && selectedFile) {
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success && uploadData.fileUrl) {
          uploadedUrl = uploadData.fileUrl
        }
      } catch (err) {
        console.error('Error uploading book file:', err)
      }
    }

    const isFinished = form.status === 'finished'
    const now = new Date().toISOString()

    const newBook = await addBook({
      title: form.title.trim(),
      author: form.author.trim(),
      pages: parseInt(form.pages) || 0,
      format: form.format,
      description: form.description.trim(),
      status: isFinished ? 'finished' : shouldOpenNow ? 'reading' : form.status,
      progress: isFinished ? 100 : 0,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      sagaId: form.sagaId || null,
      isbn: form.isbn.trim(),
      publisher: form.publisher.trim(),
      language: form.language,
      coverImage: form.coverImage,
      filePath: uploadedUrl,
      fileUrl: uploadedUrl,
      dateStarted: shouldOpenNow ? now.slice(0, 10) : null,
      dateFinished: isFinished ? now.slice(0, 10) : null,
      rating: isFinished ? 5 : null,
      favorite: false,
      lastOpenedAt: shouldOpenNow ? now : null,
    })

    setIsSubmitting(false)
    handleClose()

    if (shouldOpenNow && newBook) {
      openReader(newBook)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative transition-all ${
              isDragging ? 'ring-4 ring-indigo-500/40 bg-indigo-50/20' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              {step === 'source' ? 'Añadir Libro' : 'Detalles del Libro'}
              {extractedSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <Sparkles size={12} /> Auto-importado
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {step === 'source'
                ? 'Elige cómo deseas incorporar el libro a tu biblioteca'
                : 'Revisa y ajusta los datos antes de guardar'}
            </p>

            {/* Loading / Extraction state */}
            {isExtracting && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                    <BookOpen size={30} className="animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Loader2 size={20} className="animate-spin text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">Extrayendo datos del libro...</h3>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">{extractionMsg}</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-full">
                  <Sparkles size={13} />
                  <span>Detección automática estilo Moon+ Reader</span>
                </div>
              </div>
            )}

            {/* Source Selection Step */}
            {!isExtracting && step === 'source' && (
              <div className="space-y-3">
                {/* Drag and Drop Zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                    <Upload size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Importar archivo digital (EPUB / PDF)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Haz clic para seleccionar o <span className="text-indigo-600 font-medium">arrastra y suelta</span> tu libro aquí
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Extrae título, autor, páginas, sinopsis y portada automáticamente</span>
                  </div>
                </div>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full" />
                  <span className="bg-white px-3 text-xs text-gray-400 uppercase font-medium">o bien</span>
                </div>

                {/* Physical book */}
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, format: 'physical' }))
                    setStep('details')
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition">
                    <BookOpen size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Libro Físico / Manual</p>
                    <p className="text-xs text-gray-500">Registra un libro que tengas en formato impreso</p>
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

            {/* Details Step */}
            {!isExtracting && step === 'details' && (
              <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
                {extractedSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">¡Metadatos detectados automáticamente!</p>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        Extrajimos la información disponible en tu archivo. Puedes modificar cualquier campo si lo deseas.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cover and basic info */}
                <div className="flex gap-4 items-start">
                  <label className="cursor-pointer flex-shrink-0 relative group">
                    <div className="w-20 h-28 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 overflow-hidden shadow-sm">
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
                    {form.coverImage && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-[10px] font-medium text-center p-1">
                        Cambiar portada
                      </div>
                    )}
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Páginas estimadas</label>
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
                      <option value="unread">Por leer (Want to Read)</option>
                      <option value="reading">Leyendo (Lectura)</option>
                      <option value="finished">Terminado (Leído)</option>
                      <option value="abandoned">Abandonado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Colección / Serie</label>
                    <select
                      value={form.sagaId}
                      onChange={(e) => setForm((f) => ({ ...f, sagaId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                    >
                      <option value="">Sin colección</option>
                      {data.collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Editorial / Publisher</label>
                    <input
                      type="text"
                      value={form.publisher}
                      onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder="Ej. Planeta, Penguin..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción / Sinopsis</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    placeholder="Sinopsis breve del libro..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Etiquetas <span className="text-gray-400 font-normal">(separadas por comas)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="ficción, aventura, misterio"
                  />
                </div>

                {form.fileName && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-indigo-600 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{form.fileName}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                      {form.format}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep('source')}
                    className="border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={!form.title.trim() || !form.author.trim() || isSubmitting}
                    className="flex-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Añadir a lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={!form.title.trim() || !form.author.trim() || isSubmitting}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play size={13} fill="currentColor" />
                    )}
                    <span>Guardar y leer</span>
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
