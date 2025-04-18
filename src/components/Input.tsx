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
        className={`w-full rounded-lg bg-white/10 backdrop-blur-xl px-4 py-2 text-sm text-[#2e2d2de5] placeholder-[#a9a9a9] shadow-md focus:outline-none focus:ring-2 focus:ring-[#fcfcfc54] ${className}`}
      />
    </div>
  )
}
