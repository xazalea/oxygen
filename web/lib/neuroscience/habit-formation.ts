/**
 * Habit Formation System
 * 
 * Implements habit formation loops:
 * - Daily streaks and challenges
 * - Reminder systems
 * - Reward mechanisms
 * - Progress tracking
 * - Milestone celebrations
 */

export interface Habit {
  id: string
  name: string
  cue: string
  routine: string
  reward: string
  streak: number
  lastCompleted: number
  strength: number
}

export interface Challenge {
  id: string
  name: string
  description: string
  target: number
  current: number
  deadline: number
  reward: string
}

export interface Milestone {
  id: string
  name: string
  description: string
  achieved: boolean
  achievedAt: number | null
  progress: number
}

class HabitFormation {
  private habits: Map<string, Habit> = new Map()
  private challenges: Map<string, Challenge> = new Map()
  private milestones: Map<string, Milestone> = new Map()

  /**
   * Create a new habit
   */
  createHabit(habit: Omit<Habit, 'streak' | 'lastCompleted' | 'strength'>): Habit {
    const fullHabit: Habit = {
      ...habit,
      streak: 0,
      lastCompleted: 0,
      strength: 0.1
    }
    this.habits.set(habit.id, fullHabit)
    return fullHabit
  }

  /**
   * Complete a habit
   */
  completeHabit(habitId: string): {
    habit: Habit
    streakIncreased: boolean
    reward: string
  } {
    const habit = this.habits.get(habitId)
    if (!habit) {
      throw new Error(`Habit ${habitId} not found`)
    }

    const now = Date.now()
    const lastCompleted = new Date(habit.lastCompleted)
    const today = new Date(now)
    
    // Check if completed today
    const isToday = lastCompleted.toDateString() === today.toDateString()
    
    // Check if streak should continue
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const wasYesterday = lastCompleted.toDateString() === yesterday.toDateString()
    
    let streakIncreased = false
    if (!isToday) {
      if (wasYesterday) {
        // Continue streak
        habit.streak++
        streakIncreased = true
      } else {
        // Reset streak
        habit.streak = 1
        streakIncreased = true
      }
      habit.lastCompleted = now
    }

    // Increase habit strength
    habit.strength = Math.min(1.0, habit.strength + 0.05)

    return {
      habit,
      streakIncreased,
      reward: habit.reward
    }
  }

  /**
   * Create a challenge
   */
  createChallenge(challenge: Omit<Challenge, 'current'>): Challenge {
    const fullChallenge: Challenge = {
      ...challenge,
      current: 0
    }
    this.challenges.set(challenge.id, fullChallenge)
    return fullChallenge
  }

  /**
   * Update challenge progress
   */
  updateChallenge(challengeId: string, progress: number): {
    challenge: Challenge
    completed: boolean
  } {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) {
      throw new Error(`Challenge ${challengeId} not found`)
    }

    challenge.current = Math.min(challenge.target, challenge.current + progress)
    const completed = challenge.current >= challenge.target

    return {
      challenge,
      completed
    }
  }

  /**
   * Create a milestone
   */
  createMilestone(milestone: Omit<Milestone, 'achieved' | 'achievedAt' | 'progress'>): Milestone {
    const fullMilestone: Milestone = {
      ...milestone,
      achieved: false,
      achievedAt: null,
      progress: 0
    }
    this.milestones.set(milestone.id, fullMilestone)
    return fullMilestone
  }

  /**
   * Update milestone progress
   */
  updateMilestone(milestoneId: string, progress: number): {
    milestone: Milestone
    achieved: boolean
  } {
    const milestone = this.milestones.get(milestoneId)
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`)
    }

    milestone.progress = Math.min(1.0, progress)
    const achieved = milestone.progress >= 1.0 && !milestone.achieved

    if (achieved) {
      milestone.achieved = true
      milestone.achievedAt = Date.now()
    }

    return {
      milestone,
      achieved
    }
  }

  /**
   * Get daily reminder
   */
  getDailyReminder(): {
    habits: Habit[]
    challenges: Challenge[]
    message: string
  } {
    const now = Date.now()
    const today = new Date(now).toDateString()

    // Get habits that need completion today
    const habitsToComplete = Array.from(this.habits.values()).filter(habit => {
      const lastCompleted = new Date(habit.lastCompleted).toDateString()
      return lastCompleted !== today
    })

    // Get active challenges
    const activeChallenges = Array.from(this.challenges.values()).filter(
      challenge => challenge.deadline > now && challenge.current < challenge.target
    )

    let message = ''
    if (habitsToComplete.length > 0) {
      message = `Complete ${habitsToComplete.length} habit(s) today to maintain your streak!`
    } else if (activeChallenges.length > 0) {
      message = `You have ${activeChallenges.length} active challenge(s)!`
    } else {
      message = 'Great job! Keep up the good work!'
    }

    return {
      habits: habitsToComplete,
      challenges: activeChallenges,
      message
    }
  }

  /**
   * Get streak statistics
   */
  getStreakStats(): {
    totalStreak: number
    longestStreak: number
    activeHabits: number
  } {
    const habits = Array.from(this.habits.values())
    const streaks = habits.map(h => h.streak)
    const totalStreak = streaks.reduce((sum, s) => sum + s, 0)
    const longestStreak = Math.max(...streaks, 0)
    const activeHabits = habits.filter(h => h.streak > 0).length

    return {
      totalStreak,
      longestStreak,
      activeHabits
    }
  }
}

// Singleton instance
let habitInstance: HabitFormation | null = null

export function getHabitFormation(): HabitFormation {
  if (!habitInstance) {
    habitInstance = new HabitFormation()
  }
  return habitInstance
}

export default HabitFormation


