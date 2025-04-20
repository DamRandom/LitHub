'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center p-8 bg-white shadow-lg rounded-lg max-w-lg w-full"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to LitHub</h1>
        <p className="text-gray-600 mb-6">Your personal book management dashboard.</p>
        
        {/* Placeholder sections */}
        <div className="space-y-4 mb-6">
          <div className="h-12 w-full bg-gray-300 rounded-lg"></div>
          <div className="h-12 w-full bg-gray-300 rounded-lg"></div>
          <div className="h-12 w-full bg-gray-300 rounded-lg"></div>
        </div>

        <motion.button
          onClick={() => router.push('/login')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="py-2 px-6 bg-[#7a7066] text-white font-semibold rounded-lg shadow-md transition duration-200 hover:bg-[#8c8378]"
        >
          Go to Login
        </motion.button>
      </motion.div>
    </div>
  )
}
