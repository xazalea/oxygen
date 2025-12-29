'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Plus, Inbox, User } from 'lucide-react'
import { motion } from 'framer-motion'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Discover', path: '/discover' },
    { icon: Plus, label: 'Create', path: '/create' },
    { icon: Inbox, label: 'Inbox', path: '/inbox' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/10">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          
          return (
            <motion.button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative ripple-uiverse"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                className="relative"
              >
                {isActive ? (
                  <div className="relative">
                    <Icon
                      className="w-6 h-6 text-white relative z-10"
                      fill="currentColor"
                    />
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-lg rounded-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                ) : (
                  <Icon
                    className="w-6 h-6 text-white/60 transition-colors"
                    fill="none"
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full glow-uiverse"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/60'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}

