import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";

export function Header() {
  return (
    <div
      style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: "14px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(44,36,24,0.04)",
      }}
    >
      {/* Logo & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, #F4A261)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 2px 8px ${C.accent}40`,
          }}
        >
          {Icons.bot("#FFF", 20)}
        </div>
        <div>
          <h1
            style={{
              fontSize: 19,
              fontFamily: C.heading,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Bloom Studio
          </h1>
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
            Powered by Teli + OpenClaw
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            background: C.greenLight,
            borderRadius: 999,
            border: `1px solid ${C.green}30`,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.green,
              animation: "pulse 2.5s ease infinite",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark }}>
            AI Active
          </span>
        </div>
      </div>
    </div>
  );
}
