"use client";

import { useState } from "react";
import { OnboardingForm } from "@/dashboard/components/OnboardingForm";
import { C } from "@/dashboard/theme";

export default function OnboardingPage() {
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<{
    business: any;
    phoneNumber: string;
    agentId: string;
  } | null>(null);

  const handleComplete = (data: {
    business: any;
    phoneNumber: string;
    agentId: string;
  }) => {
    setResult(data);
    setCompleted(true);
  };

  if (completed && result) {
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
            padding: "48px 36px",
            textAlign: "center",
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: C.greenLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.green}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: C.heading,
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              marginBottom: 12,
            }}
          >
            You&apos;re All Set!
          </h1>
          <p
            style={{
              fontSize: 16,
              color: C.textMuted,
              marginBottom: 32,
            }}
          >
            Your AI receptionist is ready to take calls
          </p>

          {/* Phone Number Display */}
          <div
            style={{
              background: C.bg,
              borderRadius: C.radiusSm,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: C.textMuted,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Your Business Phone
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: C.text,
                fontFamily: C.body,
                margin: 0,
              }}
            >
              {result.phoneNumber}
            </p>
          </div>

          {/* Info Cards */}
          <div
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                background: C.accentLight,
                padding: "16px 20px",
                borderRadius: C.radiusSm,
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: 14, color: C.accent, margin: 0 }}>
                <strong>Next:</strong> Forward your existing business line to this
                number, or share it directly with customers.
              </p>
            </div>
            <div
              style={{
                background: C.blueLight,
                padding: "16px 20px",
                borderRadius: C.radiusSm,
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: 14, color: C.blue, margin: 0 }}>
                <strong>Tip:</strong> Call the number to test your AI receptionist!
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="/"
            style={{
              display: "block",
              padding: "16px 20px",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: C.body,
              background: C.accent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: C.radiusSm,
              cursor: "pointer",
              textDecoration: "none",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <OnboardingForm onComplete={handleComplete} />;
}
