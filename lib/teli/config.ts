// ============================================
// Teli API Configuration
// ============================================

export const TELI_API_URL = process.env.TELI_API_URL || 'https://teli-hackathon--transfer-message-service-fastapi-app.modal.run';
export const TELI_API_KEY = process.env.TELI_API_KEY!;

// Fixed organization ID for all businesses on this platform
export const ORGANIZATION_ID = '1769896006541x692178929745735640';

// Default headers for all Teli API requests
export function getHeaders(): HeadersInit {
  return {
    'X-API-Key': TELI_API_KEY,
    'Content-Type': 'application/json',
  };
}
