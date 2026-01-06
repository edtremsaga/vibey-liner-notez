import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error for testing
function ThrowingComponent() {
  throw new Error('Component error')
}

describe('ErrorBoundary Integration Tests', () => {
  describe('Error Boundary Wraps Components Correctly', () => {
    it('should catch errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('should show recovery buttons when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      // Error should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      // Recovery buttons should be present
      expect(screen.getByText('Reload Page')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
})

