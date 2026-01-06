/**
 * Authentication utilities
 * Handles user authentication state
 */

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  bio?: string
  followers: number
  following: number
  likes: number
  verified: boolean
  isOver18?: boolean
}

let currentUser: User | null = null

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  // Check localStorage
  const stored = localStorage.getItem('oxygen_user')
  if (stored) {
    try {
      currentUser = JSON.parse(stored)
      return currentUser
    } catch {
      return null
    }
  }
  
  return null
}

export function setCurrentUser(user: User | null): void {
  currentUser = user
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('oxygen_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('oxygen_user')
    }
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function logout(): void {
  setCurrentUser(null)
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}



