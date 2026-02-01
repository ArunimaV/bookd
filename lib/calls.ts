import { createAdminClient } from './supabase/server'

// ============================================
// TYPES
// ============================================

export interface TeliCallData {
  call_id: string
  phone_number: string
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
  name: string
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
  'name',
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

function extractTranscript(payload: any): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  if (typeof payload.transcript === 'string') return payload.transcript
  if (typeof payload.call?.transcript === 'string') return payload.call.transcript
  if (typeof payload.data?.transcript === 'string') return payload.data.transcript
  if (typeof payload.result?.transcript === 'string') return payload.result.transcript
  return undefined
}

export async function fetchCallTranscript(callId: string): Promise<string | undefined> {
  const apiUrl = process.env.TELI_API_URL
  const apiKey = process.env.TELI_API_KEY

  console.log('[fetchCallTranscript] Starting for callId:', callId)
  console.log('[fetchCallTranscript] TELI_API_URL:', apiUrl || 'NOT SET')
  console.log('[fetchCallTranscript] TELI_API_KEY:', apiKey ? `${apiKey.slice(0, 10)}...` : 'NOT SET')

  if (!apiUrl || !apiKey) {
    console.error('[fetchCallTranscript] MISSING ENV VARS - TELI_API_URL:', !!apiUrl, 'TELI_API_KEY:', !!apiKey)
    return undefined
  }

  try {
    const normalizedBase = apiUrl.replace(/\/$/, '')
    const url = `${normalizedBase}/v1/voice/calls/${callId}`
    console.log('[fetchCallTranscript] Fetching URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    })

    console.log('[fetchCallTranscript] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[fetchCallTranscript] Error response body:', errorText)
      return undefined
    }

    const data = await response.json()
    console.log('[fetchCallTranscript] Response keys:', Object.keys(data))
    console.log('[fetchCallTranscript] Has transcript field:', 'transcript' in data)
    
    if (data.transcript) {
      console.log('[fetchCallTranscript] Transcript length:', data.transcript.length)
      console.log('[fetchCallTranscript] Transcript preview:', data.transcript.slice(0, 100))
    }

    const transcript = extractTranscript(data)
    console.log('[fetchCallTranscript] Extracted transcript:', transcript ? `Found (${transcript.length} chars)` : 'NOT FOUND')
    
    return transcript
  } catch (error) {
    console.error('[fetchCallTranscript] Exception:', error)
    return undefined
  }
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
    const transcript =
      callData.transcript || (callData.call_id ? await fetchCallTranscript(callData.call_id) : undefined)

    // Split extracted fields into universal and custom
    const { universal, custom } = splitExtractedFields(callData.extracted_fields)

    // Check if customer already exists by phone
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone', callData.phone_number)
      .single()

    let customer: any
    let isNew = false

    // Build name from extracted fields
    const customerName = universal.name || 
      [universal.first_name, universal.last_name].filter(Boolean).join(' ') || 
      'New Customer'

    if (!existingCustomer) {
      // Create new customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          business_id: businessId,
          name: customerName,
          phone: callData.phone_number,
          email: universal.email || null,
          custom_fields: custom,
          call_transcript: transcript || null,
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

      const updatePayload: Record<string, any> = {
        name: customerName !== 'New Customer' ? customerName : existingCustomer.name,
        email: universal.email || existingCustomer.email,
        custom_fields: mergedCustomFields,
      }

      if (transcript) {
        updatePayload.call_transcript = transcript
      }

      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update(updatePayload)
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
      content: transcript || callData.transcript || `Call from ${callData.phone_number}`,
      teli_data: callData as any,
    })

    return {
      success: true,
      customer: {
        id: customer.id,
        business_id: customer.business_id,
        name: customer.name,
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
      name: c.name,
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
      name: c.name,
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
