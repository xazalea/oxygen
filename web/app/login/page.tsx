'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // In production, call authentication API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to home
    router.push('/')
    setIsLoading(false)
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
          <p className="text-white/70 text-lg">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm mb-3 font-medium">Email or username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 z-10" />
              <UiverseInput
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or username"
                icon={<Mail className="w-5 h-5" />}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-3 font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 z-10" />
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

          <UiverseButton
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner-uiverse w-5 h-5"></div>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </UiverseButton>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/70 text-sm mb-4">
            Don't have an account?{' '}
            <UiverseButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/signup')}
              className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-300 hover:to-purple-300 font-semibold inline p-0 h-auto"
            >
              Sign up
            </UiverseButton>
          </p>
          <UiverseButton
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="text-white/60 text-sm hover:text-white/90 underline decoration-white/30 hover:decoration-white/60 p-0 h-auto"
          >
            Forgot password?
          </UiverseButton>
        </div>
      </motion.div>
    </div>
  )
}

