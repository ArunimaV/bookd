// ============================================
// API Configuration
// ============================================

export interface TeliApiConfig {
  apiUrl: string;
  apiKey: string;
  organizationId: string;
}

// ============================================
// User Types
// ============================================

export interface CreateUserParams {
  name: string;
  email: string;
  permission?: 'admin' | 'user';
}

export interface TeliUser {
  unique_id: string;
  name: string;
  email: string;
  permission: string;
}

// ============================================
// Phone Number Types
// ============================================

export interface CreatePhoneNumberParams {
  areaCode: string;
  userId: string;
  tenantId: string;
  nickname?: string;
  inboundAgentId?: string;  // Can attach agent during creation
}

export interface TeliPhoneNumber {
  phone_number: string;
  area_code: string;
}

// ============================================
// Voice Agent Types
// ============================================

export interface CreateVoiceAgentParams {
  agentName: string;
  startingMessage: string;
  prompt: string;
  userId: string;
  voiceId: string;
  language?: string;
  extractionFields: string[];
}

export interface TeliVoiceAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  status?: string;
  created_at?: string;
}

// ============================================
// Attach Agent Types
// ============================================

export interface AttachAgentParams {
  phoneNumber: string;
  inboundAgentId: string;
}

// ============================================
// API Response Types
// ============================================

export interface TeliApiResponse<T> {
  success: boolean;
  user?: T;
  phone_number?: string;
  agent_id?: string;
  error?: string;
}

// ============================================
// Onboarding Types (for full setup flow)
// ============================================

export interface BusinessOnboardingData {
  // From Supabase business record
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  area_code: string;
  starting_message: string;
  agent_prompt: string;
  voice_id: string;
  extraction_fields: string[];
}

export interface SetupResult {
  success: boolean;
  userId?: string;
  phoneNumber?: string;
  agentId?: string;
  error?: string;
}
