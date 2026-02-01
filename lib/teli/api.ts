import { TELI_API_URL, ORGANIZATION_ID, getHeaders } from './config';
import type {
  CreateUserParams,
  TeliUser,
  CreatePhoneNumberParams,
  CreateVoiceAgentParams,
  TeliVoiceAgent,
  AttachAgentParams,
  TeliApiResponse,
} from './types';

// ============================================
// 1. Create User
// ============================================

export async function createUser(params: CreateUserParams): Promise<TeliUser> {
  const { name, email, permission = 'admin' } = params;

  const response = await fetch(
    `${TELI_API_URL}/v1/organizations/${ORGANIZATION_ID}/users`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, permission }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teli API error (${response.status}): ${errorText}`);
  }

  const data: TeliApiResponse<TeliUser> = await response.json();
  
  if (!data.user) {
    throw new Error('Teli API did not return a user');
  }
  
  return data.user;
}

// ============================================
// 2. Create Phone Number
// ============================================

export async function createPhoneNumber(params: CreatePhoneNumberParams): Promise<string> {
  const { areaCode, userId, tenantId, nickname, inboundAgentId } = params;

  const payload: Record<string, string> = {
    area_code: areaCode,
    user_id: userId,
    organization_id: ORGANIZATION_ID,
    tenant_id: tenantId,
  };
  
  // Add optional fields
  if (nickname) {
    payload.nickname = nickname;
  }
  if (inboundAgentId) {
    payload.inbound_agent_id = inboundAgentId;
  }
  
  console.log('[Teli] Creating phone number with payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(
    `${TELI_API_URL}/v1/voice/phone-numbers/create`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[createPhoneNumber] Teli API error (${response.status}): ${errorText}`);
  }

  const data: TeliApiResponse<null> = await response.json();
  
  if (!data.phone_number) {
    throw new Error('Teli API did not return a phone number');
  }
  
  return data.phone_number;
}

// ============================================
// 3. Create Voice Agent
// ============================================

export async function createVoiceAgent(params: CreateVoiceAgentParams): Promise<TeliVoiceAgent> {
  const {
    agentName,
    startingMessage,
    prompt,
    userId,
    voiceId,
    language = 'en-US',
    extractionFields,
  } = params;

  const payload = {
    agent_type: 'voice',
    agent_name: agentName,
    starting_message: startingMessage,
    prompt: prompt,
    organization_id: ORGANIZATION_ID,
    user_id: userId,
    voice_id: voiceId,
    language,
    extraction_fields: extractionFields,
  };

  const response = await fetch(`${TELI_API_URL}/v1/agents`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teli API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('[Teli] Create agent response:', JSON.stringify(data, null, 2));
  
  // Use voice_agent_id for attaching to phone numbers
  const agentId = data.voice_agent_id;
  if (!agentId) {
    console.error('[Teli] Could not find voice_agent_id in response. Available keys:', Object.keys(data));
  }
  
  console.log('[Teli] Using voice_agent_id:', agentId);
  
  return {
    ...data,
    id: agentId,  // Use voice_agent_id as the ID for phone attachment
  };
}

// ============================================
// 4. Attach Agent to Phone Number
// ============================================

export async function attachAgentToPhone(params: AttachAgentParams): Promise<boolean> {
  const { phoneNumber, inboundAgentId } = params;

  const payload = {
    inbound_agent_id: inboundAgentId,
  };
  
  console.log('[Teli] Attaching agent to phone with payload:', JSON.stringify(payload, null, 2));
  console.log('[Teli] Phone number:', phoneNumber);

  const response = await fetch(
    `${TELI_API_URL}/v1/voice/phone-numbers/${phoneNumber}/update-agent`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[attachAgentToPhone] Teli API error (${response.status}): ${errorText}`);
  }

  const data: TeliApiResponse<null> = await response.json();
  return data.success;
}
