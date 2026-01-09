'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface UiverseCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function UiverseCard({ children, className = '', hover = true }: UiverseCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={`card-uiverse ${className}`}
    >
      {children}
    </motion.div>
  )
}




