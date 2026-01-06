'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Tag, Search, Filter, Star, Heart } from 'lucide-react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseButton } from '@/components/UI/UiverseButton'

const PRODUCTS = [
  {
    id: 1,
    title: 'Vintage Camera Lens',
    price: '$120',
    image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&q=80',
    seller: 'PhotoPro',
    rating: 4.8
  },
  {
    id: 2,
    title: 'Neon Sign "Vibes"',
    price: '$85',
    image: 'https://images.unsplash.com/photo-1563245372-f21720e32c4d?w=500&q=80',
    seller: 'LightWorks',
    rating: 4.9
  },
  {
    id: 3,
    title: 'Limited Edition Sneakers',
    price: '$240',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&q=80',
    seller: 'SneakerHead',
    rating: 4.7
  },
  {
    id: 4,
    title: 'Mechanical Keyboard',
    price: '$150',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80',
    seller: 'Keebs',
    rating: 4.9
  }
]

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('All')

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md px-4 py-4 border-b border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold gradient-text-uiverse">Marketplace</h1>
          <div className="flex gap-2">
            <button className="p-2 bg-white/5 rounded-full hover:bg-white/10">
              <ShoppingBag className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 bg-white/5 rounded-full hover:bg-white/10">
              <Heart className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search items, sellers..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Electronics', 'Fashion', 'Home', 'Art', 'Collectibles'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-white text-black' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Product Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {PRODUCTS.map(product => (
          <LiquidGlass 
            key={product.id} 
            preset="glass" 
            className="rounded-xl overflow-hidden group cursor-pointer"
          >
            <div className="relative aspect-square overflow-hidden">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded-md text-white font-bold text-xs">
                {product.price}
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="text-white text-sm font-semibold truncate mb-1">{product.title}</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/40 text-xs truncate w-24">{product.seller}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-white/60 text-[10px]">{product.rating}</span>
                  </div>
                </div>
                <div className="p-1.5 bg-indigo-500 rounded-lg">
                  <ShoppingBag className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </LiquidGlass>
        ))}
      </div>

      {/* Featured Sellers Section */}
      <div className="px-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold">Top Sellers</h2>
          <span className="text-indigo-400 text-xs">View all</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-[2px]">
                <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-white/60 text-xs">Seller {i}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

