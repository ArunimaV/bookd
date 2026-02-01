-- Supabase Schema for Teli CRM
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- BUSINESSES TABLE (businesses ARE the users)
-- ============================================
create table if not exists businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique,  -- The business owner's unique identifier
  created_at timestamptz default now(),
  name text not null,            -- Display name (e.g., "Bloom Studio")
  business_name text not null,   -- URL-safe slug (e.g., "bloom-studio")
  owner_email text not null unique,
  login_phone_number text,
  teli_agent_id text,
  google_calendar_id text,
  work_hours jsonb default '{
    "monday": {"start": "09:00", "end": "17:00"},
    "tuesday": {"start": "09:00", "end": "17:00"},
    "wednesday": {"start": "09:00", "end": "17:00"},
    "thursday": {"start": "09:00", "end": "17:00"},
    "friday": {"start": "09:00", "end": "17:00"},
    "saturday": null,
    "sunday": null
  }'::jsonb,
  services jsonb default '[
    {"name": "Haircut", "duration": 30, "price": 35},
    {"name": "Beard Trim", "duration": 15, "price": 15},
    {"name": "Hair Coloring", "duration": 90, "price": 85}
  ]'::jsonb,
  timezone text default 'America/New_York'
);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  phone text not null,
  email text,
  notes text,
  last_appointment timestamptz,
  -- JSONB column for business-specific custom fields
  -- e.g., barbershop: {"hair_style": "fade", "barber": "no preference"}
  -- e.g., dentist: {"procedure_type": "cleaning", "insurance_provider": "Blue Cross"}
  custom_fields jsonb default '{}'::jsonb,

  -- Ensure unique phone per business
  unique(business_id, phone)
);

-- Index for fast phone lookups
create index if not exists idx_customers_phone on customers(business_id, phone);

-- Index for querying custom fields (GIN index for JSONB)
create index if not exists idx_customers_custom_fields on customers using gin(custom_fields);

-- ============================================
-- CUSTOM FIELD DEFINITIONS TABLE
-- Tells the UI what custom fields exist for each business
-- ============================================
create table if not exists custom_field_definitions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade not null,
  field_name text not null,      -- Key in JSONB (e.g., "hair_style")
  field_label text not null,     -- Display label (e.g., "Hair Style")
  field_type text not null default 'text' check (field_type in ('text', 'select', 'number', 'boolean')),
  field_options jsonb,           -- For select type: ["fade", "taper", "buzz"]
  display_order int default 0,   -- For ordering in UI

  unique(business_id, field_name)
);

create index if not exists idx_custom_field_definitions_business on custom_field_definitions(business_id);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  service_type text not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  google_event_id text,
  notes text
);

-- Index for calendar queries
create index if not exists idx_appointments_time on appointments(business_id, start_time);
create index if not exists idx_appointments_customer on appointments(customer_id);

-- ============================================
-- MESSAGES TABLE (SMS/Call history)
-- ============================================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  channel text not null check (channel in ('sms', 'call')),
  content text not null,
  teli_data jsonb
);

-- Index for message history
create index if not exists idx_messages_customer on messages(customer_id, created_at desc);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table businesses enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table messages enable row level security;
alter table custom_field_definitions enable row level security;

-- For hackathon: Allow all operations (you'd scope this to auth.uid() in production)
-- This allows the service role key to work for webhooks

create policy "Allow all for service role" on businesses for all using (true);
create policy "Allow all for service role" on customers for all using (true);
create policy "Allow all for service role" on appointments for all using (true);
create policy "Allow all for service role" on messages for all using (true);
create policy "Allow all for service role" on custom_field_definitions for all using (true);

-- ============================================
-- DEMO DATA (Optional)
-- ============================================

-- Insert a demo business
insert into businesses (name, owner_email, teli_phone_number)
values ('Bloom Studio', 'demo@bloom.studio', '+15551234567')
on conflict (owner_email) do nothing;
