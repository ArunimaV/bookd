import React, { useState, useEffect } from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type { TabId, TabDef } from "../types";

interface HeaderProps {
  tabs: TabDef[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function Header({ tabs, activeTab, onTabChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = (tabId: TabId) => {
    onTabChange(tabId);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(44, 36, 24, 0.4)",
          zIndex: 90,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Slide-out menu from the left */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 280,
          maxWidth: "85vw",
          background: C.card,
          borderRight: `1px solid ${C.border}`,
          boxShadow: menuOpen ? "4px 0 24px rgba(44,36,24,0.12)" : "none",
          zIndex: 100,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            paddingLeft: 8,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.text,
              fontFamily: C.heading,
            }}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "all 0.15s",
                  background: isActive ? C.accentLight : "transparent",
                  color: isActive ? C.accent : C.text,
                }}
              >
                {tab.icon(isActive ? C.accent : C.textSoft, 20)}
                {tab.label}
                {tab.count !== null && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: isActive ? `${C.accent}20` : C.accentLight,
                      color: isActive ? C.accent : C.textSoft,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Header bar */}
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
        {/* Hamburger + Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: menuOpen ? C.accentLight : C.card,
              color: menuOpen ? C.accent : C.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {Icons.menu(menuOpen ? C.accent : C.text, 20)}
          </button>

          <div
            style={{
              width: 1,
              height: 32,
              background: C.border,
              marginRight: 4,
            }}
          />
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
    </>
  );
}
