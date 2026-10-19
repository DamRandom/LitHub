'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, CreateUserInput, UpdateUserInput } from '@/types/user'

interface AuthContextType {
  currentUser: User | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  login: (usuario: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>
  loginAsGuest: () => void
  register: (input: CreateUserInput) => Promise<{ success: boolean; message: string; user?: User }>
  logout: () => Promise<void>
  editUser: (updates: UpdateUserInput) => Promise<{ success: boolean; message: string; user?: User }>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  // Clean old localStorage artifacts once on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('lithub_data')
        localStorage.removeItem('lithub_users')
        localStorage.removeItem('lithub_current_session')
      } catch {
        // ignore
      }
    }
  }, [])

  const checkSession = useCallback(async () => {
    // If already marked as guest in this session, skip server check
    if (typeof window !== 'undefined' && sessionStorage.getItem('lithub_guest') === 'true') {
      setIsGuest(true)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.user) {
          setCurrentUser(data.user)
          setIsGuest(false)
          setIsLoading(false)
          return
        }
      }
      setCurrentUser(null)
    } catch {
      setCurrentUser(null)
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const loginAsGuest = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lithub_guest', 'true')
    }
    setIsGuest(true)
    setCurrentUser(null)
  }

  const login = async (usuario: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      })
      const data = await res.json()
      if (data.success && data.user) {
        setCurrentUser(data.user)
        setIsGuest(false)
        if (typeof window !== 'undefined') sessionStorage.removeItem('lithub_guest')
        return { success: true, message: data.message || 'Welcome', user: data.user }
      }
      return { success: false, message: data.message || 'Failed to sign in.' }
    } catch {
      return { success: false, message: 'Server connection error.' }
    }
  }

  const register = async (input: CreateUserInput) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (data.success && data.user) {
        setCurrentUser(data.user)
        setIsGuest(false)
        if (typeof window !== 'undefined') sessionStorage.removeItem('lithub_guest')
        return { success: true, message: data.message || 'Account created.', user: data.user }
      }
      return { success: false, message: data.message || 'Failed to register.' }
    } catch {
      return { success: false, message: 'Server connection error.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') sessionStorage.removeItem('lithub_guest')
    setCurrentUser(null)
    setIsGuest(false)
  }

  const editUser = async (updates: UpdateUserInput) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (data.success && data.user) {
        setCurrentUser(data.user)
        return { success: true, message: data.message || 'Profile updated.', user: data.user }
      }
      return { success: false, message: data.message || 'Failed to update.' }
    } catch {
      return { success: false, message: 'Server connection error.' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isGuest,
        isLoading,
        login,
        loginAsGuest,
        register,
        logout,
        editUser,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
