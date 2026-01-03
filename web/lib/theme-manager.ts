/**
 * Theme Manager
 * 
 * Manages theme customization for the application.
 */

export type Theme = 'dark' | 'light' | 'auto' | 'custom'

export interface CustomTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    accent: string
  }
  font: {
    size: 'small' | 'medium' | 'large'
    family: string
  }
  density: 'compact' | 'comfortable' | 'spacious'
}

export class ThemeManager {
  private currentTheme: Theme = 'dark'
  private customTheme: CustomTheme | null = null
  private storageKey = 'oxygen_theme'

  constructor() {
    this.loadTheme()
    this.applyTheme()
  }

  /**
   * Load theme from localStorage
   */
  private loadTheme(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.currentTheme = data.theme || 'dark'
        this.customTheme = data.customTheme || null
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    }
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        theme: this.currentTheme,
        customTheme: this.customTheme
      }))
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('dark', 'light')

    if (this.currentTheme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
    } else if (this.currentTheme === 'custom' && this.customTheme) {
      // Apply custom theme
      root.classList.add('dark') // Default to dark for custom
      this.applyCustomTheme(this.customTheme)
    } else {
      root.classList.add(this.currentTheme)
    }

    // Apply font size
    if (this.customTheme?.font.size) {
      root.style.setProperty('--font-size', this.getFontSize(this.customTheme.font.size))
    }

    // Apply density
    if (this.customTheme?.density) {
      root.setAttribute('data-density', this.customTheme.density)
    }
  }

  /**
   * Apply custom theme colors
   */
  private applyCustomTheme(theme: CustomTheme): void {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-foreground', theme.colors.foreground)
    root.style.setProperty('--color-accent', theme.colors.accent)
    
    if (theme.font.family) {
      root.style.setProperty('--font-family', theme.font.family)
    }
  }

  /**
   * Get font size value
   */
  private getFontSize(size: 'small' | 'medium' | 'large'): string {
    const sizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem'
    }
    return sizes[size]
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme
    this.applyTheme()
    this.saveTheme()
  }

  /**
   * Set custom theme
   */
  setCustomTheme(theme: CustomTheme): void {
    this.customTheme = theme
    this.currentTheme = 'custom'
    this.applyTheme()
    this.saveTheme()
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme
  }

  /**
   * Get custom theme
   */
  getCustomTheme(): CustomTheme | null {
    return this.customTheme
  }

  /**
   * Reset to default theme
   */
  resetTheme(): void {
    this.currentTheme = 'dark'
    this.customTheme = null
    this.applyTheme()
    this.saveTheme()
  }
}

// Singleton instance
let themeInstance: ThemeManager | null = null

export function getThemeManager(): ThemeManager {
  if (!themeInstance) {
    themeInstance = new ThemeManager()
  }
  return themeInstance
}


