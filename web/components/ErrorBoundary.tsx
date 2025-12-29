'use client'

import { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { UiverseButton } from './UI/UiverseButton'
import { LiquidGlass } from './UI/LiquidGlass'
import { UiverseCard } from './UI/UiverseCard'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-screen w-screen flex items-center justify-center bg-black">
          <LiquidGlass preset="frost" className="rounded-2xl">
            <UiverseCard className="p-8 text-center max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-bold gradient-text-uiverse mb-4">Something went wrong</h1>
                <p className="text-white/70 mb-6">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <UiverseButton
                  variant="primary"
                  size="md"
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined })
                    window.location.reload()
                  }}
                >
                  Reload Page
                </UiverseButton>
              </motion.div>
            </UiverseCard>
          </LiquidGlass>
        </div>
      )
    }

    return this.props.children
  }
}

