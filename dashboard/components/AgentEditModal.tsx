import React, { useState } from "react";
import { C } from "../theme";

interface AgentEditModalProps {
  business: any;
  onSave: (updatedBusiness: any) => void;
  onCancel: () => void;
}

const VOICE_OPTIONS = [
  { id: "openai-Nova", name: "Nova", desc: "Warm, clear, easy to listen to" },
  { id: "openai-Shimmer", name: "Shimmer", desc: "Soft, polished, calm" },
  { id: "cartesia-Evie", name: "Evie", desc: "Light, friendly, pleasant" },
  { id: "cartesia-Victoria", name: "Victoria", desc: "Clear, professional" },
];

const SUGGESTED_CUSTOM_FIELDS = [
  "service_type",
  "stylist_preference",
  "insurance_provider",
  "party_size",
  "special_requests",
  "urgency",
  "callback_time",
  "referral_source",
];

export function AgentEditModal({ business, onSave, onCancel }: AgentEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newField, setNewField] = useState("");

  const [formData, setFormData] = useState({
    agentNickname: business.agent_nickname || "",
    voiceId: business.voice_id || "openai-Nova",
    startingMessage: business.starting_message || "",
    agentPrompt: business.teli_agent_prompt || "",
    customExtractionFields: business.custom_fields?.extraction_fields || [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const addCustomField = (field: string) => {
    if (field && !formData.customExtractionFields.includes(field)) {
      setFormData({
        ...formData,
        customExtractionFields: [...formData.customExtractionFields, field],
      });
    }
    setNewField("");
  };

  const removeCustomField = (field: string) => {
    setFormData({
      ...formData,
      customExtractionFields: formData.customExtractionFields.filter((f: string) => f !== field),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          agentNickname: formData.agentNickname,
          voiceId: formData.voiceId,
          startingMessage: formData.startingMessage,
          agentPrompt: formData.agentPrompt,
          customExtractionFields: formData.customExtractionFields,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      onSave(data.business);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontSize: 15,
    fontFamily: C.body,
    border: `1px solid ${C.border}`,
    borderRadius: C.radiusSm,
    background: C.card,
    color: C.text,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 120,
    resize: "vertical",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: C.textSoft,
    fontFamily: C.body,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B5D4D' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    paddingRight: 40,
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    fontSize: 13,
    fontFamily: C.body,
    background: C.accentLight,
    color: C.accent,
    borderRadius: 20,
    margin: "4px 4px 4px 0",
  };

  const suggestedChipStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "6px 12px",
    fontSize: 13,
    fontFamily: C.body,
    background: C.bg,
    color: C.textSoft,
    borderRadius: 20,
    margin: "4px 4px 4px 0",
    cursor: "pointer",
    border: `1px solid ${C.border}`,
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(44, 36, 24, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          background: C.card,
          borderRadius: C.radius,
          boxShadow: C.shadowLg,
          padding: "32px 36px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontFamily: C.heading,
              fontSize: 24,
              fontWeight: 700,
              color: C.text,
              margin: 0,
            }}
          >
            Edit Your Agent
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.card,
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

        {/* Error */}
        {error && (
          <div
            style={{
              background: C.redLight,
              color: C.red,
              padding: "12px 16px",
              borderRadius: C.radiusSm,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Agent Nickname */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Agent Nickname</label>
            <input
              type="text"
              name="agentNickname"
              value={formData.agentNickname}
              onChange={handleChange}
              placeholder="Sophie"
              required
              style={inputStyle}
            />
          </div>

          {/* Voice */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Voice</label>
            <select
              name="voiceId"
              value={formData.voiceId}
              onChange={handleChange}
              style={selectStyle}
            >
              {VOICE_OPTIONS.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Starting Message */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Starting Message</label>
            <textarea
              name="startingMessage"
              value={formData.startingMessage}
              onChange={handleChange}
              placeholder="Hi, thanks for calling! How can I help you today?"
              style={textareaStyle}
            />
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
              This is what the AI says when it answers a call
            </p>
          </div>

          {/* Agent Instructions */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Agent Instructions</label>
            <textarea
              name="agentPrompt"
              value={formData.agentPrompt}
              onChange={handleChange}
              placeholder="You are a friendly receptionist..."
              style={{ ...textareaStyle, minHeight: 150 }}
            />
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
              Tell the AI how to behave and what to do
            </p>
          </div>

          {/* Custom Extraction Fields */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Custom Extraction Fields</label>

            {/* Current Fields */}
            {formData.customExtractionFields.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {formData.customExtractionFields.map((field: string) => (
                  <span key={field} style={chipStyle}>
                    {field.replace(/_/g, " ")}
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: C.accent,
                        cursor: "pointer",
                        padding: 0,
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                      onClick={() => removeCustomField(field)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Field */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={newField}
                onChange={(e) => setNewField(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                placeholder="e.g. service_type"
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomField(newField);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addCustomField(newField)}
                disabled={!newField}
                style={{
                  padding: "14px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: C.body,
                  background: newField ? C.accent : C.textMuted,
                  color: "#fff",
                  border: "none",
                  borderRadius: C.radiusSm,
                  cursor: newField ? "pointer" : "not-allowed",
                }}
              >
                Add
              </button>
            </div>

            {/* Suggestions */}
            <div>
              <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Suggestions:</p>
              {SUGGESTED_CUSTOM_FIELDS.filter(
                (f) => !formData.customExtractionFields.includes(f)
              ).map((field) => (
                <button
                  key={field}
                  type="button"
                  style={suggestedChipStyle}
                  onClick={() => addCustomField(field)}
                >
                  + {field.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: C.body,
                background: C.bg,
                color: C.textSoft,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: C.body,
                background: loading ? C.textMuted : C.accent,
                color: "#fff",
                border: "none",
                borderRadius: C.radiusSm,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
