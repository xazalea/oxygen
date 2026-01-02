'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { SideMenu } from '@/components/Navigation/SideMenu'
import { ArrowLeft, Filter, Globe, Languages, EyeOff } from 'lucide-react'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { UiverseToggle, UiverseSelect } from '@/components/UI/UiverseComponents'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import Link from 'next/link'

export default function FeedSettingsPage() {
  const [showMenu, setShowMenu] = useState(false)
  const [settings, setSettings] = useState({
    language: 'en',
    matureContent: false,
    blockedKeywords: [] as string[],
    blockedUsers: [] as string[],
    blockedHashtags: [] as string[],
    algorithmPreference: 'balanced', // balanced, discovery, following
    autoPlay: true,
    dataSaver: false
  })

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
          <h1 className="text-xl font-bold text-white">Feed Settings</h1>
        </div>
      </LiquidGlass>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Content Filters */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Content Filters</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Mature Content</p>
                <p className="text-white/60 text-sm">Show content marked as mature</p>
              </div>
              <UiverseToggle
                checked={settings.matureContent}
                onChange={(checked) => setSettings(prev => ({ ...prev, matureContent: checked }))}
              />
            </div>
          </div>
        </UiverseCard>

        {/* Blocked Content */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <EyeOff className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Blocked Content</h2>
          </div>
          
          <div className="space-y-3">
            <UiverseButton variant="outline" className="w-full">
              Blocked Keywords ({settings.blockedKeywords.length})
            </UiverseButton>
            <UiverseButton variant="outline" className="w-full">
              Blocked Users ({settings.blockedUsers.length})
            </UiverseButton>
            <UiverseButton variant="outline" className="w-full">
              Blocked Hashtags ({settings.blockedHashtags.length})
            </UiverseButton>
          </div>
        </UiverseCard>

        {/* Algorithm Preferences */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Algorithm Preferences</h2>
          </div>
          
          <div>
            <p className="text-white font-medium mb-2">Feed Type</p>
            <UiverseSelect
              value={settings.algorithmPreference}
              onChange={(value) => setSettings(prev => ({ ...prev, algorithmPreference: value }))}
              options={[
                { value: 'balanced', label: 'Balanced' },
                { value: 'discovery', label: 'Discovery' },
                { value: 'following', label: 'Following Only' }
              ]}
            />
          </div>
        </UiverseCard>

        {/* Language */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Language</h2>
          </div>
          
          <div>
            <p className="text-white font-medium mb-2">Content Language</p>
            <UiverseSelect
              value={settings.language}
              onChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'ja', label: 'Japanese' },
                { value: 'zh', label: 'Chinese' }
              ]}
            />
          </div>
        </UiverseCard>

        {/* Playback */}
        <UiverseCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Playback</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-play Videos</p>
                <p className="text-white/60 text-sm">Automatically play videos in feed</p>
              </div>
              <UiverseToggle
                checked={settings.autoPlay}
                onChange={(checked) => setSettings(prev => ({ ...prev, autoPlay: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Data Saver</p>
                <p className="text-white/60 text-sm">Reduce data usage</p>
              </div>
              <UiverseToggle
                checked={settings.dataSaver}
                onChange={(checked) => setSettings(prev => ({ ...prev, dataSaver: checked }))}
              />
            </div>
          </div>
        </UiverseCard>
      </div>

      <SideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
      <BottomNav />
    </div>
  )
}

