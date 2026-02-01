import { NextRequest, NextResponse } from 'next/server'
import { syncAllOrganizationCalls } from '@/lib/teli'

/**
 * POST /api/teli/sync-all - Sync all organization calls to Supabase
 * 
 * This fetches ALL calls from the Teli organization (is_admin=true),
 * maps each to the correct business via agent_id, and creates/updates
 * customer records in Supabase.
 * 
 * Body (optional):
 *   - since: ISO date string to fetch calls after (e.g., "2024-01-15T00:00:00Z")
 * 
 * Response:
 *   - success: boolean
 *   - totalCalls: number of calls fetched from Teli
 *   - syncedCalls: number successfully synced
 *   - newCustomers: number of new customer records created
 *   - skippedCalls: number skipped (unknown agent)
 *   - duplicateCalls: number already synced (skipped)
 *   - callsByBusiness: breakdown per business
 *   - errors: array of error messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    console.log('[API] Starting full organization sync...')
    
    const result = await syncAllOrganizationCalls({
      since: body.since,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Sync-all API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/teli/sync-all - Health check
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'teli-sync-all',
    description: 'POST to this endpoint to sync all organization calls'
  })
}
