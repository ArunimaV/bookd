import React, { useState, Suspense, lazy, ReactNode } from "react";

// Theme & Styles
import { C, FONT_LINK } from "./dashboard/theme";
import { globalStyles } from "./dashboard/styles";

// Icons
import { Icons } from "./dashboard/icons";

// Data
import { LEADS, APPOINTMENTS, WEEKLY_STATS } from "./dashboard/data";

// Components
import { Header } from "./dashboard/components/Header";
import { TabNav } from "./dashboard/components/TabNav";
import { StatsGrid } from "./dashboard/components/StatsGrid";

// Types
import type { TabId, TabDef, Lead } from "./dashboard/types";

// Lazy load tab components for code splitting
const InboxTab = lazy(() =>
  import("./dashboard/tabs/InboxTab").then((m) => ({ default: m.InboxTab }))
);
const CalendarTab = lazy(() =>
  import("./dashboard/tabs/CalendarTab").then((m) => ({ default: m.CalendarTab }))
);
const LeadsTab = lazy(() =>
  import("./dashboard/tabs/LeadsTab").then((m) => ({ default: m.LeadsTab }))
);

// Loading fallback component
function TabLoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        color: C.textMuted,
        fontSize: 14,
        fontFamily: C.body,
      }}
    >
      Loading...
    </div>
  );
}

// Tab configuration - defined once, used for rendering and counting
function getTabDefinitions(leads: Lead[]): TabDef[] {
  return [
    {
      id: "inbox",
      label: "Inbox",
      icon: Icons.inbox,
      count: leads.filter((l) => l.status === "new" || l.status === "urgent").length,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Icons.calendar,
      count: null,
    },
    {
      id: "leads",
      label: "All Leads",
      icon: Icons.people,
      count: leads.length,
    },
  ];
}

// Tab content renderer with code splitting
function TabContent({ activeTab }: { activeTab: TabId }): ReactNode {
  return (
    <Suspense fallback={<TabLoadingFallback />}>
      {activeTab === "inbox" && <InboxTab leads={LEADS} />}
      {activeTab === "calendar" && <CalendarTab appointments={APPOINTMENTS} />}
      {activeTab === "leads" && <LeadsTab leads={LEADS} />}
    </Suspense>
  );
}

export default function App(): ReactNode {
  const [activeTab, setActiveTab] = useState<TabId>("inbox");

  const tabs = getTabDefinitions(LEADS);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  return (
    <>
      {/* Font Loading */}
      <link href={FONT_LINK} rel="stylesheet" />

      {/* Global Styles */}
      <style>{globalStyles}</style>

      {/* App Container */}
      <div
        style={{
          fontFamily: C.body,
          color: C.text,
          background: C.bg,
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div style={{ padding: "20px 28px" }}>
          {/* Stats Grid */}
          <StatsGrid stats={WEEKLY_STATS} />

          {/* Tab Navigation */}
          <TabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content (Code Split) */}
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </>
  );
}
