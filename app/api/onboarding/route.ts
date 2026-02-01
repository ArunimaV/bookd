import { NextRequest, NextResponse } from 'next/server'
import { completeOnboarding, getBusinessByEmail } from '@/lib/onboarding'

// POST /api/onboarding - Create new business with user, phone, and agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { ownerEmail, orgName, phoneNumber, voiceAgentId } = body

    if (!ownerEmail || !orgName || !phoneNumber || !voiceAgentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['ownerEmail', 'orgName', 'phoneNumber', 'voiceAgentId']
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
          existingBusinessId: existing.business.id
        },
        { status: 409 }
      )
    }

    // Create the business
    const result = await completeOnboarding({
      ownerEmail,
      orgName,
      phoneNumber,
      voiceAgentId,
      timezone: body.timezone,
      workHours: body.workHours,
      services: body.services,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      business: result.business,
      message: result.message
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
    business: result.business
  })
}
