import React, { useState } from "react";
import { C } from "../theme";
import { AgentEditModal } from "../components/AgentEditModal";

interface YourAgentTabProps {
  business: any;
  onBusinessUpdate: (updatedBusiness: any) => void;
}

const VOICE_OPTIONS = [
  { id: "openai-Nova", name: "Nova", desc: "Warm, clear, easy to listen to" },
  { id: "openai-Shimmer", name: "Shimmer", desc: "Soft, polished, calm" },
  { id: "cartesia-Evie", name: "Evie", desc: "Light, friendly, pleasant" },
  { id: "cartesia-Victoria", name: "Victoria", desc: "Clear, professional" },
];

function getVoiceName(voiceId: string): string {
  const voice = VOICE_OPTIONS.find((v) => v.id === voiceId);
  return voice ? `${voice.name} - ${voice.desc}` : voiceId || "Not set";
}

export function YourAgentTab({ business, onBusinessUpdate }: YourAgentTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedBusiness: any) => {
    onBusinessUpdate(updatedBusiness);
    setIsEditing(false);
  };

  const extractionFields = business?.custom_fields?.extraction_fields || [];

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 15,
    color: C.text,
    lineHeight: 1.5,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Main Card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          boxShadow: C.shadow,
          padding: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: C.heading,
                fontSize: 24,
                fontWeight: 700,
                color: C.text,
                margin: 0,
              }}
            >
              Your AI Agent
            </h2>
            <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
              View and manage your AI receptionist configuration
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              background: C.accent,
              color: "#fff",
              border: "none",
              borderRadius: C.radiusSm,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Agent Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32,
          }}
        >
          {/* Left Column */}
          <div>
            {/* Agent Nickname */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Agent Name</div>
              <div style={{ ...valueStyle, fontSize: 18, fontWeight: 600 }}>
                {business?.agent_nickname || "Not set"}
              </div>
            </div>

            {/* Voice */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Voice</div>
              <div style={valueStyle}>{getVoiceName(business?.voice_id)}</div>
            </div>

            {/* Phone Number */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Phone Number</div>
              <div
                style={{
                  ...valueStyle,
                  fontFamily: "monospace",
                  fontSize: 16,
                  background: C.bg,
                  padding: "8px 12px",
                  borderRadius: 6,
                  display: "inline-block",
                }}
              >
                {business?.teli_phone_number || "Not provisioned"}
              </div>
            </div>

            {/* Custom Extraction Fields */}
            <div style={{ marginBottom: 24 }}>
              <div style={labelStyle}>Custom Extraction Fields</div>
              {extractionFields.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {extractionFields.map((field: string) => (
                    <span
                      key={field}
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        fontFamily: C.body,
                        background: C.accentLight,
                        color: C.accent,
                        borderRadius: 20,
                      }}
                    >
                      {field.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ ...valueStyle, color: C.textMuted, fontStyle: "italic" }}>
                  No custom fields configured
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Starting Message */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Starting Message</div>
              <div
                style={{
                  ...valueStyle,
                  background: C.bg,
                  padding: 16,
                  borderRadius: C.radiusSm,
                  border: `1px solid ${C.border}`,
                  whiteSpace: "pre-wrap",
                }}
              >
                {business?.starting_message || "Not set"}
              </div>
            </div>

            {/* Agent Instructions */}
            <div>
              <div style={labelStyle}>Agent Instructions</div>
              <div
                style={{
                  ...valueStyle,
                  background: C.bg,
                  padding: 16,
                  borderRadius: C.radiusSm,
                  border: `1px solid ${C.border}`,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {business?.teli_agent_prompt || "Not set"}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div
          style={{
            marginTop: 32,
            background: C.blueLight,
            padding: 16,
            borderRadius: C.radiusSm,
          }}
        >
          <p style={{ fontSize: 13, color: C.blue, margin: 0 }}>
            <strong>Note:</strong> Standard extraction fields (first name, last name, phone number,
            appointment time, day, month) are always collected automatically.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <AgentEditModal
          business={business}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
