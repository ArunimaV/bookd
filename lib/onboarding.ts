import { createAdminClient } from './supabase/server'

// ============================================
// INPUTS FOR CREATING BUSINESS WITH TELI IDS
// ============================================

export interface CreateBusinessInputs {
  // Pre-generated ID
  id: string

  // User/Owner Info
  ownerEmail: string
  ownerName: string

  // Business Info
  orgName: string
  timezone?: string

  // Phone Setup
  areaCode: string

  // Voice Agent Configuration
  agentNickname: string
  startingMessage: string
  agentPrompt: string
  voiceId: string

  // Custom Extraction Fields
  customExtractionFields?: string[]

  // Teli IDs (from successful Teli setup)
  teliUserId: string
  teliPhoneNumber: string
  teliAgentId: string

  // Optional Business Details
  workHours?: {
    monday?: { start: string; end: string; off?: boolean }
    tuesday?: { start: string; end: string; off?: boolean }
    wednesday?: { start: string; end: string; off?: boolean }
    thursday?: { start: string; end: string; off?: boolean }
    friday?: { start: string; end: string; off?: boolean }
    saturday?: { start: string; end: string; off?: boolean }
    sunday?: { start: string; end: string; off?: boolean }
  }
  services?: Array<{
    name: string
    duration: number
    price: number
  }>
}

// ============================================
// ONBOARDING FUNCTIONS
// ============================================

/**
 * Create business record in Supabase WITH Teli IDs already set
 * Call this ONLY after Teli setup succeeds
 */
export async function createBusinessWithTeliIds(inputs: CreateBusinessInputs) {
  const supabase = createAdminClient()

  // Create slug from org name
  const slug = inputs.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Default work hours
  const defaultWorkHours = {
    monday: { start: "09:00", end: "17:00", off: false },
    tuesday: { start: "09:00", end: "17:00", off: false },
    wednesday: { start: "09:00", end: "17:00", off: false },
    thursday: { start: "09:00", end: "17:00", off: false },
    friday: { start: "09:00", end: "17:00", off: false },
    saturday: { start: "10:00", end: "14:00", off: false },
    sunday: { start: "00:00", end: "00:00", off: true },
  }

  // Default services
  const defaultServices = [
    { name: "Consultation", duration: 30, price: 0 },
    { name: "Standard Service", duration: 60, price: 50 },
  ]

  // Insert the business with Teli IDs already included
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      id: inputs.id,
      user_id: inputs.id, // Use same ID for user_id
      owner_email: inputs.ownerEmail,
      owner_name: inputs.ownerName,
      name: inputs.orgName,
      business_name: slug,
      area_code: inputs.areaCode,
      agent_nickname: inputs.agentNickname,
      starting_message: inputs.startingMessage,
      teli_agent_prompt: inputs.agentPrompt,
      voice_id: inputs.voiceId,
      custom_fields: {
        extraction_fields: inputs.customExtractionFields || [],
      },
      // Teli IDs from successful setup
      teli_user_id: inputs.teliUserId,
      teli_phone_number: inputs.teliPhoneNumber,
      teli_agent_id: inputs.teliAgentId,
      // Other settings
      timezone: inputs.timezone || 'America/New_York',
      work_hours: inputs.workHours || defaultWorkHours,
      services: inputs.services || defaultServices,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    business: data,
  }
}

/**
 * Get business by owner email
 */
export async function getBusinessByEmail(ownerEmail: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_email', ownerEmail)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, business: data }
}

/**
 * Get business by ID
 */
export async function getBusinessById(businessId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, business: data }
}

/**
 * Get business by agent ID (useful for webhook lookups)
 */
export async function getBusinessByAgentId(agentId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('teli_agent_id', agentId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, business: data }
}
