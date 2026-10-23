'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BookOpen, Clock, Calendar, Trophy } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
        minutes: monthSessions.reduce((sum, s) => sum + s.minutes, 0),
        pages: monthSessions.reduce((sum, s) => sum + s.pagesRead, 0),
        books: booksRead.filter(b => new Date(b.dateFinished!).getMonth() === i).length
      }
    })

    return { totalMinutes, totalPages, booksRead: booksRead.length, monthlyData }
  }, [data, year])

  return (
    <section className="py-4 px-2 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Statistics</h2>
          <p className="text-neutral-500 text-xs mt-0.5">Your reading progress & milestones</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-white border border-neutral-200/90 text-xs font-semibold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-800 shadow-2xs cursor-pointer"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white hover:bg-neutral-50 rounded-2xl p-3.5 sm:p-5 border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mb-2 sm:mb-3 shadow-2xs group-hover:scale-105 transition-transform">
            <Trophy size={18} className="stroke-[2]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-0.5 sm:mb-1">{stats.booksRead}</p>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Books read</p>
        </div>

        <div className="bg-white hover:bg-neutral-50 rounded-2xl p-3.5 sm:p-5 border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center mb-2 sm:mb-3 shadow-2xs group-hover:scale-105 transition-transform">
            <BookOpen size={18} className="stroke-[2]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-0.5 sm:mb-1">{stats.totalPages}</p>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Pages read</p>
        </div>

        <div className="bg-white hover:bg-neutral-50 rounded-2xl p-3.5 sm:p-5 border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mb-2 sm:mb-3 shadow-2xs group-hover:scale-105 transition-transform">
            <Clock size={18} className="stroke-[2]" />
          </div>
          <p className="text-xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-0.5 sm:mb-1">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Total time</p>
        </div>

        <div className="bg-white hover:bg-neutral-50 rounded-2xl p-3.5 sm:p-5 border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center justify-center mb-2 sm:mb-3 shadow-2xs group-hover:scale-105 transition-transform">
            <Calendar size={18} className="stroke-[2]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-0.5 sm:mb-1">
             {stats.monthlyData.filter(m => m.minutes > 0).length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Active months</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-neutral-200/80 shadow-2xs space-y-4 sm:space-y-5 relative overflow-hidden">
         {/* Subtle ambient glow */}
         <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 bg-amber-400/5 rounded-full blur-3xl" />
         <div className="flex items-center justify-between relative">
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Monthly reading time</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Minutes of reading per month</p>
            </div>
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200/70 px-3 py-1 rounded-xl">{year}</span>
         </div>
         <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f1f3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} />
                  <Tooltip 
                     cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
                     contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 16px 32px -8px rgba(0,0,0,0.1)', padding: '10px 16px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}
                     labelStyle={{ fontWeight: '700', color: '#111827', marginBottom: '4px', fontSize: '12px' }}
                     itemStyle={{ fontSize: '12px', color: '#4b5563' }}
                  />
                  <Bar dataKey="minutes" fill="#171717" radius={[7, 7, 0, 0]} name="Minutes" maxBarSize={40} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </section>
  )
}
