'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { SideMenu } from '@/components/Navigation/SideMenu'
import { ArrowLeft, Lock, Eye, Download, UserX, Shield, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { UiverseToggle, UiverseSelect } from '@/components/UI/UiverseComponents'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import Link from 'next/link'

export default function PrivacySettingsPage() {
  const [showMenu, setShowMenu] = useState(false)
  const [settings, setSettings] = useState({
    privateAccount: false,
    hideViewHistory: false,
    preventDownloads: true,
    allowComments: true,
    allowDuets: true,
    allowStitches: true,
    whoCanComment: 'everyone', // everyone, friends, noone
    whoCanDuet: 'everyone',
    whoCanStitch: 'everyone',
    showActivityStatus: true,
    allowMessages: 'everyone', // everyone, friends, noone
    blockList: [] as string[],
    mutedAccounts: [] as string[]
  })

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  const handleSelect = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <LiquidGlass preset="default" className="sticky top-0 z-50">
        <div className="flex items-center gap-4 p-4">
          <Link href="/settings">
            <UiverseButton variant="icon" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </UiverseButton>
          </Link>
          <h1 className="text-xl font-bold text-white">Privacy Settings</h1>
        </div>
      </LiquidGlass>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Account Privacy */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Account Privacy</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Private Account</p>
                <p className="text-white/60 text-sm">Only approved followers can see your content</p>
              </div>
              <UiverseToggle
                checked={settings.privateAccount}
                onChange={(checked) => handleToggle('privateAccount')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide View History</p>
                <p className="text-white/60 text-sm">Others won't see when you viewed their content</p>
              </div>
              <UiverseToggle
                checked={settings.hideViewHistory}
                onChange={(checked) => handleToggle('hideViewHistory')}
              />
            </div>
          </div>
        </UiverseCard>

        {/* Content Protection */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Content Protection</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Prevent Downloads</p>
                <p className="text-white/60 text-sm">Stop others from downloading your videos</p>
              </div>
              <UiverseToggle
                checked={settings.preventDownloads}
                onChange={(checked) => handleToggle('preventDownloads')}
              />
            </div>
          </div>
        </UiverseCard>

        {/* Interaction Controls */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Who Can Interact</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-white font-medium mb-2">Who Can Comment</p>
              <UiverseSelect
                value={settings.whoCanComment}
                onChange={(value) => handleSelect('whoCanComment', value)}
                options={[
                  { value: 'everyone', label: 'Everyone' },
                  { value: 'friends', label: 'Friends Only' },
                  { value: 'noone', label: 'No One' }
                ]}
              />
            </div>

            <div>
              <p className="text-white font-medium mb-2">Who Can Duet</p>
              <UiverseSelect
                value={settings.whoCanDuet}
                onChange={(value) => handleSelect('whoCanDuet', value)}
                options={[
                  { value: 'everyone', label: 'Everyone' },
                  { value: 'friends', label: 'Friends Only' },
                  { value: 'noone', label: 'No One' }
                ]}
              />
            </div>

            <div>
              <p className="text-white font-medium mb-2">Who Can Stitch</p>
              <UiverseSelect
                value={settings.whoCanStitch}
                onChange={(value) => handleSelect('whoCanStitch', value)}
                options={[
                  { value: 'everyone', label: 'Everyone' },
                  { value: 'friends', label: 'Friends Only' },
                  { value: 'noone', label: 'No One' }
                ]}
              />
            </div>
          </div>
        </UiverseCard>

        {/* Messages */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Messages</h2>
          </div>
          
          <div>
            <p className="text-white font-medium mb-2">Who Can Message You</p>
            <UiverseSelect
              value={settings.allowMessages}
              onChange={(value) => handleSelect('allowMessages', value)}
              options={[
                { value: 'everyone', label: 'Everyone' },
                { value: 'friends', label: 'Friends Only' },
                { value: 'noone', label: 'No One' }
              ]}
            />
          </div>
        </UiverseCard>

        {/* Data Management */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Data Management</h2>
          </div>
          
          <div className="space-y-3">
            <UiverseButton variant="outline" className="w-full">
              Export My Data
            </UiverseButton>
            <UiverseButton variant="danger" className="w-full">
              Delete My Account
            </UiverseButton>
          </div>
        </UiverseCard>

        {/* Blocked & Muted */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <UserX className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Blocked & Muted</h2>
          </div>
          
          <div className="space-y-3">
            <UiverseButton variant="outline" className="w-full">
              Manage Blocked Accounts ({settings.blockList.length})
            </UiverseButton>
            <UiverseButton variant="outline" className="w-full">
              Manage Muted Accounts ({settings.mutedAccounts.length})
            </UiverseButton>
          </div>
        </UiverseCard>
      </div>

      <SideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
      <BottomNav />
    </div>
  )
}

