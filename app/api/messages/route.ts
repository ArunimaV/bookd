import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/messages - List messages
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const businessId = searchParams.get("business_id");
  const customerId = searchParams.get("customer_id");
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = supabase
    .from("messages")
    .select(`
      *,
      customer:customers(id, name, phone)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
