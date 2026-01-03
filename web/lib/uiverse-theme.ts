/**
 * Uiverse Theme System
 * 
 * Centralized uiverse.io theme configuration.
 * Provides consistent color schemes, animations, and interactions.
 */

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  success: string
  warning: string
  info: string
}

export interface ThemeAnimations {
  duration: {
    fast: number
    normal: number
    slow: number
  }
  easing: {
    default: string
    bounce: string
    elastic: string
  }
}

export interface Theme {
  name: string
  colors: ThemeColors
  animations: ThemeAnimations
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

const themes: Record<string, Theme> = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      border: '#333333',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6'
    },
    animations: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500
      },
      easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
      }
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e5e5e5',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6'
    },
    animations: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500
      },
      easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
      }
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    }
  },
  neon: {
    name: 'Neon',
    colors: {
      primary: '#00f0ff',
      secondary: '#ff00f0',
      accent: '#f0ff00',
      background: '#000000',
      surface: '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#333333',
      error: '#ff0044',
      success: '#00ff44',
      warning: '#ffaa00',
      info: '#0088ff'
    },
    animations: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500
      },
      easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
      }
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 240, 255, 0.3)',
      md: '0 4px 6px -1px rgba(0, 240, 255, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 240, 255, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 240, 255, 0.3)'
    }
  }
}

class UiverseTheme {
  private currentTheme: string = 'dark'
  private customThemes: Map<string, Theme> = new Map()

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.customThemes.get(this.currentTheme) || themes[this.currentTheme] || themes.dark
  }

  /**
   * Set theme
   */
  setTheme(themeName: string): void {
    if (themes[themeName] || this.customThemes.has(themeName)) {
      this.currentTheme = themeName
      this.applyTheme()
    }
  }

  /**
   * Create custom theme
   */
  createCustomTheme(name: string, theme: Partial<Theme>): void {
    const baseTheme = this.getTheme()
    const customTheme: Theme = {
      ...baseTheme,
      ...theme,
      name,
      colors: { ...baseTheme.colors, ...theme.colors },
      animations: { ...baseTheme.animations, ...theme.animations }
    }
    this.customThemes.set(name, customTheme)
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    const theme = this.getTheme()
    const root = document.documentElement

    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // Apply theme class
    root.setAttribute('data-theme', this.currentTheme)
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return [...Object.keys(themes), ...Array.from(this.customThemes.keys())]
  }

  /**
   * Get theme colors as CSS variables string
   */
  getThemeCSS(): string {
    const theme = this.getTheme()
    const vars = Object.entries(theme.colors)
      .map(([key, value]) => `--color-${key}: ${value};`)
      .join('\n')
    return `:root { ${vars} }`
  }
}

// Singleton instance
let themeInstance: UiverseTheme | null = null

export function getUiverseTheme(): UiverseTheme {
  if (!themeInstance) {
    themeInstance = new UiverseTheme()
    themeInstance.applyTheme()
  }
  return themeInstance
}

export { themes }
export default UiverseTheme


