'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaLayerGroup, FaQuoteRight, FaChartBar } from 'react-icons/fa'
import Collections from './Collections'
import Quotes from './Quotes'
import Stats from './Stats'

const tabs = [
  { name: 'Collections', icon: FaLayerGroup },
  { name: 'Quotes', icon: FaQuoteRight },
  { name: 'Stats', icon: FaChartBar }
]

export default function TabsSection() {
  const [activeTab, setActiveTab] = useState('Collections')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Collections':
        return <Collections />
      case 'Quotes':
        return <Quotes />
      case 'Stats':
        return <Stats />
      default:
        return null
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="backdrop-blur-lg bg-white/10 shadow-2xl rounded-xl p-8 max-w-5xl w-full flex flex-col gap-6"
      >
        <div className="flex justify-around border-b border-gray-300 pb-4">
          {tabs.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`flex flex-col items-center text-sm font-medium transition-colors ${
                activeTab === name
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="text-xl mb-1" />
              {name}
            </button>
          ))}
        </div>

        <div className="mt-4">{renderTabContent()}</div>
      </motion.div>
    </main>
  )
}
