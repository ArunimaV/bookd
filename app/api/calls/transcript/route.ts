import { NextRequest, NextResponse } from "next/server";
import { fetchCallTranscript } from "@/lib/calls";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/calls/transcript?call_id=xxx&customer_id=xxx
 * 
 * Manually fetch transcript for a call and optionally save it to a customer
 */
export async function GET(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("call_id");
  const customerId = request.nextUrl.searchParams.get("customer_id");

  console.log("[GET /api/calls/transcript] call_id:", callId, "customer_id:", customerId);

  if (!callId) {
    return NextResponse.json(
      { success: false, error: "call_id query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the transcript
    console.log("[GET /api/calls/transcript] Fetching transcript...");
    const transcript = await fetchCallTranscript(callId);

    if (!transcript) {
      return NextResponse.json({
        success: false,
        error: "No transcript found for this call_id",
        call_id: callId,
      });
    }

    console.log("[GET /api/calls/transcript] Transcript fetched, length:", transcript.length);

    // If customer_id provided, save to database
    if (customerId) {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("customers")
        .update({ call_transcript: transcript })
        .eq("id", customerId);

      if (error) {
        console.error("[GET /api/calls/transcript] DB update error:", error);
        return NextResponse.json({
          success: false,
          error: `Failed to save transcript: ${error.message}`,
          transcript_preview: transcript.slice(0, 200),
        });
      }

      console.log("[GET /api/calls/transcript] Saved to customer:", customerId);
      return NextResponse.json({
        success: true,
        message: "Transcript fetched and saved to customer",
        customer_id: customerId,
        transcript_length: transcript.length,
        transcript_preview: transcript.slice(0, 200),
      });
    }

    // Just return the transcript
    return NextResponse.json({
      success: true,
      call_id: callId,
      transcript_length: transcript.length,
      transcript: transcript,
    });
  } catch (error) {
    console.error("[GET /api/calls/transcript] Exception:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
