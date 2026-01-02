/**
 * Investment and Currency Notification System
 * 
 * Handles notifications for investments, currency, and achievements.
 */

import { getCurrencyService } from '../currency/currency-service'
import { getInvestmentService } from '../investing/investment-service'
import { getProgressSystem } from '../neuroscience/progress-system'
import { getBadgeService } from '../currency/badge-service'

export interface Notification {
  id: string
  type: 'investment' | 'currency' | 'achievement' | 'milestone' | 'challenge'
  title: string
  message: string
  icon?: string
  actionUrl?: string
  timestamp: number
  read: boolean
  metadata?: Record<string, any>
}

export class InvestmentNotificationSystem {
  private currencyService = getCurrencyService()
  private investmentService = getInvestmentService()
  private progressSystem = getProgressSystem()
  private badgeService = getBadgeService()
  private notifications: Map<string, Notification[]> = new Map()

  /**
   * Create investment return notification
   */
  createInvestmentReturnNotification(
    userId: string,
    investmentId: string,
    returnAmount: number,
    roi: number
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'investment',
      title: 'Investment Return',
      message: `Your investment returned ${returnAmount.toFixed(0)} OXY (${roi > 0 ? '+' : ''}${roi.toFixed(1)}% ROI)`,
      icon: '💰',
      actionUrl: '/portfolio',
      timestamp: Date.now(),
      read: false,
      metadata: { investmentId, returnAmount, roi }
    }

    this.addNotification(userId, notification)
    return notification
  }

  /**
   * Create currency earned notification
   */
  createCurrencyEarnedNotification(
    userId: string,
    amount: number,
    source: string
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'currency',
      title: 'OXY Earned',
      message: `You earned ${amount.toFixed(0)} OXY from ${source}`,
      icon: '💎',
      actionUrl: '/wallet',
      timestamp: Date.now(),
      read: false,
      metadata: { amount, source }
    }

    this.addNotification(userId, notification)
    return notification
  }

  /**
   * Create achievement notification
   */
  createAchievementNotification(
    userId: string,
    achievementId: string,
    reward: number
  ): Notification {
    const badge = this.badgeService.getAvailableBadges().find(b => b.id === achievementId)
    
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: `${badge?.icon || '🏅'} ${badge?.name || achievementId} - ${reward} OXY reward!`,
      icon: badge?.icon || '🏅',
      actionUrl: '/achievements',
      timestamp: Date.now(),
      read: false,
      metadata: { achievementId, reward }
    }

    this.addNotification(userId, notification)
    return notification
  }

  /**
   * Create milestone notification
   */
  createMilestoneNotification(
    userId: string,
    milestoneId: string,
    milestoneName: string,
    reward: number
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'milestone',
      title: 'Milestone Reached',
      message: `${milestoneName} - ${reward} OXY reward!`,
      icon: '🎯',
      actionUrl: '/progress',
      timestamp: Date.now(),
      read: false,
      metadata: { milestoneId, milestoneName, reward }
    }

    this.addNotification(userId, notification)
    return notification
  }

  /**
   * Create challenge completion notification
   */
  createChallengeNotification(
    userId: string,
    challengeId: string,
    challengeName: string,
    reward: number
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'challenge',
      title: 'Challenge Completed',
      message: `${challengeName} - ${reward} OXY reward!`,
      icon: '🎉',
      actionUrl: '/challenges',
      timestamp: Date.now(),
      read: false,
      metadata: { challengeId, challengeName, reward }
    }

    this.addNotification(userId, notification)
    return notification
  }

  /**
   * Add notification to user's list
   */
  private addNotification(userId: string, notification: Notification): void {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, [])
    }
    const userNotifications = this.notifications.get(userId)!
    userNotifications.push(notification)

    // Keep only last 100 notifications
    if (userNotifications.length > 100) {
      userNotifications.shift()
    }
  }

  /**
   * Get user notifications
   */
  getUserNotifications(userId: string, limit: number = 20): Notification[] {
    const notifications = this.notifications.get(userId) || []
    return notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId)
    if (notifications) {
      const notification = notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(userId: string): void {
    const notifications = this.notifications.get(userId)
    if (notifications) {
      notifications.forEach(n => n.read = true)
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    const notifications = this.notifications.get(userId) || []
    return notifications.filter(n => !n.read).length
  }
}

// Singleton instance
let notificationSystemInstance: InvestmentNotificationSystem | null = null

export function getInvestmentNotificationSystem(): InvestmentNotificationSystem {
  if (!notificationSystemInstance) {
    notificationSystemInstance = new InvestmentNotificationSystem()
  }
  return notificationSystemInstance
}

