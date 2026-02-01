import { createAdminClient } from './supabase/server'

// ============================================
// TELI API CONFIGURATION
// ============================================

const TELI_API_BASE = 'https://teli-hackathon--transfer-message-service-fastapi-app.modal.run'
const TELI_API_KEY = process.env.TELI_API_KEY
const ORGANIZATION_ID = '1769896006541x692178929745735640'

// ============================================
// TYPES
// ============================================

export interface TeliCall {
  call_id: string
  voice_agent_id?: string
  agent_id?: string
  agent_name?: string
  direction?: string
  call_type?: string
  from_number: string
  to_number?: string
  call_status: string
  start_timestamp?: string
  end_timestamp?: string
  duration_ms?: number
  disconnection_reason?: string
  user_sentiment?: string
  call_successful?: boolean
  in_voicemail?: boolean
  recording_url?: string
  transcript?: string
  extracted_fields?: Record<string, string>
  call_analysis?: Record<string, any>
  metadata?: Record<string, any>
}

export interface TeliCallsResponse {
  success: boolean
  calls: TeliCall[]
  count: number
  powered_by: string
}

// Types for full organization sync
export interface SyncAllResult {
  success: boolean
  totalCalls: number
  syncedCalls: number
  newCustomers: number
  skippedCalls: number
  duplicateCalls: number
  callsByBusiness: Record<string, { name: string; synced: number; new: number }>
  errors: string[]
}

export interface Business {
  id: string
  name: string
  business_name: string
  teli_agent_id: string | null
  teli_phone_number: string | null
}

// Universal fields that go into fixed columns
const UNIVERSAL_FIELDS = [
  'first_name',
  'last_name',
  'appointment_time',
  'day',
  'month',
  'phone_number',
  'email'
]

// ============================================
// TELI API FUNCTIONS
// ============================================

/**
 * Fetch recent calls from Teli API
 */
export async function fetchTeliCalls(
  organizationId: string,
  since?: string,
  limit: number = 50
): Promise<{ success: boolean; calls?: TeliCall[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      organization_id: organizationId,
      is_admin: 'false',
      limit: limit.toString(),
      call_status: 'ended',
    })

    if (since) {
      params.append('start_date', since)
    }

    const response = await fetch(`${TELI_API_BASE}/v1/voice/calls?${params}`, {
      headers: {
        'X-API-Key': TELI_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Teli API error: ${response.status} - ${errBody}`)
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
    const response = await fetch(`${TELI_API_BASE}/v1/voice/calls/${callId}`, {
      headers: {
        'X-API-Key': TELI_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Teli API error: ${response.status} - ${errBody}`)
    }

    const data = await response.json()
    return { success: true, call: data.call }
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
    const phoneNumber = call.from_number

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone_number', phoneNumber)
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
          phone_number: phoneNumber,
          email: universal.email || null,
          call_id: call.call_id,
          appointment_time: universal.appointment_time || null,
          month: universal.month || null,
          day: universal.day || null,
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
          call_id: call.call_id,
          appointment_time: universal.appointment_time || existingCustomer.appointment_time,
          month: universal.month || existingCustomer.month,
          day: universal.day || existingCustomer.day,
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
      content: call.transcript || `Call from ${phoneNumber}`,
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
      result.errors.push(`Call ${call.call_id}: ${syncResult.error}`)
    }
  }

  return result
}

// ============================================
// FULL ORGANIZATION SYNC FUNCTIONS
// ============================================

/**
 * Fetch ALL calls from the organization using is_admin=true
 * This returns calls from all agents in the organization
 */
export async function fetchAllOrganizationCalls(
  options?: {
    since?: string
    limit?: number
    direction?: 'inbound' | 'outbound'
  }
): Promise<{ success: boolean; calls?: TeliCall[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      organization_id: ORGANIZATION_ID,
      is_admin: 'true',  // Key difference: gets ALL org calls
      limit: (options?.limit || 100).toString(),
      call_status: 'ended',
    })

    if (options?.since) {
      params.append('start_date', options.since)
    }

    if (options?.direction) {
      params.append('direction', options.direction)
    }

    console.log('[Teli] Fetching all organization calls...')
    
    const response = await fetch(`${TELI_API_BASE}/v1/voice/calls?${params}`, {
      headers: {
        'X-API-Key': TELI_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Teli API error: ${response.status} - ${errBody}`)
    }

    const data: TeliCallsResponse = await response.json()
    console.log(`[Teli] Fetched ${data.calls?.length || 0} calls from organization`)
    
    return { success: true, calls: data.calls || [] }
  } catch (error) {
    console.error('Error fetching organization calls:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Build a map of agent_id -> business for fast lookups
 */
async function buildAgentToBusinessMap(): Promise<Map<string, Business>> {
  const supabase = createAdminClient()
  const map = new Map<string, Business>()

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, business_name, teli_agent_id, teli_phone_number')

  if (error) {
    console.error('Error fetching businesses:', error)
    return map
  }

  for (const business of businesses || []) {
    if (business.teli_agent_id) {
      map.set(business.teli_agent_id, business as Business)
    }
  }

  console.log(`[Sync] Built agent->business map with ${map.size} entries`)
  return map
}

/**
 * Check if a call has already been synced (by checking messages table for call_id)
 */
async function isCallAlreadySynced(callId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('messages')
    .select('id')
    .eq('teli_data->>call_id', callId)
    .limit(1)
    .single()

  return !!data
}

/**
 * Get all synced call IDs from the database for efficient batch checking
 */
async function getSyncedCallIds(): Promise<Set<string>> {
  const supabase = createAdminClient()
  const syncedIds = new Set<string>()

  // Query messages table and extract call_ids from teli_data
  const { data: messages, error } = await supabase
    .from('messages')
    .select('teli_data')
    .eq('channel', 'call')

  if (error) {
    console.error('Error fetching synced call IDs:', error)
    return syncedIds
  }

  for (const msg of messages || []) {
    const teliData = msg.teli_data as any
    if (teliData?.call_id) {
      syncedIds.add(teliData.call_id)
    }
  }

  console.log(`[Sync] Found ${syncedIds.size} already-synced calls`)
  return syncedIds
}

/**
 * Sync ALL organization calls to Supabase
 * Maps each call to the correct business via agent_id
 * Skips calls that have already been synced (deduplication)
 */
export async function syncAllOrganizationCalls(
  options?: { since?: string }
): Promise<SyncAllResult> {
  const result: SyncAllResult = {
    success: true,
    totalCalls: 0,
    syncedCalls: 0,
    newCustomers: 0,
    skippedCalls: 0,
    duplicateCalls: 0,
    callsByBusiness: {},
    errors: [],
  }

  try {
    // Step 1: Fetch all org calls from Teli
    const fetchResult = await fetchAllOrganizationCalls({
      since: options?.since,
      limit: 100,
    })

    if (!fetchResult.success || !fetchResult.calls) {
      return {
        ...result,
        success: false,
        errors: [fetchResult.error || 'Failed to fetch organization calls'],
      }
    }

    result.totalCalls = fetchResult.calls.length

    if (result.totalCalls === 0) {
      console.log('[Sync] No calls to sync')
      return result
    }

    // Step 2: Build agent -> business map
    const agentToBusinessMap = await buildAgentToBusinessMap()

    // Step 3: Get already-synced call IDs for deduplication
    const syncedCallIds = await getSyncedCallIds()

    // Step 4: Process each call
    for (const call of fetchResult.calls) {
      // Check for duplicate
      if (syncedCallIds.has(call.call_id)) {
        result.duplicateCalls++
        continue
      }

      // Find the business for this call
      const agentId = call.voice_agent_id || call.agent_id
      if (!agentId) {
        result.skippedCalls++
        result.errors.push(`Call ${call.call_id}: No agent_id found`)
        continue
      }

      const business = agentToBusinessMap.get(agentId)
      if (!business) {
        result.skippedCalls++
        result.errors.push(`Call ${call.call_id}: Unknown agent_id ${agentId}`)
        continue
      }

      // Inject business_name into extracted_fields for reliable association
      if (call.extracted_fields) {
        call.extracted_fields.business_name = business.name
      } else {
        call.extracted_fields = { business_name: business.name }
      }

      // Sync the call to the correct business
      const syncResult = await syncCallToSupabase(business.id, call)

      if (syncResult.success) {
        result.syncedCalls++
        
        // Track per-business stats
        if (!result.callsByBusiness[business.id]) {
          result.callsByBusiness[business.id] = {
            name: business.name,
            synced: 0,
            new: 0,
          }
        }
        result.callsByBusiness[business.id].synced++

        if (syncResult.isNew) {
          result.newCustomers++
          result.callsByBusiness[business.id].new++
        }
      } else {
        result.errors.push(`Call ${call.call_id}: ${syncResult.error}`)
      }
    }

    console.log(`[Sync] Complete: ${result.syncedCalls} synced, ${result.newCustomers} new customers, ${result.duplicateCalls} duplicates skipped`)
    return result
  } catch (error) {
    console.error('Error in syncAllOrganizationCalls:', error)
    return {
      ...result,
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}
