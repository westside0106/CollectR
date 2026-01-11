// ============================================
// COLLECTR: TypeScript Types
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AttributeType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'tags'
  | 'checkbox'
  | 'date'
  | 'link'
  | 'currency'

export type ItemStatus =
  | 'in_collection'
  | 'sold'
  | 'wishlist'
  | 'ordered'
  | 'lost'

export type SharePermission = 'read' | 'write' | 'admin'

export type ValueSource =
  | 'manual'
  | 'ebay_avg'
  | 'ebay_sold'
  | 'market_api'
  | 'appraisal'

export interface Collection {
  id: string
  owner_id: string
  name: string
  description: string | null
  cover_image: string | null
  is_public: boolean
  settings: Json
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  collection_id: string
  parent_id: string | null
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
}

export interface AttributeDefinition {
  id: string
  category_id: string
  name: string
  display_name: string
  description: string | null
  type: AttributeType
  options: AttributeOptions
  required: boolean
  show_in_list: boolean
  show_in_filter: boolean
  sort_order: number
  inherited_from: string | null
  created_at: string
}

export interface AttributeOptions {
  choices?: string[]
  min?: number
  max?: number
  step?: number
  default_currency?: string
  max_length?: number
  multiline?: boolean
}

export interface Item {
  id: string
  collection_id: string
  category_id: string | null
  name: string
  description: string | null
  images: string[]
  thumbnail: string | null
  purchase_date: string | null
  purchase_price: number | null
  purchase_currency: string
  purchase_location: string | null
  status: ItemStatus
  sold_date: string | null
  sold_price: number | null
  sold_currency: string
  notes: string | null
  attributes: Record<string, Json>
  _tags: string[]
  _computed_value: number | null
  _value_currency: string
  barcode: string | null
  external_ids: Json
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ItemImage {
  id: string
  item_id: string
  original_url: string
  thumbnail_url: string | null
  medium_url: string | null
  filename: string | null
  size_bytes: number | null
  width: number | null
  height: number | null
  mime_type: string | null
  ai_tags: string[]
  ai_description: string | null
  sort_order: number
  is_primary: boolean
  uploaded_at: string
  uploaded_by: string | null
}

export type CollectionInsert = Omit<Collection, 'id' | 'created_at' | 'updated_at'>
export type CollectionUpdate = Partial<CollectionInsert>

export type ItemInsert = Omit<Item, 'id' | 'created_at' | 'updated_at'>
export type ItemUpdate = Partial<ItemInsert>

export type ReminderType = 'once' | 'recurring_weekly' | 'recurring_monthly' | 'recurring_yearly'

export interface Reminder {
  id: string
  item_id: string | null
  user_id: string
  title: string
  reminder_date: string
  reminder_type: ReminderType
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
  // Joined data
  item?: Item
}

export type ReminderInsert = Omit<Reminder, 'id' | 'created_at' | 'item'>
export type ReminderUpdate = Partial<Omit<ReminderInsert, 'user_id'>>
