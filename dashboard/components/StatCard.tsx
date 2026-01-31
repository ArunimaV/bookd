import React, { ReactNode } from "react";
import { C } from "../theme";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  bgColor: string;
  delay?: number;
}

export function StatCard({ icon, label, value, bgColor, delay = 0 }: StatCardProps) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: C.shadow,
        animation: `cardIn 0.5s ease ${delay}s both`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            fontFamily: C.heading,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.textSoft,
            fontWeight: 500,
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
