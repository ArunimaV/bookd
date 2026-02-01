import { createUser, createPhoneNumber, createVoiceAgent, attachAgentToPhone } from './api';
import type { SetupResult } from './types';

// ============================================
// Build Final Prompt with Business Name Injected
// ============================================

function buildFinalPrompt(businessName: string, customPrompt: string): string {
  return `You are an AI voice assistant for ${businessName}. The business name is always "${businessName}" - do not ask for this.

${customPrompt}`;
}

// ============================================
// Standard Extraction Fields (same for all businesses)
// ============================================

// These fields match the columns in the customers table
const STANDARD_EXTRACTION_FIELDS = [
  'business_name',      // Silent - injected via prompt, not spoken
  'first_name',
  'last_name',
  'phone_number',
  'appointment_time',
  'month',
  'day',
];

// Combine standard fields with business-specific custom fields
function buildExtractionFields(customFields: string[] = []): string[] {
  // Start with standard fields
  const allFields = [...STANDARD_EXTRACTION_FIELDS];
  
  // Add custom fields, avoiding duplicates
  for (const field of customFields) {
    if (!allFields.includes(field)) {
      allFields.push(field);
    }
  }
  
  return allFields;
}

// ============================================
// Teli Setup Data (passed directly, not from Supabase)
// ============================================

export interface TeliSetupData {
  tenantId: string;           // UUID for this business (generated upfront)
  businessName: string;       // Business name
  ownerName: string;          // Owner name for Teli user
  ownerEmail: string;         // Owner email for Teli user
  areaCode: string;           // Area code for phone number
  agentNickname: string;      // Agent display name
  startingMessage: string;    // AI greeting
  agentPrompt: string;        // AI instructions
  voiceId: string;            // Selected voice
  customExtractionFields?: string[];  // Business-specific fields
}

// ============================================
// Full Setup Flow (Teli only, no Supabase)
// ============================================

/**
 * Sets up a complete Teli voice agent.
 * Does NOT touch Supabase - call this first, then save to Supabase only if this succeeds.
 * 
 * Flow:
 * 1. Create Teli user
 * 2. Create phone number
 * 3. Create voice agent
 * 4. Attach agent to phone number
 * 
 * @param data - All the data needed for Teli setup
 * @returns SetupResult with userId, phoneNumber, and agentId
 */
export async function setupTeliVoiceAgent(data: TeliSetupData): Promise<SetupResult> {
  try {
    // 1. Create Teli User (with unique email suffix to avoid duplicates)
    const uniqueEmailSuffix = data.tenantId.slice(0, 8);
    const teliEmail = data.ownerEmail.replace('@', `+${uniqueEmailSuffix}@`);
    
    console.log('[Teli Setup] Step 1: Creating user with email:', teliEmail);
    
    const user = await createUser({
      name: data.ownerName,
      email: teliEmail,
    });
    console.log('[Teli Setup] Step 1 complete - User ID:', user.unique_id);

    // 2. Create Voice Agent FIRST (before phone number)
    const finalPrompt = buildFinalPrompt(data.businessName, data.agentPrompt);
    const extractionFields = buildExtractionFields(data.customExtractionFields || []);

    console.log('[Teli Setup] Step 2: Creating voice agent:', data.agentNickname);
    
    const agent = await createVoiceAgent({
      agentName: data.agentNickname,
      startingMessage: data.startingMessage,
      prompt: finalPrompt,
      userId: user.unique_id,
      voiceId: data.voiceId || 'openai-Nova',
      extractionFields: extractionFields,
    });
    console.log('[Teli Setup] Step 2 complete - Agent ID:', agent.id);

    // 3. Create Phone Number
    console.log('[Teli Setup] Step 3: Creating phone number');
    
    const phoneNumber = await createPhoneNumber({
      areaCode: data.areaCode,
      userId: user.unique_id,
      tenantId: data.tenantId,
      nickname: data.businessName || data.agentNickname || 'Business Line',
    });
    console.log('[Teli Setup] Step 3 complete - Phone:', phoneNumber);

    // 4. Attach Agent to Phone Number (explicit call to ensure it's attached)
    console.log('[Teli Setup] Step 4: Attaching agent to phone number');
    
    const attached = await attachAgentToPhone({
      phoneNumber: phoneNumber,
      inboundAgentId: agent.id,
    });
    console.log('[Teli Setup] Step 4 complete - Attached:', attached);
    
    console.log('[Teli Setup] Complete!');

    return {
      success: true,
      userId: user.unique_id,
      phoneNumber: phoneNumber,
      agentId: agent.id,
    };
  } catch (error) {
    console.error('Teli setup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Keep the old function for backward compatibility but mark as deprecated
/** @deprecated Use setupTeliVoiceAgent instead */
export async function setupBusinessVoiceAgent(businessId: string): Promise<SetupResult> {
  console.warn('setupBusinessVoiceAgent is deprecated. Use setupTeliVoiceAgent instead.');
  return {
    success: false,
    error: 'This function is deprecated. Use setupTeliVoiceAgent instead.',
  };
}
