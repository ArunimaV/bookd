# Inbox Implementation Plan

> **Status:** Planning  
> **Dependencies:** Merge with main to get colleague's call transcript history code  

---

## Overview

This plan covers two main changes:
1. **Remove the "All Leads" tab** from the dashboard
2. **Display real call transcript history** in the Inbox tab with actual customer information

---

## Part 1: Remove the "All Leads" Tab

### Files to Modify

| File | Changes |
|------|---------|
| `dashboard/types.ts` | Remove `"leads"` from `TabId` union type |
| `dashboard.tsx` | Remove leads from `getTabDefinitions()`, `TAB_TO_URL`, lazy import, and `TabContent` |
| `dashboard/tabs/index.ts` | Remove `LeadsTab` export |
| `app/leads/page.tsx` | Delete this file |
| `dashboard/components/NewCallsNotification.tsx` | Update `onViewAll` redirect (currently goes to `/leads`) |

### Specific Changes

#### `dashboard/types.ts`
```typescript
// Before
export type TabId = "inbox" | "calendar" | "leads" | "business_analytics" | "your_agent";

// After
export type TabId = "inbox" | "calendar" | "business_analytics" | "your_agent";
```

#### `dashboard.tsx`

1. **Remove lazy import** (line 37-39):
```typescript
// DELETE this:
const LeadsTab = lazy(() =>
  import("./dashboard/tabs/LeadsTab").then((m) => ({ default: m.LeadsTab }))
);
```

2. **Remove from `TAB_TO_URL`** (line 133):
```typescript
// DELETE this line:
leads: "/leads",
```

3. **Remove from `getTabDefinitions()`** (lines 82-86):
```typescript
// DELETE this object:
{
  id: "leads",
  label: "All Leads",
  icon: Icons.people,
  count: leads.length,
},
```

4. **Remove from `TabContent`** (line 114):
```typescript
// DELETE this line:
{activeTab === "leads" && <LeadsTab leads={LEADS} />}
```

#### `dashboard/tabs/index.ts`
```typescript
// DELETE this line:
export { LeadsTab } from "./LeadsTab";
```

#### `dashboard/components/NewCallsNotification.tsx`
Update the `onViewAll` handler to redirect to `/inbox` instead of `/leads`:
```typescript
onViewAll={() => {
  router.push("/inbox");  // Changed from "/leads"
  clearNewCustomers();
}}
```

### Optional Cleanup
- Delete `dashboard/tabs/LeadsTab.tsx` entirely, or keep if you may want it later

---

## Part 2: Display Real Call Transcript History in Inbox

This depends on the colleague's code for fetching call transcript history.

### A. Data Layer - New/Modified Types

**File: `dashboard/types.ts`**

Add new types for real customer and call data:

```typescript
export interface Customer {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string | null;
  custom_fields: Record<string, string>;
  created_at: string;
}

export interface CallMessage {
  id: string;
  customer_id: string;
  direction: 'inbound' | 'outbound';
  channel: 'sms' | 'call';
  content: string;  // This can be the transcript
  created_at: string;
  teli_data?: {
    call_id?: string;
    duration?: number;
    status?: string;
    recording_url?: string;
    transcript?: string;
  };
}

export interface InboxConversation {
  customer: Customer;
  messages: CallMessage[];
  lastActivity: string;
  hasUnread: boolean;
}
```

### B. API Layer - Fetch Call History

**New file: `app/api/inbox/route.ts`**

Create an endpoint to fetch customer conversations with transcripts:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/inbox - Get customer conversations with call/message history
 * Query params:
 *   - business_id: required
 *   - limit: optional (default 20)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('business_id');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'business_id is required' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Fetch customers with their messages
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select(`
      *,
      messages (
        id,
        direction,
        channel,
        content,
        created_at,
        teli_data
      )
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (customersError) {
    return NextResponse.json(
      { success: false, error: customersError.message },
      { status: 500 }
    );
  }

  // Transform into InboxConversation format
  const conversations = customers.map((customer: any) => ({
    customer: {
      id: customer.id,
      business_id: customer.business_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone_number: customer.phone_number,
      email: customer.email,
      custom_fields: customer.custom_fields || {},
      created_at: customer.created_at,
    },
    messages: customer.messages || [],
    lastActivity: customer.messages?.[0]?.created_at || customer.created_at,
    hasUnread: false, // TODO: Implement read/unread tracking
  }));

  return NextResponse.json({ success: true, conversations });
}
```

### C. Frontend Hook - Fetch Inbox Data

**New file: `dashboard/hooks/useInboxData.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { InboxConversation } from '../types';

interface UseInboxDataOptions {
  businessId: string | undefined;
  pollInterval?: number;
  enabled?: boolean;
}

export function useInboxData({ 
  businessId, 
  pollInterval = 10000,
  enabled = true 
}: UseInboxDataOptions) {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!businessId || !enabled) return;

    try {
      const response = await fetch(`/api/inbox?business_id=${businessId}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Polling
  useEffect(() => {
    if (!enabled || !businessId) return;

    const interval = setInterval(fetchConversations, pollInterval);
    return () => clearInterval(interval);
  }, [fetchConversations, pollInterval, enabled, businessId]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}
```

### D. Update InboxTab Component

**File: `dashboard/tabs/InboxTab.tsx`**

Update to use real data instead of mock leads:

```typescript
import React, { useState } from "react";
import { C } from "../theme";
import type { InboxConversation, InboxFilter } from "../types";
import { useInboxData } from "../hooks/useInboxData";
// Update LeadCard and LeadDetail to work with InboxConversation

interface InboxTabProps {
  businessId: string | undefined;
}

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "calls", label: "Calls" },
  { key: "sms", label: "SMS" },
  { key: "unread", label: "Unread" },
] as const;

export function InboxTab({ businessId }: InboxTabProps) {
  const { conversations, loading, error } = useInboxData({ businessId });
  const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Filter conversations based on selected filter
  const filteredConversations = conversations.filter((conv) => {
    if (filter === "all") return true;
    if (filter === "calls") return conv.messages.some(m => m.channel === "call");
    if (filter === "sms") return conv.messages.some(m => m.channel === "sms");
    if (filter === "unread") return conv.hasUnread;
    return true;
  });

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // ... rest of component with updated rendering
}
```

### E. Update LeadCard Component

**File: `dashboard/components/LeadCard.tsx`**

Modify to accept `InboxConversation` instead of `Lead`:

```typescript
interface ConversationCardProps {
  conversation: InboxConversation;
  selected: boolean;
  onClick: () => void;
  delay: number;
}

export function ConversationCard({ conversation, selected, onClick, delay }: ConversationCardProps) {
  const { customer, messages, lastActivity } = conversation;
  const latestMessage = messages[0];
  const isCall = latestMessage?.channel === 'call';
  
  return (
    <div onClick={onClick} /* ... styles ... */>
      <Avatar name={`${customer.first_name} ${customer.last_name}`} size={40} />
      <div>
        <div>{customer.first_name} {customer.last_name}</div>
        <div>{customer.phone_number}</div>
        <div>
          {isCall ? Icons.phone() : Icons.text()}
          {latestMessage?.content?.substring(0, 50)}...
        </div>
        <div>{formatTimeAgo(lastActivity)}</div>
      </div>
    </div>
  );
}
```

### F. Update LeadDetail Component

**File: `dashboard/components/LeadDetail.tsx`**

This is where transcripts will be displayed:

```typescript
interface ConversationDetailProps {
  conversation: InboxConversation | null;
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  if (!conversation) {
    return <EmptyState />;
  }

  const { customer, messages } = conversation;

  return (
    <div>
      {/* Header with customer info */}
      <div>
        <h3>{customer.first_name} {customer.last_name}</h3>
        <p>{customer.phone_number}</p>
        {customer.email && <p>{customer.email}</p>}
      </div>

      {/* Message/Transcript thread */}
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            {message.channel === 'call' ? (
              <CallTranscriptBubble message={message} />
            ) : (
              <TextMessageBubble message={message} />
            )}
          </div>
        ))}
      </div>

      {/* Action bar */}
      <ActionBar customer={customer} />
    </div>
  );
}

function CallTranscriptBubble({ message }: { message: CallMessage }) {
  const duration = message.teli_data?.duration;
  const recordingUrl = message.teli_data?.recording_url;
  
  return (
    <div>
      <div>📞 Call - {duration ? `${Math.floor(duration / 60)}:${duration % 60}` : 'Unknown duration'}</div>
      <div>{new Date(message.created_at).toLocaleString()}</div>
      
      {/* Transcript content */}
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {message.content || message.teli_data?.transcript || 'No transcript available'}
      </div>
      
      {/* Recording link if available */}
      {recordingUrl && (
        <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
          🎵 Listen to recording
        </a>
      )}
    </div>
  );
}
```

### G. Update Dashboard.tsx

**File: `dashboard.tsx`**

Pass `businessId` to InboxTab instead of mock `LEADS`:

```typescript
// In TabContent component:
{activeTab === "inbox" && <InboxTab businessId={business?.id} />}
```

---

## Database Reference

Based on the existing schema (`supabase/schema.sql`):

### Relevant Tables

| Table | Purpose |
|-------|---------|
| `customers` | Customer info (name, phone, email, custom_fields) |
| `messages` | Call/SMS history with `teli_data` JSONB containing transcripts |
| `call_extractions` | Additional extracted call data |

### Key Fields for Transcripts

- `messages.content` - Can contain transcript text
- `messages.teli_data` - JSONB with call details including transcript
- `messages.channel` - 'call' or 'sms'
- `messages.direction` - 'inbound' or 'outbound'

---

## Implementation Checklist

### Part 1: Remove Leads Tab ✅ (Can do now)

- [ ] Remove `"leads"` from `TabId` type in `dashboard/types.ts`
- [ ] Remove leads from `getTabDefinitions()` in `dashboard.tsx`
- [ ] Remove leads from `TAB_TO_URL` in `dashboard.tsx`
- [ ] Remove `LeadsTab` lazy import in `dashboard.tsx`
- [ ] Remove `LeadsTab` render in `TabContent` in `dashboard.tsx`
- [ ] Remove `LeadsTab` export from `dashboard/tabs/index.ts`
- [ ] Delete `app/leads/page.tsx`
- [ ] Update `NewCallsNotification` redirect to `/inbox`

### Part 2: Real Transcripts (After merge with main)

- [ ] Add new types (`Customer`, `CallMessage`, `InboxConversation`) to `dashboard/types.ts`
- [ ] Create `/api/inbox` endpoint in `app/api/inbox/route.ts`
- [ ] Create `useInboxData` hook in `dashboard/hooks/useInboxData.ts`
- [ ] Update `InboxTab` to use `businessId` prop and real data
- [ ] Update/rename `LeadCard` to `ConversationCard` for real customer display
- [ ] Update/rename `LeadDetail` to `ConversationDetail` to show transcripts
- [ ] Update `dashboard.tsx` to pass `businessId` to `InboxTab`
- [ ] Remove mock `LEADS` data from `dashboard/data.ts` (or keep for fallback/testing)

---

## Questions for Colleague

1. What format does the call transcript history come in?
2. Is the transcript stored in `messages.content` or `messages.teli_data.transcript`?
3. Are there any new API endpoints or database changes to be aware of?
4. Is there a recording URL available for calls?
