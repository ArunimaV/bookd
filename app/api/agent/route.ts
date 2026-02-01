import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/agent - Get agent/business details for the logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get businessId from query params
    const businessId = request.nextUrl.searchParams.get("businessId");
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required" },
        { status: 400 }
      );
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agent - Update agent configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      businessId,
      agentNickname,
      voiceId,
      startingMessage,
      agentPrompt,
      customExtractionFields,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required" },
        { status: 400 }
      );
    }

    // Prepare update payload
    const updatePayload: Record<string, any> = {};

    if (agentNickname !== undefined) {
      updatePayload.agent_nickname = agentNickname;
    }
    if (voiceId !== undefined) {
      updatePayload.voice_id = voiceId;
    }
    if (startingMessage !== undefined) {
      updatePayload.starting_message = startingMessage;
    }
    if (agentPrompt !== undefined) {
      updatePayload.teli_agent_prompt = agentPrompt;
    }
    if (customExtractionFields !== undefined) {
      // Get existing custom_fields to preserve other data
      const { data: existing } = await supabase
        .from("businesses")
        .select("custom_fields")
        .eq("id", businessId)
        .single();

      updatePayload.custom_fields = {
        ...(existing?.custom_fields || {}),
        extraction_fields: customExtractionFields,
      };
    }

    // Update the business
    const { data: business, error } = await supabase
      .from("businesses")
      .update(updatePayload)
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Note: Teli agent update is not implemented yet
    // In the future, we could call a Teli API to update the agent configuration

    return NextResponse.json({
      success: true,
      business,
      message: "Agent configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
