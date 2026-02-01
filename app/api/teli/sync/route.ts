import { NextRequest, NextResponse } from 'next/server'
import { pullAndSyncCalls } from '@/lib/teli'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/teli/sync - Pull new calls from Teli and sync to Supabase
 * Body:
 *   - business_id: optional (defaults to first business)
 *   - since: optional timestamp to fetch calls after
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const supabase = createAdminClient()

    // Get business (either specified or first one)
    let businessId = body.business_id
    let agentId = body.agent_id

    if (!businessId || !agentId) {
      // Get the first business
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, teli_agent_id')
        .limit(1)
        .single()

      if (error || !business) {
        return NextResponse.json(
          { success: false, error: 'No business found' },
          { status: 404 }
        )
      }

      businessId = businessId || business.id
      agentId = agentId || business.teli_agent_id
    }

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'No Teli agent ID configured for this business' },
        { status: 400 }
      )
    }

    // Pull and sync calls
    const result = await pullAndSyncCalls(businessId, agentId, body.since)

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      new_customers: result.newCustomers,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/teli/sync - Health check
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'teli-sync' })
}
