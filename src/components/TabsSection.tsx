'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { BookCheck } from 'lucide-react'
import Collections from './Collections'
import FinishedBooks from './FinishedBooks'
import Quotes from './Quotes'
import Stats from './Stats'
import { useApp } from '@/lib/context'

export default function TabsSection() {
  const { data } = useApp()
  const [activeTab, setActiveTab] = useState('Collections')

  const finishedCount = data.books.filter((b) => b.status === 'finished').length

  const tabs = [
    { name: 'Collections', icon: '/images/icons/collections.png', label: 'Colecciones' },
    { name: 'Finished', iconComponent: BookCheck, label: 'Terminados', count: finishedCount },
    { name: 'Quotes', icon: '/images/icons/quotes.png', label: 'Citas', count: data.quotes.length },
    { name: 'Stats', icon: '/images/icons/stats.png', label: 'Estadísticas' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Collections':
        return <Collections />
      case 'Finished':
        return <FinishedBooks />
      case 'Quotes':
        return <Quotes />
      case 'Stats':
        return <Stats />
      default:
        return null
    }
  }

  return (
    <main className="flex items-center justify-center p-3 sm:p-6 pb-20 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="lithub-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 w-full flex flex-col gap-4 sm:gap-6 ring-1 ring-black/[0.03] overflow-hidden"
      >
        {/* Sleek Segmented Pill Tabs */}
        <div className="flex items-center justify-center w-full pb-1 sm:pb-2">
          <div className="bg-neutral-100/90 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-0.5 sm:gap-1 max-w-2xl w-full border border-neutral-200/70 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.name
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex-1 min-w-0 flex items-center justify-center py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold transition-all relative select-none cursor-pointer ${
                    isActive
                      ? 'text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-xs border border-black/5"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-center gap-1 sm:gap-2 min-w-0">
                    {tab.iconComponent ? (
                      <tab.iconComponent
                        size={16}
                        className={`shrink-0 ${isActive ? 'text-neutral-900 stroke-[2.2]' : 'text-neutral-400 stroke-[1.75]'}`}
                      />
                    ) : (
                      <Image
                        src={tab.icon!}
                        alt={`${tab.name} icon`}
                        width={16}
                        height={16}
                        className={`shrink-0 ${isActive ? 'opacity-100 scale-105' : 'opacity-60'}`}
                      />
                    )}
                    <span className="truncate hidden sm:inline">{tab.label}</span>
                    <span className="truncate sm:hidden text-[10.5px]">
                      {tab.name === 'Collections' ? 'Colec.' : tab.name === 'Finished' ? 'Leídos' : tab.name === 'Stats' ? 'Stats' : tab.label}
                    </span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-1">{renderTabContent()}</div>
      </motion.div>
    </main>
  )
}
