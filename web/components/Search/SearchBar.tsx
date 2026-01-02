'use client'

import { useState, useRef, useEffect } from 'react'
import { Search as SearchIcon, X, TrendingUp, Hash, User, Music } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseCard } from '@/components/UI/UiverseCard'

interface SearchResult {
  type: 'user' | 'hashtag' | 'music' | 'video'
  id: string
  title: string
  subtitle?: string
  image?: string
}

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    
    // In production, fetch from API
    // For now, generate sample results
    const sampleResults: SearchResult[] = [
      {
        type: 'hashtag',
        id: `hashtag-${searchQuery}`,
        title: `#${searchQuery}`,
        subtitle: '1.2M videos',
      },
      {
        type: 'user',
        id: `user-${searchQuery}`,
        title: `@${searchQuery}`,
        subtitle: '500K followers',
      },
      {
        type: 'music',
        id: `music-${searchQuery}`,
        title: `${searchQuery} Sound`,
        subtitle: '50K videos',
      },
    ]
    
    setResults(sampleResults)
    setIsSearching(false)
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'hashtag') {
      router.push(`/hashtag/${result.title.substring(1)}`)
    } else if (result.type === 'user') {
      router.push(`/user/${result.title.substring(1)}`)
    } else if (result.type === 'music') {
      router.push(`/music/${result.id}`)
    }
    setIsOpen(false)
    setQuery('')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'hashtag':
        return <Hash className="w-5 h-5" />
      case 'user':
        return <User className="w-5 h-5" />
      case 'music':
        return <Music className="w-5 h-5" />
      default:
        return <TrendingUp className="w-5 h-5" />
    }
  }

  return (
    <>
      <UiverseButton
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="md"
        className="flex items-center gap-3 px-4 py-2.5 rounded-full flex-1 max-w-md"
      >
        <SearchIcon className="w-4 h-4 text-white/70" />
        <span className="text-white/70 text-sm font-medium">Search</span>
      </UiverseButton>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <UiverseInput
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        handleSearch(e.target.value)
                      }}
                      placeholder="Search accounts, videos, sounds..."
                      icon={<SearchIcon className="w-5 h-5" />}
                      className="rounded-full"
                    />
                  </div>
                  <UiverseIconButton
                    icon={<X className="w-5 h-5 text-white" />}
                    onClick={() => setIsOpen(false)}
                    size="sm"
                  />
                </div>

                {/* Results */}
                {query && (
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="spinner-uiverse"></div>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-2">
                        {results.map((result) => (
                          <UiverseButton
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            variant="ghost"
                            size="lg"
                            className="w-full flex items-center gap-3 p-3 justify-start h-auto"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-white/80 border border-white/10">
                              {getIcon(result.type)}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-semibold">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-white/60 text-sm mt-0.5">{result.subtitle}</p>
                              )}
                            </div>
                          </UiverseButton>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-white/60">No results found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Trending */}
                {!query && (
                  <div className="mt-4">
                    <h3 className="text-white/60 text-sm font-semibold mb-3 px-2">Trending</h3>
                    <div className="space-y-2">
                      {['fyp', 'viral', 'trending', 'comedy', 'dance'].map((tag) => (
                        <UiverseButton
                          key={tag}
                          onClick={() => {
                            setQuery(`#${tag}`)
                            handleSearch(`#${tag}`)
                          }}
                          variant="ghost"
                          size="lg"
                          className="w-full flex items-center gap-3 p-3 justify-start h-auto"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                          </div>
                          <span className="text-white font-medium">#{tag}</span>
                          <span className="badge-uiverse ml-auto text-xs">Trending</span>
                        </UiverseButton>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

