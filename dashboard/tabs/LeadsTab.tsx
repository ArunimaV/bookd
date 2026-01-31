import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type { Lead, LeadStatus } from "../types";
import { Avatar } from "../components/Avatar";
import { StatusPill } from "../components/StatusPill";

interface LeadsTabProps {
  leads: Lead[];
}

const STATUS_PRIORITY: Record<LeadStatus, number> = {
  urgent: 0,
  new: 1,
  in_progress: 2,
  handled: 3,
};

function sortLeadsByPriority(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    return (STATUS_PRIORITY[a.status] ?? 4) - (STATUS_PRIORITY[b.status] ?? 4);
  });
}

interface LeadCardFullProps {
  lead: Lead;
  index: number;
}

function LeadCardFull({ lead, index }: LeadCardFullProps) {
  const isUrgent = lead.status === "urgent";

  return (
    <div
      style={{
        background: C.card,
        border: `1.5px solid ${isUrgent ? C.red + "40" : C.border}`,
        borderRadius: C.radius,
        padding: 18,
        boxShadow: C.shadow,
        animation: `slideUp 0.4s ease ${index * 0.06}s both`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Avatar name={lead.name} size={40} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {lead.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {lead.channel === "call"
                ? Icons.phone(C.textMuted, 12)
                : Icons.text(C.textMuted, 12)}
              {lead.phone}
            </div>
          </div>
        </div>
        <StatusPill status={lead.status} />
      </div>

      {/* Message */}
      <p
        style={{
          fontSize: 13,
          color: C.textSoft,
          lineHeight: 1.5,
          margin: "0 0 10px 0",
        }}
      >
        "{lead.message}"
      </p>

      {/* AI Reply */}
      {lead.replied && lead.aiReply && (
        <div
          style={{
            padding: "8px 10px",
            background: C.blueLight,
            borderRadius: 8,
            marginBottom: 10,
            display: "flex",
            gap: 6,
            alignItems: "flex-start",
          }}
        >
          {Icons.bot(C.blue, 14)}
          <p style={{ fontSize: 12, color: C.blue, margin: 0, lineHeight: 1.4 }}>
            Teli: "{lead.aiReply}"
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: C.textMuted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {Icons.clock(C.textMuted, 12)} {lead.time}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: C.accent,
              color: "#FFF",
              border: "none",
              cursor: "pointer",
              fontFamily: C.body,
            }}
          >
            Reply
          </button>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: C.greenLight,
              color: C.greenDark,
              border: "none",
              cursor: "pointer",
              fontFamily: C.body,
            }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeadsTab({ leads }: LeadsTabProps) {
  const sortedLeads = sortLeadsByPriority(leads);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <h2
        style={{
          fontSize: 22,
          fontFamily: C.heading,
          fontWeight: 700,
          color: C.text,
          margin: "0 0 16px 0",
        }}
      >
        All Leads
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 12,
        }}
      >
        {sortedLeads.map((lead, index) => (
          <LeadCardFull key={lead.id} lead={lead} index={index} />
        ))}
      </div>
    </div>
  );
}
