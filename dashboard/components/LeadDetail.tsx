import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type { Lead } from "../types";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";

interface LeadDetailProps {
  lead: Lead | null;
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: 40,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: C.accentLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {Icons.inbox(C.accent, 28)}
      </div>
      <h3
        style={{
          fontSize: 18,
          fontFamily: C.heading,
          color: C.text,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Select a message
      </h3>
      <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 240 }}>
        Click on any conversation to see the full details and take action.
      </p>
    </div>
  );
}

function DetailHeader({ lead }: { lead: Lead }) {
  return (
    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <Avatar name={lead.name} size={48} />
        <div>
          <h3
            style={{
              fontSize: 18,
              fontFamily: C.heading,
              fontWeight: 700,
              color: C.text,
              margin: 0,
            }}
          >
            {lead.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            {lead.channel === "call"
              ? Icons.phone(C.textMuted, 13)
              : Icons.text(C.textMuted, 13)}
            <span style={{ fontSize: 13, color: C.textMuted }}>{lead.phone}</span>
            <span style={{ margin: "0 4px", color: C.border }}>·</span>
            <StatusPill status={lead.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageThread({ lead }: { lead: Lead }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px 24px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Customer Message */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Avatar name={lead.name} size={30} />
        <div
          style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: "4px 14px 14px 14px",
            padding: "10px 14px",
            maxWidth: "80%",
          }}
        >
          <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.5 }}>
            {lead.message}
          </p>
          <span style={{ fontSize: 11, color: C.textMuted, marginTop: 4, display: "block" }}>
            {lead.time}
          </span>
        </div>
      </div>

      {/* AI Reply */}
      {lead.replied && lead.aiReply && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            flexDirection: "row-reverse",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: C.accentLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {Icons.bot(C.accent, 16)}
          </div>
          <div
            style={{
              background: C.accent,
              borderRadius: "14px 4px 14px 14px",
              padding: "10px 14px",
              maxWidth: "80%",
            }}
          >
            <p style={{ fontSize: 14, color: "#FFF", margin: 0, lineHeight: 1.5 }}>
              {lead.aiReply}
            </p>
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                marginTop: 4,
                display: "block",
              }}
            >
              Teli AI · just now
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBar() {
  return (
    <div
      style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        gap: 8,
      }}
    >
      <button
        style={{
          flex: 1,
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          background: C.accent,
          color: "#FFF",
          border: "none",
          fontFamily: C.body,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {Icons.send("#FFF", 14)} Reply
      </button>
      <button
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          background: C.greenLight,
          color: C.greenDark,
          border: `1px solid ${C.green}30`,
          fontFamily: C.body,
        }}
      >
        Book Appointment
      </button>
      <button
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          background: C.redLight,
          color: C.red,
          border: `1px solid ${C.red}30`,
          fontFamily: C.body,
        }}
      >
        Call Back
      </button>
    </div>
  );
}

export function LeadDetail({ lead }: LeadDetailProps) {
  if (!lead) {
    return <EmptyState />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <DetailHeader lead={lead} />
      <MessageThread lead={lead} />
      <ActionBar />
    </div>
  );
}
