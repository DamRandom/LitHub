import React from 'react'

interface InputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
}: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#2e2d2de5] mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl bg-white border border-neutral-300 px-3.5 py-2 text-sm text-neutral-800 placeholder-neutral-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 transition-all ${className}`}
      />
    </div>
  )
}
