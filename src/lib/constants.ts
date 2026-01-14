/**
 * Application-wide constants
 * Centralized location for all magic numbers and configuration values
 */

// File Upload Limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGES_PER_UPLOAD = 10

// Currency Conversion
export const USD_TO_EUR = 0.92
export const DEFAULT_CURRENCY = 'EUR'

// Cache Durations (in milliseconds)
export const CACHE_DURATION_15_MINUTES = 15 * 60 * 1000
export const CACHE_DURATION_1_HOUR = 60 * 60 * 1000
export const CACHE_DURATION_24_HOURS = 24 * 60 * 60 * 1000
export const CACHE_DURATION_1_WEEK = 7 * 24 * 60 * 60 * 1000

// API Timeouts (in milliseconds)
export const API_TIMEOUT_DEFAULT = 30000 // 30 seconds
export const API_TIMEOUT_LONG = 60000 // 1 minute
export const API_TIMEOUT_SHORT = 10000 // 10 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const ITEMS_PER_PAGE = 20

// Search
export const MIN_SEARCH_LENGTH = 2
export const SEARCH_DEBOUNCE_MS = 500
export const MAX_SEARCH_RESULTS = 100

// TCG Specific
export const TCG_MAX_COPIES_DEFAULT = 4
export const TCG_MAX_COPIES_YUGIOH = 3
export const TCG_DECK_MIN_SIZE = 40
export const TCG_DECK_MAX_SIZE = 60
export const TCG_SIDE_DECK_MAX = 15
export const TCG_EXTRA_DECK_MAX = 15

// Grading Multipliers
export const GRADING_MULTIPLIERS = {
  PSA: {
    10: 15,
    9: 5,
    8: 2.5,
    7: 1.5,
  },
  BGS: {
    9.5: 12,
    9: 4,
    8.5: 2,
  },
  CGC: {
    9.5: 10,
    9: 4,
    8.5: 2,
  },
  SGC: {
    9.5: 10,
    9: 4,
    8.5: 2,
  },
} as const

// Dashboard
export const DASHBOARD_TILE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  FULL: 'full',
} as const

// Storage Keys
export const STORAGE_KEYS = {
  DASHBOARD_CONFIG: 'collectr_dashboard_config',
  THEME: 'collectr_theme',
  VIEW_MODE: 'collectionViewMode',
  NEWS_CATEGORIES: 'news-categories',
  LANGUAGE: 'language',
  LAST_SYNC: 'last_sync',
} as const

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION_FAST = 150
export const ANIMATION_DURATION_NORMAL = 300
export const ANIMATION_DURATION_SLOW = 500

// Validation Limits
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128
export const MIN_USERNAME_LENGTH = 3
export const MAX_USERNAME_LENGTH = 30
export const MAX_DESCRIPTION_LENGTH = 1000
export const MAX_TITLE_LENGTH = 255

// Notification Settings
export const NOTIFICATION_DURATION = 5000 // 5 seconds
export const TOAST_DURATION = 3000 // 3 seconds

// Retry Configuration
export const MAX_RETRY_ATTEMPTS = 3
export const RETRY_DELAY_BASE = 1000 // 1 second
export const RETRY_DELAY_MULTIPLIER = 2 // Exponential backoff

// Rate Limiting
export const RATE_LIMIT_REQUESTS = 100
export const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Image Dimensions
export const THUMBNAIL_SIZE = 200
export const PREVIEW_SIZE = 600
export const MAX_IMAGE_DIMENSION = 4096

// Price Update Settings
export const PRICE_UPDATE_BATCH_SIZE = 50
export const PRICE_UPDATE_DELAY_MS = 1000 // Delay between batches

// Export/Import
export const EXPORT_CHUNK_SIZE = 1000
export const MAX_IMPORT_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Feature Flags (can be moved to env variables later)
export const FEATURES = {
  TCG_ENABLED: true,
  AI_FEATURES_ENABLED: true,
  ADVANCED_CHARTS_ENABLED: true,
  SOCIAL_SHARING_ENABLED: false,
  MARKETPLACE_ENABLED: false,
} as const
