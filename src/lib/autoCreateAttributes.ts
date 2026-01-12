import { SupabaseClient } from '@supabase/supabase-js'
import { AttributeType } from '@/types/database'

/**
 * Infers the attribute type from a value
 */
function inferAttributeType(value: unknown): AttributeType {
  if (typeof value === 'boolean') return 'checkbox'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'tags'
  if (typeof value === 'string') {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date'
    // Check if it looks like a URL
    if (/^https?:\/\//.test(value)) return 'link'
  }
  return 'text'
}

/**
 * Converts a key to a display name
 * e.g. "material_type" → "Material Type"
 */
function toDisplayName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Converts a display name to a snake_case key
 * e.g. "Material Type" → "material_type"
 */
function toAttributeName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

interface AutoCreateResult {
  created: string[]
  existing: string[]
  errors: string[]
}

/**
 * Auto-creates attribute definitions for a category based on provided attributes
 *
 * @param supabase - Supabase client
 * @param categoryId - The category ID to create attributes for
 * @param attributes - Object with attribute key-value pairs from AI or import
 * @returns Object with created, existing, and error lists
 */
export async function autoCreateAttributeDefinitions(
  supabase: SupabaseClient,
  categoryId: string,
  attributes: Record<string, unknown>
): Promise<AutoCreateResult> {
  const result: AutoCreateResult = {
    created: [],
    existing: [],
    errors: []
  }

  if (!categoryId || !attributes || Object.keys(attributes).length === 0) {
    return result
  }

  // Get existing attribute definitions for this category
  const { data: existingAttrs, error: fetchError } = await supabase
    .from('attribute_definitions')
    .select('name, display_name')
    .eq('category_id', categoryId)

  if (fetchError) {
    console.error('Error fetching existing attributes:', fetchError)
    result.errors.push('Konnte bestehende Attribute nicht laden')
    return result
  }

  const existingNames = new Set(existingAttrs?.map(a => a.name.toLowerCase()) || [])
  const existingDisplayNames = new Set(existingAttrs?.map(a => a.display_name.toLowerCase()) || [])

  // Get the highest sort_order
  const { data: maxOrderData } = await supabase
    .from('attribute_definitions')
    .select('sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  let sortOrder = (maxOrderData?.sort_order || 0) + 1

  // Process each attribute
  for (const [key, value] of Object.entries(attributes)) {
    const attrName = toAttributeName(key)
    const displayName = toDisplayName(key)

    // Skip if attribute already exists (by name or display name)
    if (existingNames.has(attrName.toLowerCase()) ||
        existingDisplayNames.has(displayName.toLowerCase())) {
      result.existing.push(displayName)
      continue
    }

    // Infer the type from the value
    const attrType = inferAttributeType(value)

    // Build options based on type and value
    const options: Record<string, unknown> = {}
    if (attrType === 'select' && Array.isArray(value)) {
      options.choices = value
    }

    // Create the attribute definition
    const { error: insertError } = await supabase
      .from('attribute_definitions')
      .insert({
        category_id: categoryId,
        name: attrName,
        display_name: displayName,
        type: attrType,
        options,
        required: false,
        show_in_list: true,
        show_in_filter: true,
        sort_order: sortOrder++,
      })

    if (insertError) {
      console.error(`Error creating attribute ${displayName}:`, insertError)
      result.errors.push(displayName)
    } else {
      result.created.push(displayName)
    }
  }

  return result
}

/**
 * Auto-creates attributes and returns a message for the user
 */
export async function autoCreateAttributesWithMessage(
  supabase: SupabaseClient,
  categoryId: string | null,
  attributes: Record<string, unknown>
): Promise<string | null> {
  if (!categoryId) return null

  const result = await autoCreateAttributeDefinitions(supabase, categoryId, attributes)

  if (result.created.length > 0) {
    return `${result.created.length} neue Attribute erstellt: ${result.created.join(', ')}`
  }

  return null
}
