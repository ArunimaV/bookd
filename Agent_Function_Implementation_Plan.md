# Teli AI Voice Agent Implementation Plan

## Overview

This document outlines the implementation plan for TypeScript functions that integrate with the Teli API to create and configure inbound voice agents. Business users complete an onboarding form, which stores their data in Supabase. The system then uses this data to provision resources in Teli AI.

---

## Architecture Flow

```
┌─────────────────────┐
│   Business User     │
│   Onboarding Form   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Supabase DB       │
│   (business table)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Teli API Functions │
│  (TypeScript)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│              Teli AI Platform               │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │  User   │  │  Phone  │  │ Voice Agent │ │
│  │         │  │ Number  │  │             │ │
│  └─────────┘  └─────────┘  └─────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

```env
TELI_API_URL=https://teli-hackathon--transfer-message-service-fastapi-app.modal.run
TELI_API_KEY=hackathon-sms-api-key-h4ck-2024-a1b2-c3d4e5f67890
```

### Fixed Values

| Parameter | Value | Notes |
|-----------|-------|-------|
| `organization_id` | `1769896006541x692178929745735640` | Locked - shared organization |
| `agent_type` | `voice` | Auto-generated - always "voice" for voice agents |

---

## Types & Interfaces

### File: `lib/teli/types.ts`

```typescript
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
  name: string;           // User can change
  email: string;          // User can change
  permission?: 'admin' | 'user';  // Default: 'admin'
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
  areaCode: string;       // User can change (e.g., "313", "734")
  userId: string;         // Auto-generated from createUser
  tenantId: string;       // Business identifier
}

export interface TeliPhoneNumber {
  phone_number: string;
  area_code: string;
}

// ============================================
// Voice Agent Types
// ============================================

export interface CreateVoiceAgentParams {
  agentName: string;           // User can change - nickname for the agent
  startingMessage: string;     // User can change - greeting message
  prompt: string;              // User can change - agent instructions
  userId: string;              // Auto-generated from createUser
  voiceId: string;             // User can change - voice selection
  language?: string;           // Default: "en-US"
  extractionFields: string[];  // User can change - custom data fields
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
  phoneNumber: string;     // From createPhoneNumber
  inboundAgentId: string;  // From createVoiceAgent
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
```

---

## Function Implementations

### File: `lib/teli/api.ts`

### 1. Create User

Creates a new user in Teli AI associated with the organization.

| Parameter | Type | Configurable | Notes |
|-----------|------|--------------|-------|
| `name` | string | ✅ User Input | Business owner name |
| `email` | string | ✅ User Input | Business contact email |
| `permission` | string | ❌ Auto | Default: "admin" |
| `organizationId` | string | ❌ Locked | Fixed organization ID |

```typescript
export async function createUser(params: CreateUserParams): Promise<TeliUser> {
  const { name, email, permission = 'admin' } = params;
  
  const response = await fetch(
    `${API_URL}/v1/organizations/${ORGANIZATION_ID}/users`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, permission })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teli API error (${response.status}): ${errorText}`);
  }

  const data: TeliApiResponse<TeliUser> = await response.json();
  return data.user!;
}
```

---

### 2. Create Phone Number

Provisions a new phone number in the specified area code.

| Parameter | Type | Configurable | Notes |
|-----------|------|--------------|-------|
| `areaCode` | string | ✅ User Input | 3-digit area code (e.g., "313") |
| `userId` | string | ❌ Auto | From createUser response |
| `organizationId` | string | ❌ Locked | Fixed organization ID |
| `tenantId` | string | ❌ Auto | Business UUID |

```typescript
export async function createPhoneNumber(params: CreatePhoneNumberParams): Promise<string> {
  const { areaCode, userId, tenantId } = params;
  
  const response = await fetch(
    `${API_URL}/v1/voice/phone-numbers/create`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        area_code: areaCode,
        user_id: userId,
        organization_id: ORGANIZATION_ID,
        tenant_id: tenantId
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teli API error (${response.status}): ${errorText}`);
  }

  const data: TeliApiResponse<TeliPhoneNumber> = await response.json();
  return data.phone_number!;
}
```

---

### 3. Create Voice Agent

Creates a voice agent with custom prompt and extraction fields.

| Parameter | Type | Configurable | Notes |
|-----------|------|--------------|-------|
| `agentName` | string | ✅ User Input | Nickname for the agent |
| `startingMessage` | string | ✅ User Input | Opening greeting |
| `prompt` | string | ✅ User Input | Agent instructions/personality |
| `voiceId` | string | ✅ User Input | Voice selection |
| `language` | string | ⚙️ Optional | Default: "en-US" |
| `extractionFields` | string[] | ✅ User Input | Custom data fields to extract |
| `userId` | string | ❌ Auto | From createUser response |
| `organizationId` | string | ❌ Locked | Fixed organization ID |
| `agentType` | string | ❌ Locked | Always "voice" |

```typescript
export async function createVoiceAgent(params: CreateVoiceAgentParams): Promise<TeliVoiceAgent> {
  const {
    agentName,
    startingMessage,
    prompt,
    userId,
    voiceId,
    language = 'en-US',
    extractionFields
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
    extraction_fields: extractionFields
  };

  const response = await fetch(`${API_URL}/v1/agents`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teli API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
```

---

### 4. Attach Agent to Phone Number

Links a voice agent to a phone number for inbound calls.

| Parameter | Type | Configurable | Notes |
|-----------|------|--------------|-------|
| `phoneNumber` | string | ❌ Auto | From createPhoneNumber response |
| `inboundAgentId` | string | ❌ Auto | From createVoiceAgent response |

```typescript
export async function attachAgentToPhone(params: AttachAgentParams): Promise<boolean> {
  const { phoneNumber, inboundAgentId } = params;
  
  const response = await fetch(
    `${API_URL}/v1/voice/phone-numbers/${phoneNumber}/update-agent`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        inbound_agent_id: inboundAgentId
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teli API error (${response.status}): ${errorText}`);
  }

  const data: TeliApiResponse<null> = await response.json();
  return data.success;
}
```

---

## Supabase Integration

### Business Table Schema

The onboarding form stores business data that maps to Teli API parameters:

| Column | Type | Maps To | Notes |
|--------|------|---------|-------|
| `id` | uuid | `tenantId` | Auto-generated business identifier |
| `business_name` | text | `agentName` | Used as agent nickname |
| `owner_name` | text | `name` (user) | Business owner name |
| `email` | text | `email` (user) | Contact email |
| `area_code` | text | `areaCode` | Preferred phone area code |
| `starting_message` | text | `startingMessage` | Custom greeting |
| `agent_prompt` | text | `prompt` | Voice agent instructions |
| `voice_id` | text | `voiceId` | Selected voice |
| `extraction_fields` | text[] | `extractionFields` | Custom data fields |
| `teli_user_id` | text | - | Stored after user creation |
| `teli_phone_number` | text | - | Stored after phone creation |
| `teli_agent_id` | text | - | Stored after agent creation |

### Onboarding Flow Function

```typescript
// lib/teli/onboarding.ts

import { createClient } from '@/lib/supabase/server';
import { createUser, createPhoneNumber, createVoiceAgent, attachAgentToPhone } from './api';

export async function setupBusinessVoiceAgent(businessId: string): Promise<{
  userId: string;
  phoneNumber: string;
  agentId: string;
}> {
  const supabase = await createClient();
  
  // 1. Fetch business data from Supabase
  const { data: business, error } = await supabase
    .from('business')
    .select('*')
    .eq('id', businessId)
    .single();
  
  if (error || !business) {
    throw new Error('Business not found');
  }

  // 2. Create Teli User
  const user = await createUser({
    name: business.owner_name,
    email: business.email
  });

  // 3. Create Phone Number
  const phoneNumber = await createPhoneNumber({
    areaCode: business.area_code,
    userId: user.unique_id,
    tenantId: businessId
  });

  // 4. Create Voice Agent
  const agent = await createVoiceAgent({
    agentName: business.business_name,
    startingMessage: business.starting_message,
    prompt: business.agent_prompt,
    userId: user.unique_id,
    voiceId: business.voice_id,
    extractionFields: business.extraction_fields
  });

  // 5. Attach Agent to Phone Number
  await attachAgentToPhone({
    phoneNumber: phoneNumber,
    inboundAgentId: agent.id
  });

  // 6. Update business record with Teli IDs
  await supabase
    .from('business')
    .update({
      teli_user_id: user.unique_id,
      teli_phone_number: phoneNumber,
      teli_agent_id: agent.id
    })
    .eq('id', businessId);

  return {
    userId: user.unique_id,
    phoneNumber,
    agentId: agent.id
  };
}
```

---

## File Structure

```
lib/
├── teli/
│   ├── types.ts          # Type definitions
│   ├── config.ts         # API configuration & headers
│   ├── api.ts            # Core API functions
│   ├── onboarding.ts     # Full setup flow
│   └── index.ts          # Public exports
```

---

## User-Configurable Fields Summary

### Onboarding Form Fields

| Field | Description | Example |
|-------|-------------|---------|
| Business Name | Name of the business (becomes agent nickname) | "Best Barbers" |
| Owner Name | Full name of business owner | "John Smith" |
| Email | Contact email | "john@bestbarbers.com" |
| Area Code | Preferred phone area code | "313" |
| Starting Message | Greeting when calls are answered | "Hi, thanks for calling Best Barbers!" |
| Agent Prompt | Instructions for the AI agent | "You are a friendly receptionist..." |
| Voice ID | Selected voice for the agent | "voice_001" |
| Extraction Fields | Data to extract from calls | ["name", "phone", "appointment_time"] |

---

## API Endpoints Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create User | POST | `/v1/organizations/{org_id}/users` |
| Create Phone Number | POST | `/v1/voice/phone-numbers/create` |
| Create Voice Agent | POST | `/v1/agents` |
| Attach Agent | POST | `/v1/voice/phone-numbers/{phone}/update-agent` |

---

## Error Handling Strategy

1. **Validation Errors**: Validate all user input before API calls
2. **API Errors**: Catch and parse Teli API error responses
3. **Rollback**: If any step fails, log the error and notify the user
4. **Retry Logic**: Implement exponential backoff for transient failures

---

## Next Steps

1. [ ] Create `lib/teli/` directory structure
2. [ ] Implement `types.ts` with all interfaces
3. [ ] Implement `config.ts` with API configuration
4. [ ] Implement `api.ts` with all four core functions
5. [ ] Implement `onboarding.ts` with full setup flow
6. [ ] Add environment variables to `.env.local`
7. [ ] Update Supabase schema with Teli-related columns
8. [ ] Create API route for triggering setup from onboarding form
9. [ ] Add error handling and logging
10. [ ] Test end-to-end flow

---

## Notes

- The `organization_id` is fixed for all businesses using this platform
- Each business gets their own `user`, `phone_number`, and `agent` in Teli
- The `tenantId` maps to the Supabase `business.id` (UUID)
- Extraction fields are fully customizable per business
