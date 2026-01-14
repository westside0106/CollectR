'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Oops! Etwas ist schiefgelaufen
                </h1>
                <p className="text-gray-600 dark:text-slate-400 mt-1">
                  Ein unerwarteter Fehler ist aufgetreten
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-300 mb-2">
                  🔍 Fehlerdetails (Development Mode)
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="text-sm">
                    <strong className="text-red-700 dark:text-red-400">Error:</strong>
                    <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-auto text-xs">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-sm">
                      <strong className="text-red-700 dark:text-red-400">Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-auto text-xs max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <p className="text-gray-700 dark:text-slate-300 text-sm">
                <strong>Was kannst du tun?</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400 text-sm">
                <li>Versuche die Seite neu zu laden</li>
                <li>Gehe zurück zur Startseite</li>
                <li>Lösche deinen Browser-Cache</li>
                <li>Kontaktiere den Support, wenn das Problem weiterhin besteht</li>
              </ul>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Erneut versuchen
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                🏠 Zur Startseite
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-500 mt-6 text-center">
              Fehler-ID: {Date.now()} • CollectR v1.0
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
