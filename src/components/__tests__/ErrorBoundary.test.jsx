import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error
function ThrowError({ shouldThrow = false, message = 'Test error' }) {
  if (shouldThrow) {
    throw new Error(message)
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  describe('Normal Operation (No Errors)', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should render complex component tree without errors', () => {
      render(
        <ErrorBoundary>
          <div>
            <h1>Title</h1>
            <p>Content</p>
            <button>Click me</button>
          </div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    it('should catch render errors and display error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
    })

    it('should log error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundary>
      )

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })

    it('should display error details in development mode', () => {
      // Mock NODE_ENV to be development
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Development error" />
        </ErrorBoundary>
      )

      const details = screen.queryByText('Error Details (Development Only)')
      expect(details).toBeInTheDocument()

      // Restore original env
      process.env.NODE_ENV = originalEnv
    })

    it('should not display error details in production mode', () => {
      // Mock NODE_ENV to be production
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const details = screen.queryByText('Error Details (Development Only)')
      expect(details).not.toBeInTheDocument()

      // Restore original env
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error Recovery Actions', () => {
    it('should have Reload Page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByText('Reload Page')
      expect(reloadButton).toBeInTheDocument()
      expect(reloadButton).toHaveClass('error-boundary-button-primary')
    })

    it('should have Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByText('Try Again')
      expect(tryAgainButton).toBeInTheDocument()
      expect(tryAgainButton).toHaveClass('error-boundary-button-secondary')
    })

    it('should have functional Try Again button', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Try Again button should exist and be clickable
      const tryAgainButton = screen.getByText('Try Again')
      expect(tryAgainButton).toBeInTheDocument()
      
      // Button should be clickable (doesn't crash)
      await user.click(tryAgainButton)
      
      // After click, error boundary resets but component still throws
      // So error UI should still be visible
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Isolation', () => {
    it('should only catch errors in its children, not siblings', () => {
      render(
        <div>
          <div data-testid="sibling">Sibling Content</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      )

      // Sibling should still render
      expect(screen.getByTestId('sibling')).toBeInTheDocument()
      // Error should be caught
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should allow multiple error boundaries', () => {
      render(
        <div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} message="Error 1" />
          </ErrorBoundary>
          <ErrorBoundary>
            <div>No Error</div>
          </ErrorBoundary>
        </div>
      )

      // First boundary should show error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      // Second boundary should render normally
      expect(screen.getByText('No Error')).toBeInTheDocument()
    })
  })

  describe('Error Types', () => {
    it('should catch ReferenceError', () => {
      function ThrowReferenceError() {
        // eslint-disable-next-line no-undef
        return <div>{undefinedVariable}</div>
      }

      render(
        <ErrorBoundary>
          <ThrowReferenceError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should catch TypeError', () => {
      function ThrowTypeError() {
        const obj = null
        return <div>{obj.property}</div>
      }

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })
})

