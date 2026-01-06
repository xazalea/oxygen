'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Map as MapIcon, Grid, TrendingUp, Music, Hash, User } from 'lucide-react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

const TRENDING_TAGS = ['#cyberpunk', '#generative', '#nightcity', '#neon', '#future']
const TRENDING_POSTS = [1, 2, 3, 4, 5, 6]

export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 space-y-4 border-b border-white/10">
        <h1 className="text-xl font-bold gradient-text-uiverse">Discover</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search users, hashtags, sounds..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* View Toggle */}
        <div className="flex bg-white/5 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'map' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Snap Map
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="space-y-6 p-4">
          {/* Trending Tags */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-white/70">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold">Trending Now</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map(tag => (
                <LiquidGlass 
                  key={tag} 
                  preset="glass" 
                  className="px-3 py-1.5 rounded-full text-xs text-white/80 cursor-pointer hover:bg-white/10"
                >
                  {tag}
                </LiquidGlass>
              ))}
            </div>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TRENDING_POSTS.map(i => (
              <motion.div 
                key={i}
                whileHover={{ scale: 0.98 }}
                className={`relative rounded-xl overflow-hidden bg-white/5 ${i % 3 === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'} aspect-[3/4]`}
              >
                <img 
                  src={`https://picsum.photos/400/600?random=${i}`} 
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                />
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-semibold truncate">Amazing view! #{i}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/60">user_{i}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Featured Creators */}
          <div>
            <h3 className="text-white font-semibold mb-3">Featured Creators</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <LiquidGlass key={i} preset="glass" className="p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500" />
                    <div>
                      <p className="text-white text-sm font-medium">Creative Soul {i}</p>
                      <p className="text-white/40 text-xs">@creative_{i}</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full">
                    Follow
                  </button>
                </LiquidGlass>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-180px)] w-full relative bg-gray-900 overflow-hidden">
          {/* Mock Map View */}
          <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center opacity-20 filter invert" />
          
          {/* Mock Map Pins */}
          {[1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="absolute w-8 h-8 rounded-full border-2 border-white overflow-hidden cursor-pointer"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`
              }}
            >
              <img src={`https://i.pravatar.cc/100?img=${i}`} className="w-full h-full object-cover" />
            </motion.div>
          ))}

          <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl text-center">
            <p className="text-white text-sm font-semibold">Explore your neighborhood</p>
            <p className="text-white/40 text-xs">See what's happening around you</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
