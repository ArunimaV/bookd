// ============================================
// Teli API - Public Exports
// ============================================

// Types
export type {
  TeliApiConfig,
  CreateUserParams,
  TeliUser,
  CreatePhoneNumberParams,
  TeliPhoneNumber,
  CreateVoiceAgentParams,
  TeliVoiceAgent,
  AttachAgentParams,
  TeliApiResponse,
  BusinessOnboardingData,
  SetupResult,
} from './types';

// Config
export { TELI_API_URL, TELI_API_KEY, ORGANIZATION_ID, getHeaders } from './config';

// Core API Functions
export { createUser, createPhoneNumber, createVoiceAgent, attachAgentToPhone } from './api';

// Full Setup Flow
export { setupTeliVoiceAgent, setupBusinessVoiceAgent } from './setup';
export type { TeliSetupData } from './setup';
