'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tiktokUsername, setTiktokUsername] = useState('')
  const [youtubeChannelId, setYoutubeChannelId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          linkedAccounts: {
            tiktok: tiktokUsername || undefined,
            youtube: youtubeChannelId || undefined
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Signup failed')
      }

      const data = await response.json()
      
      // Store token (in a real app, maybe use a context or secure cookie handling)
      // For now, assume the cookie is set by the server or we just redirect
      
      router.push('/')
    } catch (error) {
      console.error('Signup error:', error)
      // Show error handling UI here if needed
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold gradient-text-uiverse mb-3">Oxygen</h1>
          <p className="text-white/70 text-lg">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm mb-3 font-medium">Username</label>
            <UiverseInput
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              icon={<User className="w-5 h-5" />}
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-3 font-medium">Email</label>
            <UiverseInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              icon={<Mail className="w-5 h-5" />}
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-3 font-medium">Password</label>
            <div className="relative">
              <UiverseInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <UiverseIconButton
                icon={showPassword ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
                onClick={() => setShowPassword(!showPassword)}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-white/90 text-sm font-semibold mb-4">Link Accounts (Optional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-3 font-medium">TikTok Username</label>
                <UiverseInput
                  type="text"
                  name="tiktokUsername"
                  value={tiktokUsername}
                  onChange={(e) => setTiktokUsername(e.target.value)}
                  placeholder="@username"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-3 font-medium">YouTube Channel ID</label>
                <UiverseInput
                  type="text"
                  name="youtubeChannelId"
                  value={youtubeChannelId}
                  onChange={(e) => setYoutubeChannelId(e.target.value)}
                  placeholder="Channel ID"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>

          <UiverseButton
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner-uiverse w-5 h-5"></div>
                Creating account...
              </span>
            ) : (
              'Sign up'
            )}
          </UiverseButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  )
}

