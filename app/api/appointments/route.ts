import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/appointments - List appointments
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const businessId = searchParams.get("business_id");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  let query = supabase
    .from("appointments")
    .select(`
      *,
      customer:customers(id, name, phone, email)
    `)
    .order("start_time", { ascending: true });

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  if (startDate) {
    query = query.gte("start_time", startDate);
  }

  if (endDate) {
    query = query.lte("start_time", endDate);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/appointments - Create appointment
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("appointments")
    .insert(body)
    .select(`
      *,
      customer:customers(id, name, phone, email)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/appointments - Update appointment
export async function PATCH(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing appointment id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
