import { createAdminClient } from './supabase/server'

// ============================================
// TELI API CONFIGURATION
// ============================================

const TELI_API_BASE = 'https://teli-hackathon--transfer-message-service-fastapi-app.modal.run'
const TELI_API_KEY = process.env.TELI_API_KEY

// ============================================
// TYPES
// ============================================

export interface TeliCall {
  id: string
  phone: string
  timestamp: string
  duration?: number
  status: 'completed' | 'missed' | 'ongoing'
  extracted_fields?: Record<string, string>
  transcript?: string
  recording_url?: string
}

export interface TeliCallsResponse {
  calls: TeliCall[]
  has_more: boolean
  next_cursor?: string
}

// Universal fields that go into fixed columns
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
// TELI API FUNCTIONS
// ============================================

/**
 * Fetch recent calls from Teli API
 */
export async function fetchTeliCalls(
  agentId: string,
  since?: string,
  limit: number = 50
): Promise<{ success: boolean; calls?: TeliCall[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      agent_id: agentId,
      limit: limit.toString(),
    })

    if (since) {
      params.append('since', since)
    }

    const response = await fetch(`${TELI_API_BASE}/v1/calls?${params}`, {
      headers: {
        'Authorization': `Bearer ${TELI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Teli API error: ${response.status}`)
    }

    const data: TeliCallsResponse = await response.json()
    return { success: true, calls: data.calls }
  } catch (error) {
    console.error('Error fetching Teli calls:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch a single call's details from Teli
 */
export async function fetchTeliCallDetails(
  callId: string
): Promise<{ success: boolean; call?: TeliCall; error?: string }> {
  try {
    const response = await fetch(`${TELI_API_BASE}/v1/calls/${callId}`, {
      headers: {
        'Authorization': `Bearer ${TELI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Teli API error: ${response.status}`)
    }

    const call: TeliCall = await response.json()
    return { success: true, call }
  } catch (error) {
    console.error('Error fetching Teli call details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// SYNC FUNCTIONS
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

/**
 * Sync a single Teli call to Supabase
 * Creates or updates customer, logs the call
 */
export async function syncCallToSupabase(
  businessId: string,
  call: TeliCall
): Promise<{ success: boolean; customerId?: string; isNew?: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    const { universal, custom } = splitExtractedFields(call.extracted_fields)

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone', call.phone)
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
          phone: call.phone,
          email: universal.email || null,
          custom_fields: custom,
        })
        .select()
        .single()

      if (error) throw error
      customer = newCustomer
      isNew = true
    } else {
      // Update existing customer
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
      content: call.transcript || `Call from ${call.phone}`,
      teli_data: call as any,
    })

    return { success: true, customerId: customer.id, isNew }
  } catch (error) {
    console.error('Error syncing call to Supabase:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Pull all new calls from Teli and sync to Supabase
 * This is the main function to call periodically
 */
export async function pullAndSyncCalls(
  businessId: string,
  agentId: string,
  since?: string
): Promise<{
  success: boolean
  synced: number
  newCustomers: number
  errors: string[]
}> {
  const result = {
    success: true,
    synced: 0,
    newCustomers: 0,
    errors: [] as string[],
  }

  // Fetch calls from Teli
  const fetchResult = await fetchTeliCalls(agentId, since)

  if (!fetchResult.success || !fetchResult.calls) {
    return {
      ...result,
      success: false,
      errors: [fetchResult.error || 'Failed to fetch calls'],
    }
  }

  // Sync each call
  for (const call of fetchResult.calls) {
    const syncResult = await syncCallToSupabase(businessId, call)

    if (syncResult.success) {
      result.synced++
      if (syncResult.isNew) {
        result.newCustomers++
      }
    } else {
      result.errors.push(`Call ${call.id}: ${syncResult.error}`)
    }
  }

  return result
}
