'use client'

import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'
import Input from '@/components/Input'

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md p-8 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <img src="/logo/logo.png" alt="Logo" className="h-12" />
        </motion.div>

        {/* Form */}
        <motion.form
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
          />

          {/* Remember Me */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <label className="flex items-center space-x-2 text-sm text-[#2e2d2de5]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[#a59e96] bg-transparent border-[#a59e96] rounded focus:ring-1 focus:ring-[#a59e96]"
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-sm text-[#8c8378] hover:underline">
              Forgot password?
            </a>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 px-4 bg-[#8c8378] hover:bg-[#7a7066] text-white font-semibold rounded-lg shadow-md transition duration-200"
          >
            Sign in
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-[#2e2d2de5] opacity-30" />
            <span className="px-3 text-sm text-[#2e2d2de5]">or</span>
            <div className="flex-grow h-px bg-[#2e2d2de5] opacity-30" />
          </div>


          {/* Google Sign In */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white bg-opacity-20 text-gray-800 font-medium rounded-lg shadow-sm transition duration-300 hover:bg-opacity-30"
          >
            <FcGoogle className="text-xl" />
            Sign in with Google
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}
