import React, { useState } from "react";
import { C } from "../theme";

interface OnboardingFormProps {
  onComplete: (business: any) => void;
  userEmail: string;
  userId: string;
}

export function OnboardingForm({ onComplete, userEmail, userId }: OnboardingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    orgName: "",
    phoneNumber: "",
    voiceAgentId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          ...formData,
          ownerEmail: userEmail,
          userId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      onComplete(data.business);
    } catch (err) {
      setError("Failed to connect. Please try again.");
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
          maxWidth: 440,
          background: C.card,
          borderRadius: C.radius,
          boxShadow: C.shadowLg,
          padding: "40px 36px",
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontFamily: C.heading,
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Welcome to Bookd
        </h1>
        <p
          style={{
            fontSize: 15,
            color: C.textMuted,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Set up your business to get started
        </p>

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
          <div style={fieldStyle}>
            <label style={labelStyle}>Logged in as</label>
            <div
              style={{
                ...inputStyle,
                background: C.bg,
                color: C.textMuted,
                cursor: "default",
              }}
            >
              {userEmail}
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Business Name</label>
            <input
              type="text"
              name="orgName"
              value={formData.orgName}
              onChange={handleChange}
              placeholder="Bloom Studio"
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+15551234567"
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Voice Agent Name</label>
            <input
              type="text"
              name="voiceAgentId"
              value={formData.voiceAgentId}
              onChange={handleChange}
              placeholder="agent_abc123"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: C.body,
              background: loading ? C.textMuted : C.accent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: C.radiusSm,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              marginTop: 8,
            }}
          >
            {loading ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
