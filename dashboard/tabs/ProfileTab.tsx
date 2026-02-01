import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";

interface ProfileTabProps {
  business: any;
  user?: any;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: 24,
        boxShadow: C.shadow,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontFamily: C.heading,
          fontWeight: 700,
          color: C.accent,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          margin: "0 0 16px 0",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: value ? C.text : C.textMuted,
          fontFamily: C.body,
        }}
      >
        {value || "Not set"}
      </div>
    </div>
  );
}

export function ProfileTab({ business, user }: ProfileTabProps) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontFamily: C.heading,
            fontWeight: 700,
            color: C.text,
            margin: 0,
          }}
        >
          Your Profile
        </h2>
        <p
          style={{
            fontSize: 14,
            color: C.textSoft,
            margin: "4px 0 0 0",
          }}
        >
          Your account and business details
        </p>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {/* Account Info */}
        <InfoCard title="Account">
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Owner Name" value={business?.owner_name} />
        </InfoCard>

        {/* Business Info */}
        <InfoCard title="Business">
          <InfoRow label="Business Name" value={business?.name} />
          <InfoRow label="Area Code" value={business?.area_code} />
          <InfoRow label="Timezone" value={business?.timezone} />
        </InfoCard>

        {/* Agent Info */}
        <InfoCard title="AI Agent">
          <InfoRow label="Agent Nickname" value={business?.agent_nickname} />
          <InfoRow label="Voice" value={business?.voice_id} />
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                marginBottom: 4,
              }}
            >
              Agent Phone #
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {Icons.phone(C.accent, 16)}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: business?.teli_phone_number ? C.text : C.textMuted,
                  fontFamily: C.body,
                }}
              >
                {business?.teli_phone_number || "Not provisioned"}
              </span>
            </div>
          </div>
        </InfoCard>

        {/* Agent Configuration */}
        <InfoCard title="Agent Configuration">
          <InfoRow label="Starting Message" value={business?.starting_message} />
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                marginBottom: 4,
              }}
            >
              Agent Prompt
            </div>
            <div
              style={{
                fontSize: 14,
                color: business?.agent_prompt ? C.text : C.textMuted,
                fontFamily: C.body,
                lineHeight: 1.5,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm,
                padding: "10px 12px",
                maxHeight: 120,
                overflowY: "auto",
              }}
            >
              {business?.agent_prompt || "Not set"}
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
