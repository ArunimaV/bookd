import { NextRequest, NextResponse } from 'next/server'
import { getRecentCustomers, getCustomersSince, processCallAndStoreCustomer, TeliCallData } from '@/lib/calls'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/calls - Get recent customers/calls for a business
 * Query params:
 *   - business_id: required
 *   - since: optional timestamp to get only new customers
 *   - limit: optional number of results (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('business_id')
    const since = searchParams.get('since')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'business_id is required' },
        { status: 400 }
      )
    }

    // If 'since' is provided, get only customers created after that timestamp
    if (since) {
      const result = await getCustomersSince(businessId, since)
      return NextResponse.json(result)
    }

    // Otherwise get recent customers
    const result = await getRecentCustomers(businessId, limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/calls:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calls - Process a new call and store customer data
 * Body:
 *   - business_id: required
 *   - call_data: TeliCallData object
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_id, call_data } = body

    if (!business_id) {
      return NextResponse.json(
        { success: false, error: 'business_id is required' },
        { status: 400 }
      )
    }

    if (!call_data || !call_data.phone) {
      return NextResponse.json(
        { success: false, error: 'call_data with phone is required' },
        { status: 400 }
      )
    }

    // Process the call and store/update customer
    const result = await processCallAndStoreCustomer(business_id, call_data as TeliCallData)

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      customer: result.customer,
      message: result.customer?.is_new
        ? 'New customer created from call'
        : 'Existing customer updated from call'
    })
  } catch (error) {
    console.error('Error in POST /api/calls:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
