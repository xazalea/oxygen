/**
 * Additional Uiverse Components
 * 
 * Additional uiverse.io-inspired components:
 * - UiverseModal
 * - UiverseDropdown
 * - UiverseTabs
 * - UiverseSlider
 * - UiverseCheckbox
 * - UiverseRadio
 * - UiverseProgress
 * - UiverseTooltip
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'
import { UiverseIconButton } from './UiverseIconButton'

// UiverseModal
export interface UiverseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function UiverseModal({ isOpen, onClose, title, children, size = 'md' }: UiverseModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
          >
            <div
              className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                  <UiverseIconButton onClick={onClose} icon={X} />
                </div>
              )}
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// UiverseDropdown
export interface UiverseDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export function UiverseDropdown({ trigger, children, align = 'left' }: UiverseDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[200px]`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// UiverseTabs
export interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

export interface UiverseTabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export function UiverseTabs({ tabs, defaultTab, onChange }: UiverseTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
              />
            )}
          </motion.button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}

// UiverseSlider
export interface UiverseSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export function UiverseSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label
}: UiverseSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}: {value}
        </label>
      )}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <motion.input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          whileHover={{ scale: 1.05 }}
          className="absolute w-full h-2 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

// UiverseCheckbox
export interface UiverseCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function UiverseCheckbox({ checked, onChange, label }: UiverseCheckboxProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <motion.input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="sr-only"
        />
        <motion.div
          className={`w-5 h-5 rounded border-2 transition-colors ${
            checked
              ? 'bg-blue-600 border-blue-600'
              : 'bg-transparent border-gray-300 dark:border-gray-600'
          }`}
          animate={{ scale: checked ? [1, 1.1, 1] : 1 }}
        >
          {checked && (
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              className="w-full h-full text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.div>
      </div>
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </label>
  )
}

// UiverseRadio
export interface UiverseRadioProps {
  value: string
  selected: string
  onChange: (value: string) => void
  label?: string
}

export function UiverseRadio({ value, selected, onChange, label }: UiverseRadioProps) {
  const isSelected = value === selected

  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <motion.input
          type="radio"
          value={value}
          checked={isSelected}
          onChange={() => onChange(value)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="sr-only"
        />
        <motion.div
          className={`w-5 h-5 rounded-full border-2 transition-colors ${
            isSelected
              ? 'border-blue-600'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          animate={{ scale: isSelected ? [1, 1.1, 1] : 1 }}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 m-auto w-2.5 h-2.5 bg-blue-600 rounded-full"
            />
          )}
        </motion.div>
      </div>
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </label>
  )
}

// UiverseProgress
export interface UiverseProgressProps {
  value: number
  max?: number
  showLabel?: boolean
  color?: string
}

export function UiverseProgress({
  value,
  max = 100,
  showLabel = true,
  color = 'blue'
}: UiverseProgressProps) {
  const percentage = (value / max) * 100
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600'
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// UiverseTooltip
export interface UiverseTooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function UiverseTooltip({ content, children, position = 'top' }: UiverseTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// UiverseToggle
export interface UiverseToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function UiverseToggle({ checked, onChange, label, disabled = false }: UiverseToggleProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <motion.input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          whileHover={disabled ? {} : { scale: 1.1 }}
          whileTap={disabled ? {} : { scale: 0.9 }}
          className="sr-only"
        />
        <motion.div
          className={`relative w-12 h-6 rounded-full transition-colors ${
            checked
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
              : 'bg-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          animate={{ scale: disabled ? 1 : [1, 1.05, 1] }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg"
            animate={{ x: checked ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.div>
      </div>
      {label && (
        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </label>
  )
}

// UiverseSelect
export interface UiverseSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
}

export function UiverseSelect({
  value,
  onChange,
  options,
  placeholder,
  className = ''
}: UiverseSelectProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div 
      className={`relative ${className}`}
      whileHover={{ scale: 1.01 }}
      whileFocus={{ scale: 1.02 }}
    >
      <motion.select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        animate={{
          borderColor: isFocused ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.2)',
          boxShadow: isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
        }}
        className="w-full bg-white/10 dark:bg-gray-800/50 border-2 border-white/20 dark:border-gray-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer transition-all hover:bg-white/20 dark:hover:bg-gray-700/50 focus:outline-none input-uiverse"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-900 text-white">
            {option.label}
          </option>
        ))}
      </motion.select>
      <motion.div 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
        animate={{ rotate: isFocused ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-5 h-5 text-white/60" />
      </motion.div>
    </motion.div>
  )
}

