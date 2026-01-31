import React from "react";
import { C } from "../theme";
import type { AllStatus, StatusStyle } from "../types";

const STATUS_MAP: Record<string, StatusStyle> = {
  new: { label: "New", bg: C.accentLight, color: C.accent, dot: C.accent },
  in_progress: { label: "AI Replied", bg: C.blueLight, color: C.blue, dot: C.blue },
  handled: { label: "Done", bg: C.greenLight, color: C.greenDark, dot: C.green },
  urgent: { label: "Needs You", bg: C.redLight, color: C.red, dot: C.red },
  confirmed: { label: "Confirmed", bg: C.greenLight, color: C.greenDark, dot: C.green },
  pending: { label: "Pending", bg: C.yellowLight, color: "#9A7B1A", dot: C.yellow },
  reminder_sent: { label: "Reminded", bg: C.blueLight, color: C.blue, dot: C.blue },
};

interface StatusPillProps {
  status: AllStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const style = STATUS_MAP[status] || STATUS_MAP.handled;
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px 3px 8px",
        borderRadius: 999,
        background: style.bg,
        fontSize: 12,
        fontWeight: 700,
        color: style.color,
        fontFamily: C.body,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: style.dot,
        }}
      />
      {style.label}
    </span>
  );
}
