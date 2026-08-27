'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BookOpen, Clock, Calendar, Trophy } from 'lucide-react'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function Stats() {
  const { data } = useApp()
  const [year, setYear] = useState(new Date().getFullYear())

  const years = useMemo(() => {
    const ySet = new Set<number>()
    ySet.add(new Date().getFullYear())
    data.sessions.forEach(s => ySet.add(new Date(s.date).getFullYear()))
    data.books.forEach(b => {
      if (b.dateFinished) ySet.add(new Date(b.dateFinished).getFullYear())
      if (b.dateStarted) ySet.add(new Date(b.dateStarted).getFullYear())
    })
    return Array.from(ySet).sort((a, b) => b - a)
  }, [data])

  const stats = useMemo(() => {
    const sessions = data.sessions.filter(s => new Date(s.date).getFullYear() === year)
    const booksRead = data.books.filter(b => b.status === 'finished' && b.dateFinished && new Date(b.dateFinished).getFullYear() === year)
    
    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0)
    const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0)
    
    const monthlyData = MONTHS.map((m, i) => {
      const monthSessions = sessions.filter(s => new Date(s.date).getMonth() === i)
      return {
        name: m,
        minutos: monthSessions.reduce((sum, s) => sum + s.minutes, 0),
        paginas: monthSessions.reduce((sum, s) => sum + s.pagesRead, 0),
        libros: booksRead.filter(b => new Date(b.dateFinished!).getMonth() === i).length
      }
    })

    return { totalMinutes, totalPages, booksRead: booksRead.length, monthlyData }
  }, [data, year])

  return (
    <section className="py-6 px-4 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estadísticas</h2>
          <p className="text-gray-500 text-sm mt-1">Tu progreso de lectura</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-white border border-gray-200 text-sm font-medium rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
            <Trophy size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.booksRead}</p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Libros leídos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalPages}</p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Páginas</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
            <Clock size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tiempo total</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
             {stats.monthlyData.filter(m => m.minutos > 0).length}
          </p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Meses activos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
         <h3 className="text-lg font-bold text-gray-900">Tiempo de lectura mensual</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                     cursor={{ fill: '#f9fafb' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                  />
                  <Bar dataKey="minutos" fill="#1f2937" radius={[4, 4, 0, 0]} name="Minutos" />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </section>
  )
}
