'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserX,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Sexo } from '@/types/user'

export default function AuthPage() {
  const { login, register, loginAsGuest, isAuthenticated, isGuest, isLoading } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Login form state
  const [lUser, setLUser] = useState('')
  const [lPass, setLPass] = useState('')

  // Register form state
  const [rf, setRf] = useState({
    firstName: '',
    lastName: '',
    username: '',
    age: '',
    gender: 'Male' as Sexo,
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Interactive mouse lighting with slow, fluid physics
  const cardRef = useRef<HTMLDivElement>(null)
  const rawMouseX = useMotionValue(700)
  const rawMouseY = useMotionValue(400)

  // Luxurious fluid inertia: lower stiffness and high damping create a smooth, liquid drag
  const smoothX = useSpring(rawMouseX, { stiffness: 65, damping: 26, mass: 1.1 })
  const smoothY = useSpring(rawMouseY, { stiffness: 65, damping: 26, mass: 1.1 })

  // Relative mouse coordinates within the card for specular reflection
  const cardRelX = useMotionValue(200)
  const cardRelY = useMotionValue(200)
  const smoothCardRelX = useSpring(cardRelX, { stiffness: 75, damping: 28 })
  const smoothCardRelY = useSpring(cardRelY, { stiffness: 75, damping: 28 })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      rawMouseX.set(centerX)
      rawMouseY.set(centerY)
    }
  }, [rawMouseX, rawMouseY])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    rawMouseX.set(e.clientX)
    rawMouseY.set(e.clientY)

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      cardRelX.set(e.clientX - rect.left)
      cardRelY.set(e.clientY - rect.top)
    }
  }

  useEffect(() => {
    if (!isLoading && (isAuthenticated || isGuest)) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isGuest, isLoading, router])

  const handleGuestLogin = () => {
    loginAsGuest()
    window.location.replace('/dashboard')
  }

  const clearFeedback = () => {
    setError(null)
    setSuccess(null)
  }

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode)
    clearFeedback()
    setLoading(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    setLoading(true)

    const res = await login(lUser, lPass)
    if (res.success) {
      setSuccess('Welcome back. Opening your library…')
      setTimeout(() => {
        window.location.replace('/dashboard')
      }, 500)
    } else {
      setError(res.message)
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    if (!rf.firstName.trim() || !rf.lastName.trim() || !rf.username.trim()) {
      setError('Please complete all required fields.')
      return
    }

    const cleanUsername = rf.username.trim()
    if (cleanUsername.length < 3) {
      setError('Username must contain at least 3 characters.')
      return
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      setError('Username can only include letters, numbers, hyphens, and dots.')
      return
    }

    const ageNum = parseInt(rf.age, 10)
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError('Please enter a valid age between 1 and 120.')
      return
    }

    if (rf.password.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    if (rf.password !== rf.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const res = await register({
      usuario: cleanUsername,
      nombre: rf.firstName.trim(),
      apellido: rf.lastName.trim(),
      edad: ageNum,
      sexo: rf.gender,
      password: rf.password,
      rol: 'usuario',
    })

    if (res.success) {
      setSuccess('Account created successfully. Preparing your space…')
      setTimeout(() => {
        window.location.replace('/dashboard')
      }, 600)
    } else {
      setError(res.message)
      setLoading(false)
    }
  }

  if (isLoading || isAuthenticated || isGuest) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-9 h-9 border-[2.5px] border-neutral-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest text-neutral-400 font-medium uppercase">
            LitHub
          </span>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative min-h-screen w-full overflow-x-hidden bg-white flex flex-col items-center justify-center p-3.5 sm:p-8 select-none"
    >
      {/* ── INTERACTIVE MOUSE GRADIENTS (Deluxe Ambient Lighting) ── */}
      {/* 1. Primary warm soft diffusion */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -inset-[400px] z-0 opacity-50"
        style={{
          background: `radial-gradient(700px circle at ${smoothX}px ${smoothY}px, rgba(245, 158, 11, 0.06), rgba(99, 102, 241, 0.03) 45%, transparent 70%)`,
        }}
      />

      {/* 2. Delicate slate-tinted accent */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -inset-[300px] z-0 opacity-20 mix-blend-multiply"
        style={{
          background: `radial-gradient(450px circle at ${smoothX}px ${smoothY}px, rgba(99, 102, 241, 0.08), transparent 70%)`,
        }}
      />

      {/* 3. Subtle editorial grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* 4. Ambient corner lights — subtle on white */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-100/20 via-amber-50/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-100/15 via-violet-50/10 to-transparent blur-3xl"
      />

      {/* ── FLOATING LUXURY CARD ── */}
      <motion.div
        ref={cardRef}
        layout
        transition={{
          layout: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
        }}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`relative z-10 w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mode === 'login' ? 'max-w-[440px]' : 'max-w-[540px]'
        }`}
      >
        {/* Outer ambient card shadow and border */}
        <div className="relative rounded-[2.25rem] p-[1px] bg-gradient-to-b from-white/95 via-white/70 to-white/40 shadow-[0_30px_90px_-20px_rgba(28,25,23,0.08),0_12px_32px_-10px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]">
          {/* Card surface with frosted glass & internal sheen */}
          <div className="relative overflow-hidden rounded-[2.2rem] bg-white/80 backdrop-blur-2xl px-5 py-6 sm:px-9 sm:py-10 border border-white/80">
            {/* Interactive specular highlight gliding across the card surface */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px opacity-60 transition-opacity duration-500"
              style={{
                background: `radial-gradient(420px circle at ${smoothCardRelX}px ${smoothCardRelY}px, rgba(255, 255, 255, 0.95), transparent 70%)`,
              }}
            />

            {/* ── CARD HEADER ── */}
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-1">
                <Image
                  src="/logo/lithub.png"
                  alt="LitHub"
                  width={120}
                  height={36}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>

              <motion.p
                key={mode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[12.5px] text-neutral-500 font-normal tracking-tight mt-1 max-w-[320px]"
              >
                {mode === 'login'
                  ? 'A curated sanctuary for the quiet art of reading.'
                  : 'Join your private space to catalog books, quotes, and thoughts.'}
              </motion.p>
            </div>

            {/* ── REFINED SEGMENTED PILL SWITCHER ── */}
            <div className="relative z-10 mt-6 mb-6">
              <div className="relative flex p-1 bg-neutral-100/80 rounded-2xl border border-neutral-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`relative z-10 flex-1 py-2 text-xs font-semibold tracking-tight rounded-xl transition-colors duration-300 cursor-pointer ${
                    mode === 'login' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {mode === 'login' && (
                    <motion.div
                      layoutId="luxury-active-tab"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 34,
                        mass: 0.8,
                      }}
                      className="pointer-events-none absolute inset-0 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] border border-neutral-200/40"
                    />
                  )}
                  <span className="relative z-10">Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`relative z-10 flex-1 py-2 text-xs font-semibold tracking-tight rounded-xl transition-colors duration-300 cursor-pointer ${
                    mode === 'register' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {mode === 'register' && (
                    <motion.div
                      layoutId="luxury-active-tab"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 34,
                        mass: 0.8,
                      }}
                      className="pointer-events-none absolute inset-0 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] border border-neutral-200/40"
                    />
                  )}
                  <span className="relative z-10">Create Account</span>
                </button>
              </div>
            </div>

            {/* ── FEEDBACK ALERTS ── */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 mb-5 p-3.5 bg-red-50/85 border border-red-200/70 rounded-2xl text-red-900 text-xs flex items-center gap-2.5 shadow-2xs"
                >
                  <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 mb-5 p-3.5 bg-neutral-900 text-white rounded-2xl text-xs flex items-center gap-2.5 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.18)]"
                >
                  <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                  <span className="font-medium leading-relaxed">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FORM CONTAINER ── */}
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  /* ════════════ SIGN IN ════════════ */
                  <motion.form
                    key="login-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-neutral-600 tracking-wide uppercase">
                        Username
                      </label>
                      <div className="relative flex items-center group">
                        <User
                          size={15}
                          className="absolute left-3.5 text-neutral-400 transition-colors duration-200 group-focus-within:text-neutral-800 pointer-events-none"
                        />
                        <input
                          type="text"
                          required
                          autoFocus
                          value={lUser}
                          onChange={(e) => setLUser(e.target.value)}
                          placeholder="Your username"
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl pl-10 pr-4 py-3 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Password
                        </label>
                      </div>
                      <div className="relative flex items-center group">
                        <Lock
                          size={15}
                          className="absolute left-3.5 text-neutral-400 transition-colors duration-200 group-focus-within:text-neutral-800 pointer-events-none"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={lPass}
                          onChange={(e) => setLPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl pl-10 pr-11 py-3 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-neutral-400 hover:text-neutral-800 p-1.5 rounded-lg transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full overflow-hidden rounded-2xl bg-[#171717] hover:bg-neutral-900 text-white py-3.5 px-5 text-xs font-semibold tracking-wide transition-all duration-300 active:scale-[0.99] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] disabled:opacity-50 cursor-pointer"
                      >
                        {/* Subtle ambient light on button hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex items-center justify-center gap-2">
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Enter Library</span>
                              <ArrowRight
                                size={14}
                                className="transition-transform duration-300 group-hover:translate-x-1 text-white/80"
                              />
                            </>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Guest access separator */}
                    <div className="relative flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-neutral-200/70" />
                      <span className="text-[10px] font-medium text-neutral-400 tracking-wide uppercase">or</span>
                      <div className="flex-1 h-px bg-neutral-200/70" />
                    </div>

                    {/* Guest button */}
                    <button
                      type="button"
                      onClick={handleGuestLogin}
                      className="group w-full flex items-center justify-center gap-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-white text-neutral-600 hover:text-neutral-900 py-3 px-5 text-xs font-medium tracking-wide transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                    >
                      <UserX size={14} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                      <span>Continue as guest</span>
                    </button>

                    {/* Footer switch prompt */}
                    <div className="text-center pt-1">
                      <p className="text-[11.5px] text-neutral-400">
                        New to LitHub?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className="font-semibold text-neutral-800 hover:text-neutral-950 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-800 transition-colors"
                        >
                          Create an account
                        </button>
                      </p>
                    </div>
                  </motion.form>
                ) : (
                  /* ════════════ CREATE ACCOUNT ════════════ */
                  <motion.form
                    key="register-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onSubmit={handleRegister}
                    className="space-y-3.5"
                  >
                    {/* First & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={rf.firstName}
                          onChange={(e) => setRf({ ...rf, firstName: e.target.value })}
                          placeholder="e.g. Elena"
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={rf.lastName}
                          onChange={(e) => setRf({ ...rf, lastName: e.target.value })}
                          placeholder="e.g. Vance"
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Username *
                        </label>
                        <span className="text-[9.5px] font-mono font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md border border-neutral-200/60">
                          Unique ID
                        </span>
                      </div>
                      <div className="relative flex items-center group">
                        <User
                          size={14}
                          className="absolute left-3.5 text-neutral-400 transition-colors duration-200 group-focus-within:text-neutral-800 pointer-events-none"
                        />
                        <input
                          type="text"
                          required
                          value={rf.username}
                          onChange={(e) => setRf({ ...rf, username: e.target.value })}
                          placeholder="elena_vance"
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 font-mono border border-neutral-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                      </div>
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Age *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          required
                          value={rf.age}
                          onChange={(e) => setRf({ ...rf, age: e.target.value })}
                          placeholder="26"
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Gender *
                        </label>
                        <select
                          value={rf.gender}
                          onChange={(e) => setRf({ ...rf, gender: e.target.value as Sexo })}
                          className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Password *
                        </label>
                        <div className="relative flex items-center group">
                          <Lock
                            size={14}
                            className="absolute left-3.5 text-neutral-400 transition-colors duration-200 group-focus-within:text-neutral-800 pointer-events-none"
                          />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={rf.password}
                            onChange={(e) => setRf({ ...rf, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl pl-9 pr-9 py-2.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 text-neutral-400 hover:text-neutral-800 p-1"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10.5px] font-semibold text-neutral-600 tracking-wide uppercase">
                          Confirm *
                        </label>
                        <div className="relative flex items-center group">
                          <Lock
                            size={14}
                            className="absolute left-3.5 text-neutral-400 transition-colors duration-200 group-focus-within:text-neutral-800 pointer-events-none"
                          />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={rf.confirmPassword}
                            onChange={(e) => setRf({ ...rf, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-neutral-50/60 hover:bg-white focus:bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl pl-9 pr-9 py-2.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 text-neutral-400 hover:text-neutral-800 p-1"
                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          >
                            {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full overflow-hidden rounded-2xl bg-[#171717] hover:bg-neutral-900 text-white py-3.5 px-5 text-xs font-semibold tracking-wide transition-all duration-300 active:scale-[0.99] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] disabled:opacity-50 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex items-center justify-center gap-2">
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Create Your Library</span>
                              <ArrowRight
                                size={14}
                                className="transition-transform duration-300 group-hover:translate-x-1 text-white/80"
                              />
                            </>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Footer switch prompt */}
                    <div className="text-center pt-1">
                      <p className="text-[11.5px] text-neutral-400">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="font-semibold text-neutral-800 hover:text-neutral-950 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-800 transition-colors"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Subtle literary motto at bottom */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <span>✦</span>
          <span>LitHub Private Library &middot; Designed for mindful readers</span>
        </div>
      </motion.div>
    </div>
  )
}
