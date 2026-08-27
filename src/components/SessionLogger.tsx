'use client'

import { useState } from 'react'
import { Plus, Trash2, Calendar, Clock, BookOpen } from 'lucide-react'
import { useApp } from '@/lib/context'

interface Props {
  bookId: string
}

export default function SessionLogger({ bookId }: Props) {
  const { data, addSession, deleteSession } = useApp()
  const sessions = data.sessions.filter((s) => s.bookId === bookId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [minutes, setMinutes] = useState('')
  const [pagesRead, setPagesRead] = useState('')

  function handleAdd() {
    if (!minutes || parseInt(minutes) <= 0) return
    addSession({
      bookId,
      date,
      minutes: parseInt(minutes),
      pagesRead: parseInt(pagesRead) || 0,
    })
    setMinutes('')
    setPagesRead('')
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0)
  const totalPages = sessions.reduce((acc, s) => acc + s.pagesRead, 0)

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      {(totalMinutes > 0 || totalPages > 0) && (
         <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-blue-50 text-blue-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Tiempo Total</span>
              <span className="text-xl font-bold">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
            </div>
            <div className="bg-green-50 text-green-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Páginas Leídas</span>
              <span className="text-xl font-bold">{totalPages}</span>
            </div>
         </div>
      )}

      {/* Add session form */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Registrar sesión</h4>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Fecha</label>
            <div className="relative">
              <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Minutos</label>
            <div className="relative">
              <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Páginas</label>
            <div className="relative">
              <BookOpen size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={!minutes || parseInt(minutes) <= 0}
          className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus size={14} />
          Guardar sesión
        </button>
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial</h4>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No hay sesiones registradas</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-2.5 group">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-800 w-24">
                     {new Date(session.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> {session.minutes} min</span>
                    {session.pagesRead > 0 && (
                       <span className="flex items-center gap-1"><BookOpen size={12} /> {session.pagesRead} pág</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
