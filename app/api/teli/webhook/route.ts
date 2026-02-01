import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Teli webhook payload structure (adjust based on actual Teli docs)
interface TeliWebhookPayload {
  event_type: "message" | "call" | "booking_intent";
  phone: string;
  message?: string;
  intent?: {
    type: "book" | "reschedule" | "cancel" | "inquiry";
    service?: string;
    preferred_time?: string;
    preferred_date?: string;
  };
  agent_id?: string;
  timestamp: string;
  // Extracted fields from Teli voice agent
  extracted_fields?: Record<string, string>;
}

// Universal fields that get extracted into fixed columns
// Everything else goes into custom_fields JSONB
const UNIVERSAL_FIELDS = [
  'first_name',
  'last_name',
  'appointment_time',
  'day',
  'month',
  'phone',
  'email'
];

// Split extracted fields into universal and custom
function splitExtractedFields(extractedFields: Record<string, string> | undefined) {
  if (!extractedFields) return { universal: {}, custom: {} };

  const universal: Record<string, string> = {};
  const custom: Record<string, string> = {};

  for (const [key, value] of Object.entries(extractedFields)) {
    if (UNIVERSAL_FIELDS.includes(key)) {
      universal[key] = value;
    } else {
      custom[key] = value;
    }
  }

  return { universal, custom };
}

// Parse natural language time to Date
function parsePreferredTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr && !timeStr) return null;

  const now = new Date();
  let targetDate = new Date(now);

  // Parse date
  if (dateStr) {
    const lower = dateStr.toLowerCase();
    if (lower.includes("today")) {
      // keep today
    } else if (lower.includes("tomorrow")) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lower.includes("monday")) {
      targetDate = getNextWeekday(0);
    } else if (lower.includes("tuesday")) {
      targetDate = getNextWeekday(1);
    } else if (lower.includes("wednesday")) {
      targetDate = getNextWeekday(2);
    } else if (lower.includes("thursday")) {
      targetDate = getNextWeekday(3);
    } else if (lower.includes("friday")) {
      targetDate = getNextWeekday(4);
    } else if (lower.includes("saturday")) {
      targetDate = getNextWeekday(5);
    } else if (lower.includes("sunday")) {
      targetDate = getNextWeekday(6);
    }
  }

  // Parse time
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;

      targetDate.setHours(hours, minutes, 0, 0);
    }
  }

  return targetDate;
}

function getNextWeekday(targetDay: number): Date {
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7; // Convert to Monday = 0
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;

  const result = new Date(now);
  result.setDate(result.getDate() + daysUntil);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const payload: TeliWebhookPayload = await request.json();
    const supabase = createAdminClient();

    console.log("Teli webhook received:", payload);

    // Get the business (for hackathon, use first business or match by agent_id)
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .limit(1)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    // Split extracted fields into universal (fixed columns) and custom (JSONB)
    const { universal, custom } = splitExtractedFields(payload.extracted_fields);

    // Find or create customer by phone
    let { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .eq("phone", payload.phone)
      .single();

    if (!customer) {
      // Create new customer with custom fields
      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert({
          business_id: business.id,
          first_name: universal.first_name || "New",
          last_name: universal.last_name || "Customer",
          phone: payload.phone,
          email: universal.email || null,
          custom_fields: custom,
        })
        .select()
        .single();

      if (error) throw error;
      customer = newCustomer;
    } else if (Object.keys(custom).length > 0 || universal.first_name) {
      // Update existing customer's custom fields (merge with existing)
      const existingCustomFields = (customer.custom_fields as Record<string, string>) || {};
      const mergedCustomFields = { ...existingCustomFields, ...custom };

      const { data: updatedCustomer, error } = await supabase
        .from("customers")
        .update({
          first_name: universal.first_name || customer.first_name,
          last_name: universal.last_name || customer.last_name,
          email: universal.email || customer.email,
          custom_fields: mergedCustomFields,
        })
        .eq("id", customer.id)
        .select()
        .single();

      if (error) throw error;
      customer = updatedCustomer;
    }

    // Log the message
    if (payload.message) {
      await supabase.from("messages").insert({
        business_id: business.id,
        customer_id: customer.id,
        direction: "inbound",
        channel: payload.event_type === "call" ? "call" : "sms",
        content: payload.message,
        teli_data: payload as any,
      });
    }

    // Handle booking intent
    if (payload.intent?.type === "book") {
      const service = payload.intent.service || "Appointment";
      const preferredTime = parsePreferredTime(
        payload.intent.preferred_date,
        payload.intent.preferred_time
      );

      // Default to tomorrow 10am if no time specified
      const startTime = preferredTime || (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        return d;
      })();

      // Get service duration (default 30 min)
      const services = business.services as any[];
      const serviceInfo = services?.find(
        (s) => s.name.toLowerCase() === service.toLowerCase()
      );
      const duration = serviceInfo?.duration || 30;

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("business_id", business.id)
        .neq("status", "cancelled")
        .lt("start_time", endTime.toISOString())
        .gt("end_time", startTime.toISOString());

      if (conflicts && conflicts.length > 0) {
        // Find next available slot (simplified)
        startTime.setMinutes(startTime.getMinutes() + 30);
        endTime.setMinutes(endTime.getMinutes() + 30);
      }

      // Create the appointment
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert({
          business_id: business.id,
          customer_id: customer.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          service_type: service,
          status: "pending",
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Update customer's last appointment
      await supabase
        .from("customers")
        .update({ last_appointment: startTime.toISOString() })
        .eq("id", customer.id);

      // Log outbound confirmation (Teli will actually send this)
      const confirmationMsg = `Great! I've booked your ${service} for ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. See you then!`;

      await supabase.from("messages").insert({
        business_id: business.id,
        customer_id: customer.id,
        direction: "outbound",
        channel: "sms",
        content: confirmationMsg,
      });

      return NextResponse.json({
        success: true,
        action: "booked",
        appointment: {
          id: appointment.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          service: service,
        },
        confirmation_message: confirmationMsg,
      });
    }

    return NextResponse.json({
      success: true,
      action: "logged",
      customer_id: customer.id,
    });
  } catch (error: any) {
    console.error("Teli webhook error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || String(error),
        code: error?.code,
        hint: error?.hint
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "teli-webhook" });
}
