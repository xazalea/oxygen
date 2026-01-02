'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface UiverseButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function UiverseButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: UiverseButtonProps) {
  const baseClasses = 'btn-uiverse ripple-uiverse relative overflow-hidden'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    secondary: 'bg-gradient-to-r from-purple-500 to-pink-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500',
    ghost: 'bg-transparent border-2 border-white/20 hover:bg-white/10',
    icon: 'bg-transparent border-none hover:bg-white/10 p-2',
    outline: 'bg-transparent border-2 border-white/30 hover:border-white/50 hover:bg-white/5',
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </motion.button>
  )
}

