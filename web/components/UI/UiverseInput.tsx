'use client'

import { ReactNode } from 'react'

interface UiverseInputProps {
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  icon?: ReactNode
  className?: string
  required?: boolean
  disabled?: boolean
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  inputRef?: React.RefObject<HTMLInputElement>
}

export function UiverseInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  className = '',
  required = false,
  disabled = false,
  onKeyPress,
  inputRef,
}: UiverseInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white/50">
          {icon}
        </div>
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`input-uiverse ${icon ? 'pl-12' : 'pl-4'} pr-4 ${className} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
    </div>
  )
}

