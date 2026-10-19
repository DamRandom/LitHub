'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User as UserIcon,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Key,
  Calendar,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/lib/auth-context'
import { Sexo } from '@/types/user'

export default function ProfilePage() {
  const { currentUser, isAuthenticated, isLoading, editUser, logout } = useAuth()
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [edad, setEdad] = useState('')
  const [sexo, setSexo] = useState<Sexo>('Male')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [bio, setBio] = useState('')

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (currentUser) {
      setNombre(currentUser.nombre)
      setApellido(currentUser.apellido)
      setEdad(currentUser.edad.toString())
      setSexo(currentUser.sexo)
      setBio(currentUser.bio || '')
    }
  }, [currentUser])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    if (!nombre.trim() || !apellido.trim()) {
      showToast('First and last name are required.', 'error')
      return
    }

    const edadNum = parseInt(edad, 10)
    if (isNaN(edadNum) || edadNum <= 0 || edadNum > 120) {
      showToast('Please enter a valid age (1 to 120).', 'error')
      return
    }

    if (password && password !== confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }

    if (password && password.length < 4) {
      showToast('The new password must be at least 4 characters.', 'error')
      return
    }

    setLoading(true)

    const res = await editUser({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      edad: edadNum,
      sexo,
      password: password.trim() ? password : undefined,
      bio: bio.trim(),
    })

    setLoading(false)

    if (res.success) {
      showToast('Profile updated successfully!', 'success')
      setPassword('')
      setConfirmPassword('')
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6">
          <div className="lithub-card rounded-3xl p-8 max-w-md w-full text-center ring-1 ring-black/[0.03]">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <UserIcon size={24} className="stroke-[1.75]" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1 tracking-tight">You are not signed in</h2>
            <p className="text-xs text-neutral-500 mb-5">
              Sign in to view and manage your reader profile.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl font-semibold text-xs shadow-2xs transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const formattedDate = new Date(currentUser.fechaRegistro).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen w-full flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full pt-24 pb-12 px-4 sm:px-6">
        <div className="lithub-card rounded-3xl max-w-5xl mx-auto min-h-[70vh] p-6 sm:p-8 space-y-6 ring-1 ring-black/[0.03]">
          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`fixed top-20 right-6 z-50 p-3.5 px-4 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-medium ${
                  toast.type === 'success'
                    ? 'bg-gray-900 text-white border-gray-800'
                    : 'bg-red-900 text-white border-red-800'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="text-red-400" />
                )}
                <span>{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                {currentUser.nombre.charAt(0)}
                {currentUser.apellido.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentUser.nombre} {currentUser.apellido}
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {currentUser.rol || 'user'}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-500 flex items-center gap-1 mt-0.5">
                  <Key size={12} className="text-neutral-500" />
                  @{currentUser.usuario} (Primary Key)
                </p>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Member since {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-1">Edit Personal Information</h2>
            <p className="text-xs text-gray-500 mb-5">Update your details and reading preferences</p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Primary Key (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username (Primary Key)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Key size={14} className="text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={currentUser.usuario}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Sexo)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition text-gray-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio / Reading Interests
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your favorite genres or preferred authors..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                />
              </div>

              {/* Password Section */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 mb-2">
                  Change Password (Optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={14} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={14} />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-medium rounded-xl shadow-md transition flex items-center gap-1.5 text-xs"
                >
                  <Save size={14} />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
