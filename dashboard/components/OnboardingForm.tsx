import React, { useEffect, useState } from "react";
import { C } from "../theme";

interface OnboardingFormProps {
  onComplete: (result: {
    business: any;
    phoneNumber: string;
    agentId: string;
  }) => void;
  userEmail?: string;
  userId?: string;
}

interface FormData {
  // Basic Info
  ownerName: string;
  ownerEmail: string;
  orgName: string;
  // Phone Setup
  areaCode: string;
  // Voice Agent
  agentNickname: string;
  startingMessage: string;
  agentPrompt: string;
  voiceId: string;
  // Custom Extraction Fields
  customExtractionFields: string[];
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

export function OnboardingForm({ onComplete, userEmail, userId }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newField, setNewField] = useState("");

  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    ownerEmail: userEmail || "",
    orgName: "",
    areaCode: "",
    agentNickname: "",
    startingMessage: "",
    agentPrompt: "",
    voiceId: "openai-Nova",
    customExtractionFields: [],
  });

  useEffect(() => {
    if (userEmail && !formData.ownerEmail) {
      setFormData((prev) => ({ ...prev, ownerEmail: userEmail }));
    }
  }, [userEmail, formData.ownerEmail]);

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
      customExtractionFields: formData.customExtractionFields.filter((f) => f !== field),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          orgName: formData.orgName,
          areaCode: formData.areaCode,
          agentNickname: formData.agentNickname,
          startingMessage: formData.startingMessage,
          agentPrompt: formData.agentPrompt,
          voiceId: formData.voiceId,
          customExtractionFields: formData.customExtractionFields,
          userId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      onComplete({
        business: data.business,
        phoneNumber: data.phoneNumber,
        agentId: data.agentId,
      });
    } catch (err) {
      setError("Failed to connect. Please try again.");
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.ownerName && formData.ownerEmail && formData.orgName;
      case 2:
        return formData.areaCode.length === 3;
      case 3:
        return formData.agentNickname && formData.startingMessage && formData.agentPrompt && formData.voiceId;
      case 4:
        return true; // Custom fields are optional
      default:
        return false;
    }
  };

  // Styles
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 style={{ ...labelStyle, fontSize: 18, marginBottom: 20, color: C.text }}>
              Tell us about yourself
            </h2>
            <div style={fieldStyle}>
              <label style={labelStyle}>Your Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="John Smith"
                required
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Your Email</label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Business Name</label>
              <input
                type="text"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                placeholder="Best Barbers"
                required
                style={inputStyle}
              />
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                This will be used as your AI agent&apos;s name
              </p>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h2 style={{ ...labelStyle, fontSize: 18, marginBottom: 20, color: C.text }}>
              Set up your phone number
            </h2>
            <div style={fieldStyle}>
              <label style={labelStyle}>Area Code</label>
              <input
                type="text"
                name="areaCode"
                value={formData.areaCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setFormData({ ...formData, areaCode: value });
                }}
                placeholder="313"
                maxLength={3}
                required
                style={{ ...inputStyle, maxWidth: 120 }}
              />
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                We&apos;ll provision a phone number in this area code for your business
              </p>
            </div>
            <div
              style={{
                background: C.blueLight,
                padding: 16,
                borderRadius: C.radiusSm,
                marginTop: 20,
              }}
            >
              <p style={{ fontSize: 14, color: C.blue, margin: 0 }}>
                <strong>Tip:</strong> Choose an area code local to your business for better
                customer trust.
              </p>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 style={{ ...labelStyle, fontSize: 18, marginBottom: 20, color: C.text }}>
              Configure your AI voice agent
            </h2>
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
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                This is what your AI assistant will identify as (e.g., &quot;Hi, I&apos;m Sophie!&quot;)
              </p>
            </div>
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
            <div style={fieldStyle}>
              <label style={labelStyle}>Starting Message</label>
              <textarea
                name="startingMessage"
                value={formData.startingMessage}
                onChange={handleChange}
                placeholder="Hi, thanks for calling Best Barbers! How can I help you today?"
                style={textareaStyle}
              />
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                This is what the AI says when it answers a call
              </p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Agent Instructions</label>
              <textarea
                name="agentPrompt"
                value={formData.agentPrompt}
                onChange={handleChange}
                placeholder="You are a friendly receptionist for a barbershop. Help callers book appointments, answer questions about services and pricing, and collect their contact information. Be warm and professional."
                style={{ ...textareaStyle, minHeight: 150 }}
              />
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                Tell the AI how to behave and what to do. Be specific about your services and
                how you want calls handled.
              </p>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 style={{ ...labelStyle, fontSize: 18, marginBottom: 20, color: C.text }}>
              Custom data extraction (optional)
            </h2>
            
            {/* Standard Fields Info */}
            <div
              style={{
                background: C.blueLight,
                padding: 16,
                borderRadius: C.radiusSm,
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: 13, color: C.blue, margin: 0 }}>
                <strong>Standard fields (always collected):</strong><br />
                Business name, First name, Last name, Phone number, Appointment time, Month, Day
              </p>
            </div>

            <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 16 }}>
              Add additional fields specific to your business that the AI should collect.
            </p>

            {/* Current Custom Fields */}
            {formData.customExtractionFields.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Your Custom Fields</label>
                <div>
                  {formData.customExtractionFields.map((field) => (
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
              </div>
            )}

            {/* Add Custom Field */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Add Custom Field</label>
              <div style={{ display: "flex", gap: 8 }}>
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
            </div>

            {/* Suggested Fields */}
            <div>
              <label style={labelStyle}>Suggestions</label>
              <div>
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
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: C.body,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: C.card,
          borderRadius: C.radius,
          boxShadow: C.shadowLg,
          padding: "40px 36px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: C.heading,
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              marginBottom: 8,
            }}
          >
            Set Up Your AI Receptionist
          </h1>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>
            Step {step} of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: s <= step ? C.accent : C.border,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Error Message */}
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
          {renderStep()}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 32,
            }}
          >
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
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
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: C.body,
                  background: canProceed() ? C.accent : C.textMuted,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: C.radiusSm,
                  cursor: canProceed() ? "pointer" : "not-allowed",
                  transition: "background 0.2s",
                }}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !canProceed()}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: C.body,
                  background: loading || !canProceed() ? C.textMuted : C.green,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: C.radiusSm,
                  cursor: loading || !canProceed() ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Setting up..." : "Create My AI Receptionist"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
