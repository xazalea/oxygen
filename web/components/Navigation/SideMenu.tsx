'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Settings, Bookmark, HelpCircle, Shield, LogOut, Moon, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseCard } from '@/components/UI/UiverseCard'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter()

  const menuItems = [
    { icon: User, label: 'View profile', path: '/profile', divider: false },
    { icon: Bookmark, label: 'Saved videos', path: '/saved', divider: false },
    { icon: Settings, label: 'Settings', path: '/settings', divider: false },
    { icon: Shield, label: 'Privacy', path: '/privacy', divider: false },
    { icon: Moon, label: 'Dark mode', path: null, action: 'toggle-theme', divider: false },
    { icon: Globe, label: 'Language', path: '/language', divider: true },
    { icon: HelpCircle, label: 'Help & Support', path: '/help', divider: false },
    { icon: LogOut, label: 'Log out', path: '/logout', divider: false, danger: true },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 glass-strong z-50 border-l border-white/10"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold gradient-text-uiverse">Menu</h2>
                <UiverseIconButton
                  icon={<X className="w-5 h-5 text-white" />}
                  onClick={onClose}
                  size="sm"
                />
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index}>
                      {item.divider && <div className="h-px bg-white/10 my-2" />}
                      <motion.button
                        onClick={() => {
                          if (item.path) {
                            router.push(item.path)
                            onClose()
                          } else if (item.action === 'toggle-theme') {
                            // Toggle theme logic
                            onClose()
                          }
                        }}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-white/10 transition-all ripple-uiverse ${
                          item.danger ? 'text-red-400 hover:text-red-300' : 'text-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.danger ? 'bg-red-500/20' : 'bg-white/10'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10">
                <p className="text-white/60 text-xs text-center font-medium">
                  <span className="gradient-text-uiverse">Oxygen</span> v1.0.0
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

