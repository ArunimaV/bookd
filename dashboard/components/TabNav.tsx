import React from "react";
import { C } from "../theme";
import type { TabId, TabDef } from "../types";

interface TabNavProps {
  tabs: TabDef[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 4,
        width: "fit-content",
        boxShadow: C.shadow,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              fontFamily: C.body,
              transition: "all 0.2s",
              background: isActive ? C.accent : "transparent",
              color: isActive ? "#FFF" : C.textSoft,
            }}
          >
            {tab.icon(isActive ? "#FFF" : C.textSoft, 17)}
            {tab.label}
            {tab.count !== null && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: isActive ? "rgba(255,255,255,0.25)" : C.accentLight,
                  color: isActive ? "#FFF" : C.accent,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
