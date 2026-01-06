// Test setup file for Vitest
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Suppress React error boundary warnings in tests
// These are expected when testing error boundaries
const originalError = console.error

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Restore console.error after each test
  console.error = originalError
})

// Suppress expected error boundary warnings
beforeEach(() => {
  console.error = (...args) => {
    // Suppress React error boundary warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ErrorBoundary') || 
       args[0].includes('componentDidCatch') ||
       args[0].includes('getDerivedStateFromError'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

// Set up localStorage mock before each test
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
  localStorageMock.clear()
})

