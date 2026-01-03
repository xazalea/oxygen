'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CurrencyEarnedProps {
  amount: number
  source?: string
  onComplete?: () => void
}

export function CurrencyEarned({ amount, source, onComplete }: CurrencyEarnedProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-20 right-4 z-50"
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Coins className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.div
                  className="text-white font-bold text-xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                >
                  +{amount.toLocaleString()} OXY
                </motion.div>
                {source && (
                  <div className="text-white/80 text-sm">
                    {source}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


