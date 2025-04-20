'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ContinueReading() {
  const title = 'Silence and Shadow'
  const author = 'Erin Beaty'
  const description = `After confronting a killer and fleeing her home to be with each other, Cat and Simon arrive in the sprawling city of Londunium pretending to be a newly married couple, but don’t expect to keep up the ruse for long. Cat looks forward to honing her healing magick at the local Selanae university, but instead finds a council of ruthless leaders threatening to erase her non-Selanae "husband’s" memories to protect their secrets.

Terrified to lose him, Cat takes desperate steps to keep him safe. But when a string of mutilated bodies turns up in the woods outside the city, and Simon is recruited to profile the killer, Cat is pulled back into a world of murder, mayhem, and magick—one that threatens to swallow them both.`

  const coverImage = '/images/SilenceandShadow.jpg'
  const [progress] = useState(48)

  return (
    <main className="flex items-center justify-center min-h-screen bg-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="backdrop-blur-lg bg-white/10 shadow-2xl p-8 max-w-5xl w-full flex flex-col md:flex-row gap-8"
      >
        <div className="flex-shrink-0 shadow-2xs w-full md:w-1/3">
          <Image
            src={coverImage}
            alt={title}
            width={300}
            height={450}
            className="shadow-md"
            priority
          />
        </div>
        <div className="flex flex-col justify-between w-full">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            <h2 className="text-lg text-gray-500 mb-4">by {author}</h2>
            <p className="text-gray-900 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gray-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="ml-4 text-sm text-gray-900">{progress}%</span>
          </div>

          <button className="mt-6 self-start bg-gray-500 hover:bg-gray-100 text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg transition-colors">
            Continue Reading
          </button>
        </div>
      </motion.div>
    </main>
  )
}
