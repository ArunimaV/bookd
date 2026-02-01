# Implementation Plan: Full Organization Call Sync

## Overview

Create a sync function that fetches **all calls from the Teli organization** using `is_admin=true`, then maps each call to the correct business via `agent_id`, and ensures the Supabase `customers` table is up-to-date.

---

## Current State Analysis

### What exists:
- `pullAndSyncCalls()` in `lib/teli.ts` - syncs calls per-business using `is_admin: 'false'`
- `syncCallToSupabase()` - creates/updates customers from individual calls
- `/api/teli/sync` endpoint - triggers sync for a single business
- Businesses have `teli_agent_id` that maps to Teli's `voice_agent_id`

### Key Problem:
The current sync uses `is_admin: 'false'` and only fetches calls for a specific agent. With `is_admin=true`, we get **all** organization calls and must route them to the correct business.

---

## Implementation Steps

### 1. Add New Teli API Function (`lib/teli.ts`)

```typescript
// New function: Fetch ALL calls from the organization
export async function fetchAllOrganizationCalls(
  organizationId: string,
  options?: {
    since?: string;      // start_date filter
    limit?: number;      // default 100, max per page
    direction?: 'inbound' | 'outbound';
    agentId?: string;    // optional filter by specific agent
  }
): Promise<{ success: boolean; calls?: TeliCall[]; error?: string }>
```

**Key differences from existing `fetchTeliCalls`:**
- Uses `is_admin=true` to get all org calls
- Returns calls from ALL agents in the organization
- Supports pagination to handle large call volumes

### 2. Create Business Lookup Map

```typescript
// Build a map of agent_id -> business for fast lookups
async function buildAgentToBusinessMap(): Promise<Map<string, Business>>
```

This pre-fetches all businesses and creates a lookup map:
```
{
  "agent_abc123": { id: "uuid-1", name: "Joe's Barber", ... },
  "agent_xyz789": { id: "uuid-2", name: "Pizza Palace", ... },
}
```

### 3. New Full Sync Function (`lib/teli.ts`)

```typescript
export async function syncAllOrganizationCalls(
  since?: string
): Promise<{
  success: boolean;
  totalCalls: number;
  syncedCalls: number;
  newCustomers: number;
  skippedCalls: number;        // calls with unknown agent_id
  callsByBusiness: Record<string, number>;  // breakdown per business
  errors: string[];
}>
```

**Logic:**
1. Fetch all org calls with `is_admin=true`
2. Build agent → business map
3. For each call:
   - Find business by `call.voice_agent_id` or `call.agent_id`
   - If no matching business → log as skipped
   - If found → call existing `syncCallToSupabase(businessId, call)`
4. Return summary stats

### 4. Handle `business_name` in Extracted Fields

The call's `extracted_fields` may include `business_name`. We should:

```typescript
// When syncing a call, verify/inject business_name
if (call.extracted_fields) {
  // Use the business name from our DB, not extracted (more reliable)
  call.extracted_fields.business_name = business.name;
}
```

This ensures `business_name` is always correct even if extraction failed.

### 5. New API Endpoint

**`app/api/teli/sync-all/route.ts`**

```typescript
// POST /api/teli/sync-all - Sync all organization calls
// Query params:
//   - since: ISO date to fetch calls after (optional)
//   - dryRun: if true, just report what would sync (optional)
```

### 6. Comparison/Audit Function

```typescript
export async function auditCallSync(): Promise<{
  teliCallCount: number;
  supabaseCustomerCount: number;
  missingInSupabase: string[];  // call_ids not yet synced
  orphanedCustomers: string[];  // customers with no matching call
}>
```

This helps identify discrepancies between Teli and Supabase.

### 7. UI Button Component

**`dashboard/components/SyncAllButton.tsx`**

```tsx
// Button that triggers full org sync with:
// - Loading state
// - Progress indicator
// - Result summary (toast or modal)
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `lib/teli.ts` | Modify | Add `fetchAllOrganizationCalls()`, `syncAllOrganizationCalls()`, `auditCallSync()` |
| `lib/teli/types.ts` | Modify | Add types for sync results |
| `app/api/teli/sync-all/route.ts` | Create | New endpoint for full org sync |
| `dashboard/components/SyncAllButton.tsx` | Create | UI button component |
| `dashboard/hooks/useSyncAll.ts` | Create | Hook to manage sync state |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Sync All Calls" button                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/teli/sync-all                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  fetchAllOrganizationCalls(orgId, { is_admin: true })           │
│  → Returns ALL calls from Teli API                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  buildAgentToBusinessMap()                                      │
│  → Map<agent_id, business>                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  For each call:                                                 │
│    1. Find business by call.agent_id                            │
│    2. Inject business_name into extracted_fields                │
│    3. syncCallToSupabase(businessId, call)                      │
│       → Creates/updates customer with correct business_id       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return sync summary:                                           │
│    { totalCalls, syncedCalls, newCustomers, callsByBusiness }   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edge Cases to Handle

1. **Unknown agent_id**: Call from an agent not in our system → log and skip
2. **Duplicate calls**: Check if `call_id` already exists to avoid re-processing
3. **Missing phone number**: Some calls may have no `from_number` → skip
4. **Pagination**: Teli limits to 100 calls per request → implement pagination loop
5. **Rate limiting**: Add delay between API calls if hitting rate limits

---

## Schema Consideration

**Resolved**: The actual Supabase column is `phone_number` (code is correct, schema file is outdated).

---

## Questions (Resolved)

1. **Pagination strategy**: 100 calls per request is sufficient for now
2. **Deduplication**: Yes - track synced `call_id`s via `messages.teli_data->call_id`
3. **Schema clarification**: Column is `phone_number` (code is correct)
4. **Frequency**: Manual (button) for now

---

## Status

- [x] Step 1: Add `fetchAllOrganizationCalls()` to `lib/teli.ts`
- [x] Step 2: Add `buildAgentToBusinessMap()` helper
- [x] Step 3: Add `syncAllOrganizationCalls()` main function
- [x] Step 4: Create `/api/teli/sync-all` endpoint
- [ ] Step 5: Add `auditCallSync()` comparison function (optional)
- [x] Step 6: Create UI button component (`SyncAllButton.tsx` + `useSyncAll.ts`)
- [x] Step 7: Test end-to-end flow

## Test Results (Feb 1, 2026)

First sync:
- 13 total calls fetched from Teli
- 5 new calls synced
- 3 new customers created
- 6 duplicates skipped
- 2 skipped (unknown agent_id)

Second sync (deduplication test):
- 13 total calls fetched
- 0 synced (all already exist)
- 11 duplicates correctly skipped
