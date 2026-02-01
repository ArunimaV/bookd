# Calendar Cards Implementation Plan

> **Status:** Planning  
> **Related:** Calendar Tab, Customers API, Sync functionality

---

## Overview

This plan covers three main objectives:
1. **Remove mock data** currently hardcoded in `dashboard/data.ts` and replace with real Supabase data
2. **Sync customers from Supabase** when clicking the "Sync Now" button, filtering by matching `business_name` column
3. **Clickable customer cards** on the calendar that display a popup modal with customer details and custom_fields answers

---

## Current State Analysis

### Mock Data to Remove

**File: `dashboard/data.ts`** contains hardcoded mock data that must be replaced:

| Export | Description | Replacement |
|--------|-------------|-------------|
| `LEADS` | 6 fake lead entries | Fetch from `customers` table |
| `APPOINTMENTS` | 10 fake appointments | Fetch from `appointments` table |
| `EMPLOYEES` | 3 fake employee names | Fetch from business settings or remove |
| `BUSINESS_ANALYTICS` | Fake stats | Calculate from real data |
| `WEEKLY_STATS` | Fake weekly numbers | Calculate from real data |

**Current usage in `dashboard.tsx`:**
```typescript
// These imports need to be replaced with real data fetching:
import { LEADS, APPOINTMENTS, WEEKLY_STATS, EMPLOYEES, BUSINESS_ANALYTICS } from "./dashboard/data";
```

### Existing Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CalendarTab` | `dashboard/tabs/CalendarTab.tsx` | Displays weekly/daily calendar with appointments |
| `SyncButton` | `dashboard/components/SyncButton.tsx` | Triggers sync from Teli API |
| `useTeliSync` | `dashboard/hooks/useTeliSync.ts` | Hook for syncing calls from Teli |
| `/api/customers` | `app/api/customers/route.ts` | CRUD operations for customers |
| `/api/teli/sync` | `app/api/teli/sync/route.ts` | Sync calls from Teli to Supabase |

### Database Schema (Current State)

**businesses table:**
```sql
- id uuid
- user_id uuid
- name text              -- Display name (e.g., "Bloom Studio")
- business_name text     -- URL-safe slug (e.g., "bloom-studio")
- owner_email text
- ...
```

**customers table (CURRENT - needs migration):**
```sql
- id uuid
- created_at timestamptz
- business_id uuid       -- FK to businesses(id)
- name text
- phone text
- email text
- notes text
- last_appointment timestamptz
- custom_fields jsonb
```

**⚠️ Problem:** The `customers` table currently uses `business_id` (UUID FK) but we need to match by `business_name` (text slug).

**custom_field_definitions table:**
```sql
- id uuid
- business_id uuid
- field_name text        -- Key in JSONB (e.g., "hair_style")
- field_label text       -- Display label (e.g., "Hair Style")
- field_type text        -- 'text', 'select', 'number', 'boolean'
- field_options jsonb    -- For select type: ["fade", "taper", "buzz"]
- display_order int
```

### Current Data Flow

1. User clicks "Sync Now" → `useTeliSync.syncNow()` → `/api/teli/sync` POST
2. API pulls calls from Teli, creates customers in `customers` table
3. Currently customers are linked via `business_id` (FK relationship)
4. **Calendar still displays mock `APPOINTMENTS` data, not real customers**

---

## Part 0: Remove Mock Data

### Files to Modify

| File | Change |
|------|--------|
| `dashboard.tsx` | Remove imports from `data.ts`, use hooks for real data |
| `dashboard/data.ts` | Delete file entirely OR keep only type examples |

### Steps

1. Create hooks to fetch real data from Supabase
2. Replace `APPOINTMENTS` with data from `appointments` table
3. Replace `LEADS` with data from `customers` table  
4. Calculate `WEEKLY_STATS` and `BUSINESS_ANALYTICS` from real data
5. Remove or deprecate `dashboard/data.ts`

---

## Part 1: Fetch Customers by Business Name

### Problem Statement

The user wants to fetch customers that match the logged-in business's `business_name`. Currently, customers are linked via `business_id` (UUID foreign key), but we need to support matching by `business_name` text column.

### Required Approach: Add `business_name` Column

Since the requirement is to match customers by `business_name`, we need to:
1. Add a `business_name` column to the `customers` table
2. Update the sync process to populate this column
3. Query customers by matching `business_name`

### Schema Migration

**Run this SQL in Supabase SQL Editor:**

```sql
-- Add business_name column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS business_name text;

-- Create index for fast lookups by business_name
CREATE INDEX IF NOT EXISTS idx_customers_business_name 
ON customers(business_name);

-- Optional: Backfill existing customers with business_name from their business
UPDATE customers c
SET business_name = b.business_name
FROM businesses b
WHERE c.business_id = b.id
AND c.business_name IS NULL;
```

### Updated Customers Table Schema

```sql
-- customers table (AFTER migration)
- id uuid
- created_at timestamptz
- business_id uuid          -- FK to businesses(id) - keep for referential integrity
- business_name text        -- NEW: Slug for matching (e.g., "bloom-studio")
- name text
- phone text
- email text
- notes text
- last_appointment timestamptz
- custom_fields jsonb
```

### Implementation Steps

#### 1. Update Customers API to Support business_name Query

**File: `app/api/customers/route.ts`**

Update the GET endpoint to support querying by `business_name`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const businessId = searchParams.get("business_id");
  const businessName = searchParams.get("business_name"); // NEW: Support business_name
  const search = searchParams.get("search");

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  // Filter by business_name (preferred) or business_id
  if (businessName) {
    query = query.eq("business_name", businessName);
  } else if (businessId) {
    query = query.eq("business_id", businessId);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

#### 2. Update Teli Sync to Populate business_name

**File: `lib/teli.ts`** (or wherever `pullAndSyncCalls` is defined)

When creating/updating customers during sync, include the `business_name`:

```typescript
// When inserting a new customer during sync:
const { data: business } = await supabase
  .from("businesses")
  .select("id, business_name")
  .eq("id", businessId)
  .single();

const customerData = {
  business_id: businessId,
  business_name: business.business_name, // NEW: Include business_name
  name: extractedName,
  phone: phoneNumber,
  // ... other fields
};
```

#### 3. Create Customer Fetch Hook (using business_name)

**New file: `dashboard/hooks/useCustomers.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';

export interface Customer {
  id: string;
  business_id: string;
  business_name: string;  // NEW: Added business_name
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  last_appointment: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
}

interface UseCustomersOptions {
  businessName: string | undefined;  // CHANGED: Use businessName instead of businessId
  enabled?: boolean;
}

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch customers from Supabase by business_name
 */
export function useCustomers({ 
  businessName,  // Match by business_name column
  enabled = true 
}: UseCustomersOptions): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!businessName || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Query by business_name instead of business_id
      const response = await fetch(`/api/customers?business_name=${encodeURIComponent(businessName)}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setCustomers(data);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [businessName, enabled]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
  };
}
```

#### 2. Update Sync Flow to Refetch Customers

**File: `dashboard.tsx`**

Add customer fetching that refreshes after sync:

```typescript
// Add to imports
import { useCustomers } from "./dashboard/hooks/useCustomers";

// Inside App component, after useTeliSync:
const { customers, loading: customersLoading, refetch: refetchCustomers } = useCustomers({
  businessId: business?.id,
  enabled: !!business,
});

// Update handleSyncNow to refetch customers:
const handleSyncNow = async () => {
  await syncNow();
  refetchCustomers(); // This already exists but ensure customers are also refetched
};
```

#### 3. Pass Customers to CalendarTab

**File: `dashboard.tsx`**

Update TabContent to pass customers:

```typescript
// In TabContent:
{activeTab === "calendar" && (
  <CalendarTab 
    appointments={APPOINTMENTS} 
    customers={customers}
    agentPhoneNumber={business?.teli_phone_number || null} 
  />
)}
```

---

## Part 2: Customer Cards on Calendar

### Design Overview

Display customer cards in a sidebar or section on the calendar page. Each card shows:
- Customer name
- Phone number
- Last appointment date
- Click to view full details

### Implementation Steps

#### 1. Update CalendarTab Props

**File: `dashboard/tabs/CalendarTab.tsx`**

```typescript
import type { Customer } from "../hooks/useCustomers";

interface CalendarTabProps {
  appointments: Appointment[];
  customers?: Customer[];
  agentPhoneNumber?: string | null;
}
```

#### 2. Create CustomerCard Component

**New file: `dashboard/components/CustomerCard.tsx`**

```typescript
import React from "react";
import { C } from "../theme";
import { Avatar } from "./Avatar";
import type { Customer } from "../hooks/useCustomers";

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  delay?: number;
}

export function CustomerCard({ customer, onClick, delay = 0 }: CustomerCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No appointments";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radiusSm,
        cursor: "pointer",
        transition: "all 0.2s",
        animation: `slideUp 0.3s ease ${delay}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.bg;
        e.currentTarget.style.borderColor = C.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.card;
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <Avatar name={customer.name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {customer.name}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft }}>
          {customer.phone}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
          Last visit: {formatDate(customer.last_appointment)}
        </div>
      </div>
    </div>
  );
}
```

#### 3. Create CustomerDetailModal Component

**New file: `dashboard/components/CustomerDetailModal.tsx`**

```typescript
import React, { useEffect, useState } from "react";
import { C } from "../theme";
import { Avatar } from "./Avatar";
import type { Customer } from "../hooks/useCustomers";

interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: string[];
  display_order: number;
}

interface CustomerDetailModalProps {
  customer: Customer | null;
  businessId: string | undefined;
  onClose: () => void;
}

export function CustomerDetailModal({ 
  customer, 
  businessId,
  onClose 
}: CustomerDetailModalProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);

  // Fetch custom field definitions for this business
  useEffect(() => {
    if (!businessId) return;

    const fetchFieldDefinitions = async () => {
      try {
        const response = await fetch(`/api/custom-fields?business_id=${businessId}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setFieldDefinitions(data.sort((a, b) => a.display_order - b.display_order));
        }
      } catch (err) {
        console.error("Failed to fetch field definitions:", err);
      }
    };

    fetchFieldDefinitions();
  }, [businessId]);

  if (!customer) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatFieldValue = (value: any, fieldType: string): string => {
    if (value === null || value === undefined) return "Not provided";
    if (fieldType === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          background: C.card,
          borderRadius: C.radius,
          boxShadow: C.shadowLg,
          zIndex: 1001,
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={customer.name} size={48} />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: C.heading,
                  color: C.text,
                }}
              >
                {customer.name}
              </h2>
              <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2 }}>
                Customer since {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: C.textMuted,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          {/* Contact Info Section */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}
            >
              Contact Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow label="Phone" value={customer.phone} />
              <InfoRow label="Email" value={customer.email || "Not provided"} />
              <InfoRow label="Last Appointment" value={formatDate(customer.last_appointment)} />
            </div>
          </div>

          {/* Notes Section */}
          {customer.notes && (
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 12px 0",
                }}
              >
                Notes
              </h3>
              <div
                style={{
                  padding: "12px 14px",
                  background: C.bg,
                  borderRadius: C.radiusSm,
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.5,
                }}
              >
                {customer.notes}
              </div>
            </div>
          )}

          {/* Custom Fields Section */}
          {Object.keys(customer.custom_fields || {}).length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 12px 0",
                }}
              >
                Additional Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fieldDefinitions.length > 0
                  ? fieldDefinitions.map((fieldDef) => {
                      const value = customer.custom_fields?.[fieldDef.field_name];
                      return (
                        <InfoRow
                          key={fieldDef.id}
                          label={fieldDef.field_label}
                          value={formatFieldValue(value, fieldDef.field_type)}
                        />
                      );
                    })
                  : Object.entries(customer.custom_fields || {}).map(([key, value]) => (
                      <InfoRow
                        key={key}
                        label={formatFieldKey(key)}
                        value={String(value)}
                      />
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "10px 16px",
              background: C.accent,
              color: "#FFF",
              border: "none",
              borderRadius: C.radiusSm,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              cursor: "pointer",
            }}
          >
            Book Appointment
          </button>
          <button
            style={{
              padding: "10px 16px",
              background: C.bg,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              cursor: "pointer",
            }}
          >
            Call
          </button>
          <button
            style={{
              padding: "10px 16px",
              background: C.bg,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              cursor: "pointer",
            }}
          >
            Text
          </button>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        background: C.bg,
        borderRadius: C.radiusSm,
      }}
    >
      <span style={{ fontSize: 13, color: C.textSoft }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value}</span>
    </div>
  );
}

function formatFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
```

#### 4. Create Custom Fields API Endpoint

**New file: `app/api/custom-fields/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/custom-fields - Get custom field definitions for a business
 */
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");

  if (!businessId) {
    return NextResponse.json(
      { error: "business_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

#### 5. Add Customer Sidebar to CalendarTab

**File: `dashboard/tabs/CalendarTab.tsx`**

Add a customers sidebar section:

```typescript
// Add imports
import { CustomerCard } from "../components/CustomerCard";
import { CustomerDetailModal } from "../components/CustomerDetailModal";
import type { Customer } from "../hooks/useCustomers";

// Update interface
interface CalendarTabProps {
  appointments: Appointment[];
  customers?: Customer[];
  businessId?: string;
  agentPhoneNumber?: string | null;
}

// Inside CalendarTab component:
export function CalendarTab({ 
  appointments, 
  customers = [], 
  businessId,
  agentPhoneNumber 
}: CalendarTabProps) {
  // Existing state...
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Main Calendar Section */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Existing calendar content */}
        <CalendarToolbar ... />
        {/* Status Legend */}
        {/* Calendar views */}
      </div>

      {/* Customer Sidebar */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          padding: 16,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: C.heading,
            color: C.text,
            margin: "0 0 16px 0",
          }}
        >
          Customers ({customers.length})
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {customers.length > 0 ? (
            customers.map((customer, index) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={() => setSelectedCustomer(customer)}
                delay={index * 0.05}
              />
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              <div style={{ marginBottom: 8 }}>No customers yet</div>
              <div style={{ fontSize: 12 }}>
                Click "Sync Now" to fetch customers
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          businessId={businessId}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
```

---

## Part 3: Update Dashboard Integration

### File: `dashboard.tsx`

#### 1. Remove Mock Data Imports

```typescript
// REMOVE these imports:
// import { LEADS, APPOINTMENTS, WEEKLY_STATS, EMPLOYEES, BUSINESS_ANALYTICS } from "./dashboard/data";

// ADD these hook imports:
import { useCustomers } from "./dashboard/hooks/useCustomers";
import { useAppointments } from "./dashboard/hooks/useAppointments"; // Create this hook
```

#### 2. Add Customer Hook Usage (with business_name)

```typescript
// Inside App component:

// Fetch customers by business_name (not business_id)
const { 
  customers, 
  loading: customersLoading, 
  refetch: refetchCustomers 
} = useCustomers({
  businessName: business?.business_name,  // Use business_name for matching
  enabled: !!business,
});

// Update handleSyncNow to refetch customers after sync:
const handleSyncNow = async () => {
  await syncNow();
  await refetchCustomers();  // Refresh customer list from Supabase
};

// Update handleSyncAll similarly:
const handleSyncAll = async () => {
  await syncAll();
  await refetchCustomers();
};
```

#### 3. Update TabContent to Use Real Data

```typescript
// Update TabContentProps to include customers
interface TabContentProps {
  activeTab: TabId;
  business?: any;
  customers: Customer[];  // Real customers from Supabase
  appointments: Appointment[];  // Real appointments from Supabase (TODO: create hook)
  onBusinessUpdate?: (business: any) => void;
}

function TabContent({ 
  activeTab, 
  business, 
  customers,
  appointments,
  onBusinessUpdate 
}: TabContentProps): ReactNode {
  return (
    <Suspense fallback={<TabLoadingFallback />}>
      {activeTab === "inbox" && <InboxTab leads={customers} />}  {/* Use real customers */}
      {activeTab === "calendar" && (
        <CalendarTab 
          appointments={appointments}  // Use real appointments
          customers={customers}        // Pass real customers
          businessName={business?.business_name}
          agentPhoneNumber={business?.teli_phone_number || null} 
        />
      )}
      {activeTab === "business_analytics" && (
        <BusinessAnalyticsTab
          analytics={calculateAnalytics(customers, appointments)}  // Calculate from real data
          appointments={appointments}
          employees={business?.employees || []}
        />
      )}
      {/* ... rest of tabs */}
    </Suspense>
  );
}

// Helper to calculate analytics from real data
function calculateAnalytics(customers: Customer[], appointments: Appointment[]): BusinessAnalytics {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return {
    totalClients: customers.length,
    clientsThisWeek: customers.filter(c => new Date(c.created_at) >= weekAgo).length,
    clientsLastWeek: customers.filter(c => {
      const created = new Date(c.created_at);
      return created >= twoWeeksAgo && created < weekAgo;
    }).length,
    cancellationsThisWeek: appointments.filter(a => 
      a.status === 'cancelled' && new Date(a.date) >= weekAgo
    ).length,
  };
}
```

#### 4. Create Appointments Hook (Similar Pattern)

**New file: `dashboard/hooks/useAppointments.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Appointment } from '../types';

interface UseAppointmentsOptions {
  businessName: string | undefined;
  enabled?: boolean;
}

export function useAppointments({ 
  businessName, 
  enabled = true 
}: UseAppointmentsOptions) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!businessName || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/appointments?business_name=${encodeURIComponent(businessName)}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setAppointments(data);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [businessName, enabled]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments };
}
```

---

## File Structure Summary

### Database Changes

| Change | Description |
|--------|-------------|
| `customers` table | Add `business_name` column (text) |
| Index | Add `idx_customers_business_name` index |
| Backfill | Update existing customers with `business_name` from linked business |

### New Files to Create

| File | Purpose |
|------|---------|
| `dashboard/hooks/useCustomers.ts` | Hook to fetch customers by `business_name` |
| `dashboard/hooks/useAppointments.ts` | Hook to fetch real appointments from Supabase |
| `dashboard/components/CustomerCard.tsx` | Clickable customer card component |
| `dashboard/components/CustomerDetailModal.tsx` | Modal showing customer details + custom_fields |
| `app/api/custom-fields/route.ts` | API endpoint for custom field definitions |

### Files to Modify

| File | Changes |
|------|---------|
| `app/api/customers/route.ts` | Add support for `business_name` query parameter |
| `lib/teli.ts` (or sync logic) | Populate `business_name` when creating customers |
| `dashboard/tabs/CalendarTab.tsx` | Add customers sidebar, integrate modal |
| `dashboard.tsx` | Remove mock imports, use real data hooks with `business_name` |
| `dashboard/types.ts` | Add `Customer` type with `business_name` field |
| `dashboard/components/index.ts` | Export new components |
| `dashboard/hooks/index.ts` | Export new hooks |

### Files to Delete/Deprecate

| File | Action |
|------|--------|
| `dashboard/data.ts` | DELETE - Contains mock `LEADS`, `APPOINTMENTS`, etc. |

---

## Implementation Checklist

### Phase 0: Schema Migration & Mock Data Removal
- [ ] Run SQL migration to add `business_name` column to `customers` table
- [ ] Backfill existing customers with `business_name` from their linked business
- [ ] Update Teli sync process to populate `business_name` when creating customers
- [ ] Remove/deprecate `dashboard/data.ts` mock data file
- [ ] Remove mock data imports from `dashboard.tsx`

### Phase 1: Data Layer (Real Data from Supabase)
- [ ] Update `/api/customers` route to support `business_name` query parameter
- [ ] Create `dashboard/hooks/useCustomers.ts` hook (queries by `business_name`)
- [ ] Create `dashboard/hooks/useAppointments.ts` hook (for real appointments)
- [ ] Create `/api/custom-fields` endpoint in `app/api/custom-fields/route.ts`
- [ ] Export hooks from `dashboard/hooks/index.ts`

### Phase 2: UI Components
- [ ] Create `dashboard/components/CustomerCard.tsx`
- [ ] Create `dashboard/components/CustomerDetailModal.tsx`
- [ ] Export components from `dashboard/components/index.ts`

### Phase 3: Integration
- [ ] Update `CalendarTab` props to accept `customers` and `businessName`
- [ ] Add customer sidebar to `CalendarTab`
- [ ] Integrate `CustomerDetailModal` in `CalendarTab`
- [ ] Update `dashboard.tsx` to use `useCustomers` hook with `business_name`
- [ ] Update `dashboard.tsx` to use `useAppointments` hook (replace mock APPOINTMENTS)
- [ ] Pass real customers/appointments to `CalendarTab` in `TabContent`
- [ ] Update sync handlers to refetch customers after sync
- [ ] Update `BusinessAnalyticsTab` to calculate stats from real data

### Phase 4: Polish
- [ ] Add loading state for customers sidebar
- [ ] Add search/filter for customers list
- [ ] Add responsive styles for sidebar (collapse on mobile)
- [ ] Add animations and transitions
- [ ] Handle empty states (no customers yet, sync to get started)

---

## Optional Enhancements (Detailed)

These enhancements build on top of the core implementation to provide a richer user experience.

---

### Enhancement 1: Customer Search & Filter in Sidebar

Add a search input at the top of the customer sidebar to quickly find customers by name, phone, or email.

#### UI Design

```
┌─────────────────────────────────┐
│ Customers (24)                  │
├─────────────────────────────────┤
│ 🔍 Search customers...          │
├─────────────────────────────────┤
│ [Customer Card 1]               │
│ [Customer Card 2]               │
│ [Customer Card 3]               │
│ ...                             │
└─────────────────────────────────┘
```

#### Component: `CustomerSearchInput.tsx`

**New file: `dashboard/components/CustomerSearchInput.tsx`**

```typescript
import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";

interface CustomerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CustomerSearchInput({
  value,
  onChange,
  placeholder = "Search customers...",
}: CustomerSearchInputProps) {
  return (
    <div
      style={{
        position: "relative",
        marginBottom: 12,
      }}
    >
      {/* Search Icon */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        {Icons.search ? Icons.search(C.textMuted, 16) : (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        )}
      </div>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px 10px 38px",
          fontSize: 13,
          fontFamily: C.body,
          border: `1px solid ${C.border}`,
          borderRadius: C.radiusSm,
          background: C.bg,
          color: C.text,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = C.accent;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = C.border;
        }}
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "none",
            background: C.border,
            color: C.textMuted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
```

#### Integration in CalendarTab

Update the customer sidebar in `CalendarTab.tsx`:

```typescript
import { CustomerSearchInput } from "../components/CustomerSearchInput";

// Inside CalendarTab component:
const [searchQuery, setSearchQuery] = useState("");

// Filter customers based on search
const filteredCustomers = useMemo(() => {
  if (!searchQuery.trim()) return customers;
  
  const query = searchQuery.toLowerCase();
  return customers.filter((customer) =>
    customer.name.toLowerCase().includes(query) ||
    customer.phone.includes(query) ||
    (customer.email && customer.email.toLowerCase().includes(query))
  );
}, [customers, searchQuery]);

// In the sidebar JSX:
<div style={{ /* sidebar styles */ }}>
  <h3>Customers ({customers.length})</h3>
  
  {/* Search Input */}
  <CustomerSearchInput
    value={searchQuery}
    onChange={setSearchQuery}
    placeholder="Search by name or phone..."
  />
  
  {/* Show filtered count if different */}
  {searchQuery && filteredCustomers.length !== customers.length && (
    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
      Showing {filteredCustomers.length} of {customers.length}
    </div>
  )}
  
  {/* Customer Cards */}
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {filteredCustomers.map((customer, index) => (
      <CustomerCard
        key={customer.id}
        customer={customer}
        onClick={() => setSelectedCustomer(customer)}
        delay={index * 0.03}
      />
    ))}
    
    {/* No results message */}
    {searchQuery && filteredCustomers.length === 0 && (
      <div style={{ textAlign: "center", padding: 24, color: C.textMuted }}>
        No customers match "{searchQuery}"
      </div>
    )}
  </div>
</div>
```

---

### Enhancement 2: Link Customers to Appointments

Show upcoming appointments for each customer, both on the card preview and in the detail modal. This helps business owners quickly see when a customer is scheduled.

#### Data Structure Enhancement

Add appointment linking by matching customer phone numbers:

```typescript
// Utility function to find customer appointments
function getCustomerAppointments(
  customer: Customer,
  appointments: Appointment[]
): Appointment[] {
  return appointments.filter(
    (apt) => apt.phone === customer.phone
  ).sort((a, b) => 
    new Date(a.date + ' ' + a.time).getTime() - 
    new Date(b.date + ' ' + b.time).getTime()
  );
}

// Get next upcoming appointment
function getNextAppointment(
  customer: Customer,
  appointments: Appointment[]
): Appointment | null {
  const today = new Date();
  const upcoming = getCustomerAppointments(customer, appointments)
    .filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && apt.status !== "cancelled";
    });
  return upcoming[0] || null;
}
```

#### Updated CustomerCard with Appointment Preview

**File: `dashboard/components/CustomerCard.tsx`**

```typescript
import React from "react";
import { C } from "../theme";
import { Avatar } from "./Avatar";
import type { Customer } from "../hooks/useCustomers";
import type { Appointment } from "../types";

interface CustomerCardProps {
  customer: Customer;
  appointments?: Appointment[];
  onClick: () => void;
  delay?: number;
}

export function CustomerCard({ 
  customer, 
  appointments = [],
  onClick, 
  delay = 0 
}: CustomerCardProps) {
  // Find next upcoming appointment for this customer
  const nextAppointment = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        return (
          apt.phone === customer.phone &&
          aptDate >= today &&
          apt.status !== "cancelled"
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [appointments, customer.phone]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No appointments";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radiusSm,
        cursor: "pointer",
        transition: "all 0.2s",
        animation: `slideUp 0.3s ease ${delay}s both`,
      }}
    >
      <Avatar name={customer.name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {customer.name}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft }}>
          {customer.phone}
        </div>
        
        {/* Next Appointment Badge */}
        {nextAppointment ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              padding: "3px 8px",
              background: C.accentLight,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: C.accent,
            }}
          >
            <span>📅</span>
            <span>
              {formatDate(nextAppointment.date)} · {nextAppointment.time}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            No upcoming appointments
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Updated CustomerDetailModal with Appointments Section

Add an appointments section to the modal that shows all scheduled appointments:

```typescript
// Add to CustomerDetailModal props:
interface CustomerDetailModalProps {
  customer: Customer | null;
  businessId: string | undefined;
  appointments?: Appointment[];
  onClose: () => void;
  onBookAppointment?: (customer: Customer) => void;
}

// Add inside the modal content, after Custom Fields section:

{/* Appointments Section */}
<div style={{ marginTop: 24 }}>
  <h3
    style={{
      fontSize: 13,
      fontWeight: 700,
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      margin: "0 0 12px 0",
    }}
  >
    Appointments
  </h3>
  
  {customerAppointments.length > 0 ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {customerAppointments.map((apt) => (
        <AppointmentRow key={apt.id} appointment={apt} />
      ))}
    </div>
  ) : (
    <div
      style={{
        textAlign: "center",
        padding: "20px 16px",
        background: C.bg,
        borderRadius: C.radiusSm,
        color: C.textMuted,
        fontSize: 13,
      }}
    >
      No appointments scheduled
    </div>
  )}
</div>

// Helper component for appointment rows:
function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const isPast = new Date(appointment.date) < new Date();
  const statusColors = {
    confirmed: { bg: C.greenLight, text: C.green },
    pending: { bg: C.yellowLight, text: C.yellow },
    cancelled: { bg: C.redLight, text: C.red },
    reminder_sent: { bg: C.blueLight, text: C.blue },
  };
  const colors = statusColors[appointment.status] || statusColors.pending;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        background: C.bg,
        borderRadius: C.radiusSm,
        opacity: isPast ? 0.6 : 1,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
          {appointment.service}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
          {new Date(appointment.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          at {appointment.time}
        </div>
      </div>
      <div
        style={{
          padding: "4px 10px",
          borderRadius: 12,
          background: colors.bg,
          fontSize: 11,
          fontWeight: 700,
          color: colors.text,
          textTransform: "capitalize",
        }}
      >
        {appointment.status.replace("_", " ")}
      </div>
    </div>
  );
}
```

---

### Enhancement 3: Quick Actions from Modal

Implement functional action buttons in the customer detail modal for common tasks.

#### Action Buttons Implementation

```typescript
interface CustomerDetailModalProps {
  customer: Customer | null;
  businessId: string | undefined;
  appointments?: Appointment[];
  agentPhoneNumber?: string | null;
  onClose: () => void;
  onBookAppointment?: (customer: Customer) => void;
  onCall?: (customer: Customer) => void;
  onText?: (customer: Customer) => void;
}

// Footer Actions with functionality:
<div
  style={{
    display: "flex",
    gap: 12,
    padding: "16px 24px",
    borderTop: `1px solid ${C.border}`,
  }}
>
  {/* Book Appointment Button */}
  <button
    onClick={() => onBookAppointment?.(customer)}
    style={{
      flex: 1,
      padding: "10px 16px",
      background: C.accent,
      color: "#FFF",
      border: "none",
      borderRadius: C.radiusSm,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: C.body,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    }}
  >
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
    Book Appointment
  </button>

  {/* Call Button */}
  <button
    onClick={() => {
      // Option 1: Open phone dialer
      window.open(`tel:${customer.phone}`, "_self");
      
      // Option 2: Trigger Teli call (if API available)
      // onCall?.(customer);
    }}
    title={`Call ${customer.phone}`}
    style={{
      padding: "10px 16px",
      background: C.bg,
      color: C.text,
      border: `1px solid ${C.border}`,
      borderRadius: C.radiusSm,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: C.body,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
    Call
  </button>

  {/* Text Button */}
  <button
    onClick={() => {
      // Open SMS compose
      window.open(`sms:${customer.phone}`, "_self");
      
      // Or trigger custom SMS modal
      // onText?.(customer);
    }}
    title={`Text ${customer.phone}`}
    style={{
      padding: "10px 16px",
      background: C.bg,
      color: C.text,
      border: `1px solid ${C.border}`,
      borderRadius: C.radiusSm,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: C.body,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    Text
  </button>
</div>
```

#### Booking Flow Integration

Create a simple booking modal or redirect to a booking page:

```typescript
// In dashboard.tsx or CalendarTab.tsx:
const [bookingCustomer, setBookingCustomer] = useState<Customer | null>(null);

const handleBookAppointment = (customer: Customer) => {
  // Option 1: Open a booking modal
  setBookingCustomer(customer);
  
  // Option 2: Redirect to booking page with customer pre-filled
  // router.push(`/book?customer_id=${customer.id}`);
  
  // Option 3: Pre-fill appointment form and scroll to it
  // setSelectedDate(new Date());
  // setPrefilledCustomer(customer);
};
```

---

### Enhancement 4: Customer Sort Options

Add a dropdown to sort customers by different criteria.

#### UI Design

```
┌─────────────────────────────────┐
│ Customers (24)     [Sort: ▾]    │
├─────────────────────────────────┤
│ 🔍 Search customers...          │
├─────────────────────────────────┤
│ [Customer Cards sorted...]      │
└─────────────────────────────────┘
```

#### Component: `CustomerSortDropdown.tsx`

**New file: `dashboard/components/CustomerSortDropdown.tsx`**

```typescript
import React, { useState, useRef, useEffect } from "react";
import { C } from "../theme";

export type CustomerSortOption = "recent" | "name" | "created" | "upcoming";

interface CustomerSortDropdownProps {
  value: CustomerSortOption;
  onChange: (value: CustomerSortOption) => void;
}

const SORT_OPTIONS: { value: CustomerSortOption; label: string; description: string }[] = [
  { value: "recent", label: "Recent Activity", description: "Last appointment" },
  { value: "upcoming", label: "Upcoming First", description: "Next appointment soonest" },
  { value: "name", label: "Name A-Z", description: "Alphabetical" },
  { value: "created", label: "Newest First", description: "Date added" },
];

export function CustomerSortDropdown({ value, onChange }: CustomerSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = SORT_OPTIONS.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 10px",
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: C.radiusSm,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: C.body,
          color: C.textSoft,
          cursor: "pointer",
        }}
      >
        <span>{currentOption?.label || "Sort"}</span>
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            minWidth: 180,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.radiusSm,
            boxShadow: C.shadowLg,
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                textAlign: "left",
                background: option.value === value ? C.accentLight : "transparent",
                border: "none",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = C.bg;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  option.value === value ? C.accentLight : "transparent";
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: option.value === value ? C.accent : C.text,
                  fontFamily: C.body,
                }}
              >
                {option.label}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Sorting Logic

```typescript
import type { CustomerSortOption } from "../components/CustomerSortDropdown";

// Inside CalendarTab:
const [sortBy, setSortBy] = useState<CustomerSortOption>("recent");

// Sort customers based on selected option
const sortedCustomers = useMemo(() => {
  const sorted = [...filteredCustomers];
  
  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
    case "created":
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
    case "recent":
      return sorted.sort((a, b) => {
        const aDate = a.last_appointment ? new Date(a.last_appointment).getTime() : 0;
        const bDate = b.last_appointment ? new Date(b.last_appointment).getTime() : 0;
        return bDate - aDate; // Most recent first
      });
      
    case "upcoming":
      // Sort by next upcoming appointment
      return sorted.sort((a, b) => {
        const aNext = getNextAppointment(a, appointments);
        const bNext = getNextAppointment(b, appointments);
        
        // Customers with appointments come first
        if (!aNext && !bNext) return 0;
        if (!aNext) return 1;
        if (!bNext) return -1;
        
        return new Date(aNext.date).getTime() - new Date(bNext.date).getTime();
      });
      
    default:
      return sorted;
  }
}, [filteredCustomers, sortBy, appointments]);

// In the sidebar header:
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  }}
>
  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>
    Customers ({customers.length})
  </h3>
  <CustomerSortDropdown value={sortBy} onChange={setSortBy} />
</div>
```

---

### Enhancement 5: Mobile Responsive Sidebar

Make the customer sidebar collapse into a drawer on mobile devices.

#### Responsive Design Strategy

- **Desktop (≥768px):** Fixed sidebar on the right
- **Mobile (<768px):** Floating button that opens a bottom drawer

#### Component: `CustomerDrawer.tsx`

```typescript
import React from "react";
import { C } from "../theme";
import type { Customer } from "../hooks/useCustomers";
import { CustomerCard } from "./CustomerCard";
import { CustomerSearchInput } from "./CustomerSearchInput";

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerDrawer({
  isOpen,
  onClose,
  customers,
  searchQuery,
  onSearchChange,
  onSelectCustomer,
}: CustomerDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "70vh",
          background: C.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 1000,
          animation: "slideUp 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: C.border,
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 20px 12px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
            Customers ({customers.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: C.bg,
              cursor: "pointer",
              fontSize: 18,
              color: C.textMuted,
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px 0" }}>
          <CustomerSearchInput
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        {/* Customer List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 20px 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {customers.map((customer, index) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={() => {
                  onSelectCustomer(customer);
                  onClose();
                }}
                delay={index * 0.03}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

#### Floating Action Button for Mobile

```typescript
// In CalendarTab, add a floating button for mobile:
const [isMobile, setIsMobile] = useState(false);
const [drawerOpen, setDrawerOpen] = useState(false);

// Detect mobile
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
}, []);

// Render:
return (
  <div style={{ display: "flex", gap: 24 }}>
    {/* Main Calendar */}
    <div style={{ flex: 1 }}>
      {/* Calendar content */}
    </div>

    {/* Desktop Sidebar */}
    {!isMobile && (
      <div style={{ width: 280, flexShrink: 0 }}>
        {/* Sidebar content */}
      </div>
    )}

    {/* Mobile FAB */}
    {isMobile && (
      <button
        onClick={() => setDrawerOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: C.accent,
          color: "#FFF",
          border: "none",
          boxShadow: C.shadowLg,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <span style={{ fontSize: 20 }}>👥</span>
        {customers.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: C.red,
              color: "#FFF",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {customers.length}
          </span>
        )}
      </button>
    )}

    {/* Mobile Drawer */}
    {isMobile && (
      <CustomerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        customers={sortedCustomers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCustomer={setSelectedCustomer}
      />
    )}

    {/* Customer Detail Modal (works on both) */}
    {selectedCustomer && (
      <CustomerDetailModal
        customer={selectedCustomer}
        businessId={businessId}
        appointments={appointments}
        onClose={() => setSelectedCustomer(null)}
      />
    )}
  </div>
);
```

---

## Enhanced Implementation Checklist

### Core Features (Required)
- [ ] Phase 1-3 from main checklist above

### Enhancement 1: Search
- [ ] Create `CustomerSearchInput` component
- [ ] Add search state to `CalendarTab`
- [ ] Implement filtering logic
- [ ] Add "no results" empty state

### Enhancement 2: Link to Appointments
- [ ] Add `appointments` prop to `CustomerCard`
- [ ] Create `getNextAppointment` utility
- [ ] Display appointment badge on cards
- [ ] Add appointments section to modal
- [ ] Create `AppointmentRow` component

### Enhancement 3: Quick Actions
- [ ] Wire up Call button (`tel:` link)
- [ ] Wire up Text button (`sms:` link)
- [ ] Implement booking flow callback
- [ ] Add icons to action buttons

### Enhancement 4: Sorting
- [ ] Create `CustomerSortDropdown` component
- [ ] Add sort state to `CalendarTab`
- [ ] Implement all sort algorithms
- [ ] Add "upcoming" sort with appointment lookup

### Enhancement 5: Mobile Responsive
- [ ] Create `CustomerDrawer` component
- [ ] Add mobile detection hook
- [ ] Implement floating action button
- [ ] Test on various screen sizes

---

## Notes & Considerations

1. **Performance:** For businesses with many customers, consider pagination or virtual scrolling in the sidebar

2. **Real-time Updates:** Consider adding WebSocket or polling to show new customers without manual refresh

3. **Custom Fields Display:** The modal uses `custom_field_definitions` to get proper labels. If definitions don't exist, it falls back to formatting the raw keys

4. **Mobile Responsiveness:** The sidebar should collapse or become a drawer on smaller screens

5. **Accessibility:** Ensure modal can be closed with Escape key and has proper focus management

6. **Sort Persistence:** Consider saving sort preference to localStorage so it persists across sessions

7. **Search Debouncing:** For large customer lists, consider debouncing the search input to prevent excessive filtering
