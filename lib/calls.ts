import { createAdminClient } from './supabase/server'

// ============================================
// TYPES
// ============================================

export interface TeliCallData {
  call_id: string
  phone: string
  timestamp: string
  duration?: number
  status: 'completed' | 'missed' | 'ongoing'
  extracted_fields?: Record<string, string>
  transcript?: string
  recording_url?: string
}

export interface ProcessedCustomer {
  id: string
  business_id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  custom_fields: Record<string, string>
  created_at: string
  is_new: boolean
}

// Universal fields that go into fixed columns
// Everything else goes into custom_fields JSONB
const UNIVERSAL_FIELDS = [
  'first_name',
  'last_name',
  'appointment_time',
  'day',
  'month',
  'phone',
  'email'
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Split extracted fields into universal (fixed columns) and custom (JSONB)
 */
function splitExtractedFields(extractedFields: Record<string, string> | undefined) {
  if (!extractedFields) return { universal: {}, custom: {} }

  const universal: Record<string, string> = {}
  const custom: Record<string, string> = {}

  for (const [key, value] of Object.entries(extractedFields)) {
    if (UNIVERSAL_FIELDS.includes(key)) {
      universal[key] = value
    } else {
      custom[key] = value
    }
  }

  return { universal, custom }
}


// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Process a new call and store/update customer data in Supabase
 * Returns the processed customer data
 */
export async function processCallAndStoreCustomer(
  businessId: string,
  callData: TeliCallData
): Promise<{ success: boolean; customer?: ProcessedCustomer; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Split extracted fields into universal and custom
    const { universal, custom } = splitExtractedFields(callData.extracted_fields)

    // Check if customer already exists by phone
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone', callData.phone)
      .single()

    let customer: any
    let isNew = false

    if (!existingCustomer) {
      // Create new customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          business_id: businessId,
          first_name: universal.first_name || 'New',
          last_name: universal.last_name || 'Customer',
          phone: callData.phone,
          email: universal.email || null,
          custom_fields: custom,
        })
        .select()
        .single()

      if (error) throw error
      customer = newCustomer
      isNew = true
    } else {
      // Update existing customer - merge custom fields
      const existingCustomFields = (existingCustomer.custom_fields as Record<string, string>) || {}
      const mergedCustomFields = { ...existingCustomFields, ...custom }

      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({
          first_name: universal.first_name || existingCustomer.first_name,
          last_name: universal.last_name || existingCustomer.last_name,
          email: universal.email || existingCustomer.email,
          custom_fields: mergedCustomFields,
        })
        .eq('id', existingCustomer.id)
        .select()
        .single()

      if (error) throw error
      customer = updatedCustomer
    }

    // Log the call as a message
    await supabase.from('messages').insert({
      business_id: businessId,
      customer_id: customer.id,
      direction: 'inbound',
      channel: 'call',
      content: callData.transcript || `Call from ${callData.phone}`,
      teli_data: callData as any,
    })

    return {
      success: true,
      customer: {
        id: customer.id,
        business_id: customer.business_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        email: customer.email,
        custom_fields: customer.custom_fields || {},
        created_at: customer.created_at,
        is_new: isNew,
      },
    }
  } catch (error) {
    console.error('Error processing call:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get recent customers for a business (for displaying new calls)
 */
export async function getRecentCustomers(
  businessId: string,
  limit: number = 10
): Promise<{ success: boolean; customers?: ProcessedCustomer[]; error?: string }> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const customers: ProcessedCustomer[] = data.map((c: any) => ({
      id: c.id,
      business_id: c.business_id,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      email: c.email,
      custom_fields: c.custom_fields || {},
      created_at: c.created_at,
      is_new: false,
    }))

    return { success: true, customers }
  } catch (error) {
    console.error('Error fetching recent customers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get customers updated since a specific timestamp (for polling)
 */
export async function getCustomersSince(
  businessId: string,
  since: string
): Promise<{ success: boolean; customers?: ProcessedCustomer[]; error?: string }> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .gt('created_at', since)
      .order('created_at', { ascending: false })

    if (error) throw error

    const customers: ProcessedCustomer[] = data.map((c: any) => ({
      id: c.id,
      business_id: c.business_id,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      email: c.email,
      custom_fields: c.custom_fields || {},
      created_at: c.created_at,
      is_new: true,
    }))

    return { success: true, customers }
  } catch (error) {
    console.error('Error fetching customers since:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
