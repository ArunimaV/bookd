import React, { useState } from "react";
import { C } from "../theme";
import type { Lead, InboxFilter } from "../types";
import { LeadCard } from "../components/LeadCard";
import { LeadDetail } from "../components/LeadDetail";

interface InboxTabProps {
  leads: Lead[];
}

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "replied", label: "AI Replied" },
  { key: "urgent", label: "Needs You" },
] as const;

function filterLeads(leads: Lead[], filter: InboxFilter): Lead[] {
  switch (filter) {
    case "new":
      return leads.filter((l) => l.status === "new" || l.status === "urgent");
    case "replied":
      return leads.filter((l) => l.replied);
    case "urgent":
      return leads.filter((l) => l.status === "urgent");
    default:
      return leads;
  }
}

export function InboxTab({ leads }: InboxTabProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");

  const filteredLeads = filterLeads(leads, filter);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: 16,
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Lead List */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          overflow: "hidden",
          boxShadow: C.shadow,
        }}
      >
        {/* Filter Bar */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 4 }}>
            {FILTER_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  background: filter === key ? C.accentLight : "transparent",
                  color: filter === key ? C.accent : C.textMuted,
                  fontFamily: C.body,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Cards */}
        <div
          style={{
            maxHeight: 520,
            overflowY: "auto",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {filteredLeads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selected={selectedLead?.id === lead.id}
              onClick={() => setSelectedLead(lead)}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>

      {/* Lead Detail Panel */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          boxShadow: C.shadow,
          minHeight: 480,
        }}
      >
        <LeadDetail lead={selectedLead} />
      </div>
    </div>
  );
}
