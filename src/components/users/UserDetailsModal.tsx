'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Edit3, Info, Key } from 'lucide-react'
import { User } from '@/types/user'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onEdit: (user: User) => void
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit,
}: UserDetailsModalProps) {
  if (!isOpen || !user) return null

  const formattedDate = new Date(user.fechaRegistro).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>

          {/* Profile Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
              {user.nombre.charAt(0)}
              {user.apellido.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {user.nombre} {user.apellido}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded">
                  {user.rol || 'user'}
                </span>
              </div>
              <p className="text-xs font-mono text-gray-500 flex items-center gap-1 mt-0.5">
                <Key size={12} className="text-neutral-400" />
                @{user.usuario} <span className="text-[10px] text-gray-400">(Primary Key)</span>
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="space-y-3 text-xs text-gray-700 mb-5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-medium block uppercase">Age</span>
                <span className="text-sm font-bold text-gray-900">{user.edad} years</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-medium block uppercase">Gender</span>
                <span className="text-sm font-bold text-gray-900">{user.sexo}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
              <Calendar size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 font-medium block uppercase">Registration Date</span>
                <span className="text-xs font-semibold text-gray-800">{formattedDate}</span>
              </div>
            </div>

            {user.bio && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block uppercase">Bio</span>
                  <span className="text-xs text-gray-700">{user.bio}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(user)
              }}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
