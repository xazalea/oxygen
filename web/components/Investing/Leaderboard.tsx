'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Users } from 'lucide-react'
import { LiquidGlass } from '../UI/LiquidGlass'
import { UiverseTabs } from '../UI/UiverseComponents'
import { getInvestmentService } from '@/lib/investing/investment-service'

interface LeaderboardProps {
  type?: 'investors' | 'posts'
}

export function Leaderboard({ type = 'investors' }: LeaderboardProps) {
  const [investors, setInvestors] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const [investorsResponse, postsResponse] = await Promise.all([
        fetch('/api/investments/leaderboard?type=investors&limit=10'),
        fetch('/api/investments/leaderboard?type=posts&limit=10')
      ])
      
      if (investorsResponse.ok) {
        const investorsData = await investorsResponse.json()
        setInvestors(investorsData)
      }
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        setPosts(postsData)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    {
      id: 'investors',
      label: 'Top Investors',
      content: (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : investors.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No investors yet
            </div>
          ) : (
            investors.map((investor, index) => (
              <motion.div
                key={investor.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-white/10 text-white'
                }`}>
                  {index < 3 ? <Trophy className="w-5 h-5" /> : index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    User {investor.userId.slice(0, 8)}...
                  </div>
                  <div className="text-gray-400 text-sm">
                    {investor.investmentCount} investments
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">
                    {investor.totalReturns.toLocaleString()} OXY
                  </div>
                  <div className="text-gray-400 text-xs">Total Returns</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )
    },
    {
      id: 'posts',
      label: 'Top Posts',
      content: (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No posts yet
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.postId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-white/10 text-white'
                }`}>
                  {index < 3 ? <TrendingUp className="w-5 h-5" /> : index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    Post {post.postId.slice(0, 8)}...
                  </div>
                  <div className="text-gray-400 text-sm">
                    {post.investorCount} investors
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold">
                    {post.totalInvested.toLocaleString()} OXY
                  </div>
                  <div className="text-gray-400 text-xs">Total Invested</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )
    }
  ]

  return (
    <LiquidGlass className="p-6 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Leaderboard</h2>
      <UiverseTabs tabs={tabs} defaultTab={type === 'investors' ? 'investors' : 'posts'} />
    </LiquidGlass>
  )
}

