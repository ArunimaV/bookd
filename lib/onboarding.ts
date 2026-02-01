import { createAdminClient } from './supabase/server'

// ============================================
// REQUIRED INPUTS FOR ONBOARDING
// ============================================
// Use this as a reference for your UI form fields

export interface OnboardingInputs {
  // User/Owner Info
  ownerEmail: string          // Required - unique identifier for the user
  ownerName?: string          // Optional - for display purposes

  // Organization Info
  orgName: string             // Required - business name (e.g., "Bloom Studio")
  timezone?: string           // Optional - defaults to "America/New_York"

  // Phone Number
  phoneNumber: string         // Required - Teli phone number (e.g., "+15551234567")

  // Voice Agent
  voiceAgentId: string        // Required - Teli agent ID to attach to phone

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
    duration: number  // in minutes
    price: number
  }>
}

// ============================================
// ONBOARDING FUNCTIONS
// ============================================

/**
 * Complete onboarding - creates org, user, phone, and attaches agent
 * This is the main function to call from your UI
 */
export async function completeOnboarding(inputs: OnboardingInputs) {
  const supabase = createAdminClient()

  // Generate owner_id (UUID) for the user
  const ownerId = crypto.randomUUID()

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

  // Insert the business (which includes user, phone, and agent)
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: ownerId,
      owner_email: inputs.ownerEmail,
      name: inputs.orgName,
      slug: slug,
      teli_phone_number: inputs.phoneNumber,
      teli_agent_id: inputs.voiceAgentId,
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
    message: `Successfully created "${inputs.orgName}" with phone ${inputs.phoneNumber} and agent ${inputs.voiceAgentId}`
  }
}

/**
 * Update voice agent ID for an existing business
 */
export async function attachVoiceAgent(businessId: string, voiceAgentId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('businesses')
    .update({ teli_agent_id: voiceAgentId })
    .eq('id', businessId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, business: data }
}

/**
 * Update phone number for an existing business
 */
export async function updatePhoneNumber(businessId: string, phoneNumber: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('businesses')
    .update({ teli_phone_number: phoneNumber })
    .eq('id', businessId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, business: data }
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
