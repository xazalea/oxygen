'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface UiverseIconButtonProps {
  icon: ReactNode
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
}

export function UiverseIconButton({
  icon,
  onClick,
  className = '',
  size = 'md',
  variant = 'default',
}: UiverseIconButtonProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  }

  const variantClasses = {
    default: 'bg-white/10 border-white/20',
    primary: 'bg-gradient-to-br from-indigo-500 to-purple-500 border-transparent',
    danger: 'bg-gradient-to-br from-red-500 to-pink-500 border-transparent',
    ghost: 'bg-transparent border-none hover:bg-white/5',
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      className={`icon-btn-uiverse ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon}
    </motion.button>
  )
}

