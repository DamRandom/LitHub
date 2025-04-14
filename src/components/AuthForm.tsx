'use client'

import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8  bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl ">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo/logo.png" alt="Logo" className="h-12" />
        </div>

        {/* Form */}
        <form className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[#6b4f3b]">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              className="mt-1 block w-full rounded-lg bg-opacity-40 backdrop-blur-sm px-4 py-2 text-sm text-[#3e2c23] placeholder-[#c8b8ac] focus:outline-none focus:ring-2 focus:ring-[#c7a17a] focus:border-[#c7a17a] shadow-sm"
              placeholder="John"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-[#6b4f3b]">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              className="mt-1 block w-full rounded-lg bg-opacity-40 backdrop-blur-sm px-4 py-2 text-sm text-[#3e2c23] placeholder-[#c8b8ac] focus:outline-none focus:ring-2 focus:ring-[#c7a17a] focus:border-[#c7a17a] shadow-sm"
              placeholder="Doe"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#6b4f3b]">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full rounded-lg bg-opacity-40 backdrop-blur-sm px-4 py-2 text-sm text-[#3e2c23] placeholder-[#c8b8ac] focus:outline-none focus:ring-2 focus:ring-[#c7a17a] focus:border-[#c7a17a] shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#6b4f3b]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 rounded border-[#c8b8ac] text-[#c7a17a] focus:ring-[#c7a17a]"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#c7a17a] px-4 py-2 text-white font-semibold hover:bg-[#b88b5f] transition"
          >
            Sign In
          </button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-[#6b4f3b]">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-[#c7a17a] hover:underline">
            Register
          </a>
        </p>

        {/* Google login */}
        <div className="mt-6">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-opacity-40 backdrop-blur-sm border px-4 py-2 text-sm text-[#3e2c23] hover:bg-[#f8f5f0] transition"
          >
            <FcGoogle className="h-5 w-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}
