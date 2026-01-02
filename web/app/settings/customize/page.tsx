/**
 * Customization Dashboard
 * 
 * Comprehensive customization interface for:
 * - Color picker for every UI element
 * - Animation speed controls
 * - Layout density adjustments
 * - Font customization
 * - Spacing and padding controls
 * - Component size adjustments
 * - Interaction style preferences
 */

'use client'

import { useState, useEffect } from 'react'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseTabs, UiverseSlider, UiverseCheckbox, UiverseRadio } from '@/components/UI/UiverseComponents'
import { getUiverseTheme } from '@/lib/uiverse-theme'
import { getComprehensiveAdapter } from '@/lib/neuroscience/comprehensive-adapter'
import { getAutoPersonalization } from '@/lib/auto-personalization'

export default function CustomizePage() {
  const [theme, setTheme] = useState(getUiverseTheme())
  const [adapter] = useState(getComprehensiveAdapter())
  const [personalization] = useState(getAutoPersonalization())
  const [currentTheme, setCurrentTheme] = useState(theme.getTheme())
  const [adaptation, setAdaptation] = useState(adapter.getCurrentAdaptation())

  useEffect(() => {
    // Update adaptation periodically
    const interval = setInterval(() => {
      setAdaptation(adapter.getCurrentAdaptation())
    }, 1000)

    return () => clearInterval(interval)
  }, [adapter])

  const handleThemeChange = (themeName: string) => {
    theme.setTheme(themeName)
    setCurrentTheme(theme.getTheme())
  }

  const handleColorChange = (colorKey: string, value: string) => {
    theme.createCustomTheme('custom', {
      colors: {
        ...currentTheme.colors,
        [colorKey]: value
      }
    })
    setCurrentTheme(theme.getTheme())
  }

  const tabs = [
    {
      id: 'colors',
      label: 'Colors',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentTheme.colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <UiverseInput
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'layout',
      label: 'Layout',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Density
            </label>
            <div className="flex gap-4">
              {(['compact', 'normal', 'spacious'] as const).map((density) => (
                <UiverseRadio
                  key={density}
                  value={density}
                  selected={adaptation.ui.layout.density}
                  onChange={(value) => {
                    // Update via personalization database
                    personalization.updatePreferences('ui', { layout: { density: value } })
                    setAdaptation(adapter.getCurrentAdaptation())
                  }}
                  label={density.charAt(0).toUpperCase() + density.slice(1)}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Component Sizes
            </label>
            <div className="space-y-4">
              <UiverseSlider
                label="Button Size"
                value={adaptation.ui.componentSizes.buttons === 'small' ? 0 : adaptation.ui.componentSizes.buttons === 'medium' ? 50 : 100}
                onChange={(value) => {
                  const size = value < 33 ? 'small' : value < 66 ? 'medium' : 'large'
                  personalization.updatePreferences('ui', { componentSizes: { buttons: size } })
                  setAdaptation(adapter.getCurrentAdaptation())
                }}
                min={0}
                max={100}
              />
              <UiverseSlider
                label="Text Size"
                value={adaptation.ui.componentSizes.text === 'small' ? 0 : adaptation.ui.componentSizes.text === 'medium' ? 50 : 100}
                onChange={(value) => {
                  const size = value < 33 ? 'small' : value < 66 ? 'medium' : 'large'
                  personalization.updatePreferences('ui', { componentSizes: { text: size } })
                  setAdaptation(adapter.getCurrentAdaptation())
                }}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'animations',
      label: 'Animations',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Animation Speed
            </label>
            <div className="flex gap-4">
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <UiverseRadio
                  key={speed}
                  value={speed}
                  selected={adaptation.ui.animations.speed}
                  onChange={(value) => {
                    personalization.updatePreferences('ui', { animations: { speed: value } })
                    setAdaptation(adapter.getCurrentAdaptation())
                  }}
                  label={speed.charAt(0).toUpperCase() + speed.slice(1)}
                />
              ))}
            </div>
          </div>
          <UiverseCheckbox
            checked={adaptation.ui.animations.enabled}
            onChange={(checked) => {
              personalization.updatePreferences('ui', { animations: { enabled: checked } })
              setAdaptation(adapter.getCurrentAdaptation())
            }}
            label="Enable Animations"
          />
          <UiverseSlider
            label="Animation Intensity"
            value={adaptation.ui.animations.intensity * 100}
            onChange={(value) => {
              personalization.updatePreferences('ui', { animations: { intensity: value / 100 } })
              setAdaptation(adapter.getCurrentAdaptation())
            }}
            min={0}
            max={100}
          />
        </div>
      )
    },
    {
      id: 'auto',
      label: 'Auto-Personalization',
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Automatic Personalization
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The platform automatically adapts to your behavior and preferences.
              Changes are applied gradually based on your interactions.
            </p>
          </div>
          <UiverseButton
            onClick={async () => {
              const suggestions = await personalization.suggestOptimizations()
              alert(suggestions.length > 0 ? suggestions.join('\n') : 'No suggestions at this time')
            }}
          >
            Get Optimization Suggestions
          </UiverseButton>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Customize Your Experience
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <div className="flex gap-4">
            {theme.getAvailableThemes().map((themeName) => (
              <UiverseButton
                key={themeName}
                onClick={() => handleThemeChange(themeName)}
                variant={currentTheme.name === themeName ? 'primary' : 'ghost'}
              >
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </UiverseButton>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <UiverseTabs tabs={tabs} />
        </div>
      </div>
    </div>
  )
}

