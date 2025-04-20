'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ContinueReading() {
  const title = 'Silence and Shadow'
  const author = 'Erin Beaty'
  const description = `After confronting a killer and fleeing her home to be with each other, Cat and Simon arrive in the sprawling city of Londunium pretending to be a newly married couple, but don’t expect to keep up the ruse for long. Cat looks forward to honing her healing magick at the local Selanae university, but instead finds a council of ruthless leaders threatening to erase her non-Selanae "husband’s" memories to protect their secrets.

Terrified to lose him, Cat takes desperate steps to keep him safe. But when a string of mutilated bodies turns up in the woods outside the city, and Simon is recruited to profile the killer, Cat is pulled back into a world of murder, mayhem, and magick—one that threatens to swallow them both.`
  const coverImage = '/images/SilenceandShadow.jpg' // cambia si tenés otra
  const [progress] = useState(48)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row">
        <Image
          src={coverImage}
          alt={title}
          width={150}
          height={220}
          className="rounded-md mb-4 md:mb-0 md:mr-6"
        />
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-gray-600 mb-2">by {author}</p>
          <p className="text-gray-800 text-sm mb-4 line-clamp-5">{description}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-300">
            <motion.div
              className="bg-indigo-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}% read</p>
        </div>
      </div>
    </div>
  )
}
