/**
 * Input validation utilities
 * Prevents injection attacks and ensures data integrity
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validates and sanitizes string input
 */
export function validateString(input: unknown, options?: {
  minLength?: number
  maxLength?: number
  required?: boolean
  pattern?: RegExp
}): string {
  const { minLength = 0, maxLength = 1000, required = true, pattern } = options || {}

  if (input === null || input === undefined || input === '') {
    if (required) {
      throw new ValidationError('Required field is missing')
    }
    return ''
  }

  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string')
  }

  const trimmed = input.trim()

  if (trimmed.length < minLength) {
    throw new ValidationError(`Input must be at least ${minLength} characters`)
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(`Input must not exceed ${maxLength} characters`)
  }

  if (pattern && !pattern.test(trimmed)) {
    throw new ValidationError('Input format is invalid')
  }

  return trimmed
}

/**
 * Validates and sanitizes number input
 */
export function validateNumber(input: unknown, options?: {
  min?: number
  max?: number
  required?: boolean
  integer?: boolean
}): number {
  const { min = -Infinity, max = Infinity, required = true, integer = false } = options || {}

  if (input === null || input === undefined || input === '') {
    if (required) {
      throw new ValidationError('Required field is missing')
    }
    return 0
  }

  const num = typeof input === 'string' ? parseFloat(input) : Number(input)

  if (isNaN(num)) {
    throw new ValidationError('Input must be a valid number')
  }

  if (integer && !Number.isInteger(num)) {
    throw new ValidationError('Input must be an integer')
  }

  if (num < min) {
    throw new ValidationError(`Number must be at least ${min}`)
  }

  if (num > max) {
    throw new ValidationError(`Number must not exceed ${max}`)
  }

  return num
}

/**
 * Validates enum value
 */
export function validateEnum<T extends string>(
  input: unknown,
  allowedValues: readonly T[],
  required: boolean = true
): T | null {
  if (input === null || input === undefined || input === '') {
    if (required) {
      throw new ValidationError('Required field is missing')
    }
    return null
  }

  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string')
  }

  if (!allowedValues.includes(input as T)) {
    throw new ValidationError(`Input must be one of: ${allowedValues.join(', ')}`)
  }

  return input as T
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validates email format
 */
export function validateEmail(email: unknown): string {
  const emailString = validateString(email, {
    minLength: 3,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  })

  return emailString.toLowerCase()
}

/**
 * Validates URL format
 */
export function validateURL(url: unknown): string {
  const urlString = validateString(url, {
    minLength: 3,
    maxLength: 2048
  })

  try {
    new URL(urlString)
    return urlString
  } catch {
    throw new ValidationError('Invalid URL format')
  }
}

/**
 * Safely parse JSON with validation
 */
export function safeJSONParse<T = any>(input: string, defaultValue?: T): T {
  try {
    return JSON.parse(input) as T
  } catch {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new ValidationError('Invalid JSON format')
  }
}
