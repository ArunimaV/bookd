import { NextRequest, NextResponse } from 'next/server'
import { createBusinessWithTeliIds, getBusinessByEmail } from '@/lib/onboarding'
import { setupTeliVoiceAgent } from '@/lib/teli/setup'

// POST /api/onboarding - Create new business and set up Teli voice agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const {
      ownerName,
      ownerEmail,
      orgName,
      areaCode,
      agentNickname,
      startingMessage,
      agentPrompt,
      voiceId,
      customExtractionFields,
    } = body

    if (!ownerEmail || !ownerName || !orgName || !areaCode || !agentNickname || !startingMessage || !agentPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: [
            'ownerName',
            'ownerEmail',
            'orgName',
            'areaCode',
            'agentNickname',
            'startingMessage',
            'agentPrompt',
          ],
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await getBusinessByEmail(ownerEmail)
    if (existing.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'A business with this email already exists',
          existingBusinessId: existing.business.id,
        },
        { status: 409 }
      )
    }

    // Generate a UUID upfront - this will be the business ID
    const businessId = crypto.randomUUID()

    // 1. FIRST: Set up Teli (before creating any Supabase record)
    const teliResult = await setupTeliVoiceAgent({
      tenantId: businessId,
      businessName: orgName,
      ownerName,
      ownerEmail,
      areaCode,
      agentNickname,
      startingMessage,
      agentPrompt,
      voiceId: voiceId || 'openai-Nova',
      customExtractionFields: customExtractionFields || [],
    })

    // If Teli fails, return error - NO Supabase record created
    if (!teliResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Teli setup failed: ${teliResult.error}`,
        },
        { status: 500 }
      )
    }

    // 2. ONLY if Teli succeeds: Create the business in Supabase with Teli IDs
    const businessResult = await createBusinessWithTeliIds({
      id: businessId,
      ownerName,
      ownerEmail,
      orgName,
      areaCode,
      agentNickname,
      startingMessage,
      agentPrompt,
      voiceId: voiceId || 'openai-Nova',
      customExtractionFields: customExtractionFields || [],
      timezone: body.timezone,
      workHours: body.workHours,
      services: body.services,
      // Teli IDs from successful setup
      teliUserId: teliResult.userId!,
      teliPhoneNumber: teliResult.phoneNumber!,
      teliAgentId: teliResult.agentId!,
    })

    if (!businessResult.success) {
      // Teli succeeded but Supabase failed - this is rare but possible
      // At least the user can try again and we won't have orphaned Supabase records
      return NextResponse.json(
        {
          success: false,
          error: `Teli setup succeeded but database save failed: ${businessResult.error}. Your phone number is ${teliResult.phoneNumber}. Please contact support.`,
          teliPhoneNumber: teliResult.phoneNumber,
          teliAgentId: teliResult.agentId,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      business: businessResult.business,
      phoneNumber: teliResult.phoneNumber,
      agentId: teliResult.agentId,
      message: `Successfully created "${orgName}" with phone ${teliResult.phoneNumber}`,
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/onboarding?email=xxx - Check if business exists for email
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email parameter required' },
      { status: 400 }
    )
  }

  const result = await getBusinessByEmail(email)

  if (!result.success) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({
    exists: true,
    business: result.business,
  })
}
