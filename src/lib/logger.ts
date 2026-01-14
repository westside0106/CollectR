/**
 * Structured logging utility for CollectR
 * Replaces console.log/error with production-ready logging
 *
 * In production, this should be connected to a service like:
 * - Sentry (error tracking)
 * - LogRocket (session replay)
 * - Datadog (monitoring)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    // In development: use console
    if (this.isDevelopment) {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`

      switch (level) {
        case 'debug':
          console.debug(prefix, message, context || '', error || '')
          break
        case 'info':
          console.info(prefix, message, context || '')
          break
        case 'warn':
          console.warn(prefix, message, context || '', error || '')
          break
        case 'error':
          console.error(prefix, message, context || '', error || '')
          if (error?.stack) {
            console.error(error.stack)
          }
          break
      }
      return
    }

    // In production: send to logging service
    // TODO: Integrate with Sentry, LogRocket, or other service
    this.sendToLoggingService(entry)
  }

  private sendToLoggingService(entry: LogEntry) {
    // TODO: Implement actual logging service integration
    // Example for Sentry:
    // if (entry.level === 'error' && entry.error) {
    //   Sentry.captureException(entry.error, {
    //     level: 'error',
    //     extra: entry.context
    //   })
    // }

    // For now, just suppress in production
    // Could also send to /api/log endpoint
  }

  /**
   * Debug-level logging (development only)
   */
  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  /**
   * Info-level logging
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  /**
   * Warning-level logging
   */
  warn(message: string, context?: Record<string, any>, error?: Error) {
    this.log('warn', message, context, error)
  }

  /**
   * Error-level logging
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error)
  }

  /**
   * API error logging with structured data
   */
  apiError(endpoint: string, error: Error, context?: Record<string, any>) {
    this.error(`API Error: ${endpoint}`, error, {
      endpoint,
      ...context
    })
  }

  /**
   * Database error logging
   */
  dbError(operation: string, error: Error, context?: Record<string, any>) {
    this.error(`Database Error: ${operation}`, error, {
      operation,
      ...context
    })
  }

  /**
   * User action logging (for analytics)
   */
  userAction(action: string, context?: Record<string, any>) {
    this.info(`User Action: ${action}`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports
export const { debug, info, warn, error, apiError, dbError, userAction } = logger
