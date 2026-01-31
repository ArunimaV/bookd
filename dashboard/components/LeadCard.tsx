import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type { Lead } from "../types";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";

interface LeadCardProps {
  lead: Lead;
  selected: boolean;
  onClick: () => void;
  delay?: number;
}

export function LeadCard({ lead, selected, onClick, delay = 0 }: LeadCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? C.accentLight : C.card,
        border: `1.5px solid ${selected ? C.accent : C.border}`,
        borderRadius: C.radiusSm,
        padding: "14px 16px",
        cursor: "pointer",
        boxShadow: selected ? C.shadowLg : C.shadow,
        transition: "all 0.2s ease",
        animation: `slideUp 0.4s ease ${delay}s both`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={lead.name} size={36} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              {lead.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              {lead.channel === "call"
                ? Icons.phone(C.textMuted, 12)
                : Icons.text(C.textMuted, 12)}
              <span style={{ fontSize: 12, color: C.textMuted }}>{lead.phone}</span>
            </div>
          </div>
        </div>
        <StatusPill status={lead.status} />
      </div>

      {/* Message */}
      <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5, margin: 0 }}>
        "{lead.message}"
      </p>

      {/* AI Reply */}
      {lead.replied && lead.aiReply && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            background: C.blueLight,
            borderRadius: 8,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          {Icons.bot(C.blue, 14)}
          <p
            style={{
              fontSize: 12,
              color: C.blue,
              margin: 0,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            Teli replied: "{lead.aiReply}"
          </p>
        </div>
      )}

      {/* Timestamp */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
        {Icons.clock(C.textMuted, 12)}
        <span style={{ fontSize: 11, color: C.textMuted }}>{lead.time}</span>
      </div>
    </div>
  );
}
