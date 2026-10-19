'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { User } from '@/types/user'

interface UserDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  userToDelete: User | null
  onConfirm: (usuario: string) => { success: boolean; message: string }
}

export default function UserDeleteModal({
  isOpen,
  onClose,
  userToDelete,
  onConfirm,
}: UserDeleteModalProps) {
  if (!isOpen || !userToDelete) return null

  const handleConfirm = () => {
    onConfirm(userToDelete.usuario)
    onClose()
  }

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

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete User?</h3>
            <p className="text-xs text-gray-500 mb-4">
              You are about to delete{' '}
              <strong className="text-gray-900 font-mono">@{userToDelete.usuario}</strong> (
              {userToDelete.nombre} {userToDelete.apellido}).
            </p>

            <div className="bg-gray-50 p-3 rounded-xl text-left text-xs text-gray-700 border border-gray-100 mb-5 space-y-1">
              <p>• <strong>Primary key:</strong> {userToDelete.usuario}</p>
              <p>• <strong>Role:</strong> {userToDelete.rol || 'user'}</p>
              <p>• <strong>Age / Gender:</strong> {userToDelete.edad} years old, {userToDelete.sexo}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
