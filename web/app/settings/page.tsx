'use client'

import { BottomNav } from '@/components/Navigation/BottomNav'
import { ArrowLeft, User, Bell, Shield, Moon, Globe, HelpCircle, LogOut, LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseCard } from '@/components/UI/UiverseCard'

type SettingsItem = 
  | { icon: LucideIcon; label: string; path: string; toggle?: never; danger?: boolean }
  | { icon: LucideIcon; label: string; path: null; toggle: boolean; danger?: never }

type SettingsGroup = {
  title: string
  items: SettingsItem[]
}

export default function SettingsPage() {
  const router = useRouter()

  const settingsGroups: SettingsGroup[] = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit profile', path: '/profile/edit' },
        { icon: Bell, label: 'Notifications', path: '/settings/notifications' },
        { icon: Shield, label: 'Privacy', path: '/settings/privacy' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Dark mode', path: null, toggle: true },
        { icon: Globe, label: 'Language', path: '/settings/language' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', path: '/help' },
        { icon: LogOut, label: 'Log out', path: '/logout', danger: true },
      ],
    },
  ]

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <UiverseIconButton
          icon={<ArrowLeft className="w-5 h-5 text-white" />}
          onClick={() => router.back()}
          size="sm"
        />
        <h1 className="text-xl font-bold gradient-text-uiverse">Settings</h1>
      </header>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="px-4 py-4">
            <h2 className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wider">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon
                return (
                  <UiverseCard key={itemIndex} className="p-0 overflow-hidden">
                    <UiverseButton
                      onClick={() => {
                        if (item.path) {
                          router.push(item.path)
                        } else if ('toggle' in item && item.toggle) {
                          // Toggle logic
                        }
                      }}
                      variant="ghost"
                      size="lg"
                      className={`w-full flex items-center gap-4 px-4 py-4 justify-start ${
                        item.danger ? 'text-red-400 hover:text-red-300' : 'text-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.danger ? 'bg-red-500/20' : 'bg-white/10'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold flex-1 text-left">{item.label}</span>
                      {'toggle' in item && item.toggle && (
                        <div className="toggle-uiverse active"></div>
                      )}
                    </UiverseButton>
                  </UiverseCard>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

