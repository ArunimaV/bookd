import React, { useState, useEffect, Suspense, lazy, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HiSparkles } from "react-icons/hi2";
import { createBrowserSupabaseClient } from "./lib/supabase/client";

// Theme & Styles
import { C, FONT_LINK } from "./dashboard/theme";
import { globalStyles } from "./dashboard/styles";

// Icons
import { Icons } from "./dashboard/icons";

// Data
import { LEADS, APPOINTMENTS, WEEKLY_STATS, EMPLOYEES, BUSINESS_ANALYTICS } from "./dashboard/data";

// Components
import { Header } from "./dashboard/components/Header";
import { StatsGrid } from "./dashboard/components/StatsGrid";
import { OnboardingForm } from "./dashboard/components/OnboardingForm";
import { NewCallsNotification } from "./dashboard/components/NewCallsNotification";
import { SyncButton } from "./dashboard/components/SyncButton";

// Hooks
import { useNewCalls } from "./dashboard/hooks/useNewCalls";
import { useTeliSync } from "./dashboard/hooks/useTeliSync";

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
const BusinessAnalyticsTab = lazy(() =>
  import("./dashboard/tabs/BusinessAnalyticsTab").then((m) => ({ default: m.BusinessAnalyticsTab }))
);
const YourAgentTab = lazy(() =>
  import("./dashboard/tabs/YourAgentTab").then((m) => ({ default: m.YourAgentTab }))
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
      id: "calendar",
      label: "Calendar",
      icon: Icons.calendar,
      count: null,
    },
    {
      id: "inbox",
      label: "Inbox",
      icon: Icons.inbox,
      count: leads.filter((l) => l.status === "new" || l.status === "urgent").length,
    },
    {
      id: "leads",
      label: "All Leads",
      icon: Icons.people,
      count: leads.length,
    },
    {
      id: "business_analytics",
      label: "Business Analytics",
      icon: Icons.chartBar,
      count: null,
    },
    {
      id: "your_agent",
      label: "Your Agent",
      icon: (c: string = C.textSoft, s: number = 20): ReactNode => <HiSparkles size={s} color={c} />,
      count: null,
    }
  ];
}

// Tab content renderer with code splitting
function TabContent({ activeTab }: { activeTab: TabId }): ReactNode {
  return (
    <Suspense fallback={<TabLoadingFallback />}>
      {activeTab === "inbox" && <InboxTab leads={LEADS} />}
      {activeTab === "calendar" && <CalendarTab appointments={APPOINTMENTS} />}
      {activeTab === "leads" && <LeadsTab leads={LEADS} />}
      {activeTab === "business_analytics" && (
        <BusinessAnalyticsTab
          analytics={BUSINESS_ANALYTICS}
          appointments={APPOINTMENTS}
          employees={EMPLOYEES}
        />
      )}
      {activeTab === "your_agent" && <YourAgentTab />}
    </Suspense>
  );
}

export default function App(): ReactNode {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const tabs = getTabDefinitions(LEADS);

  // Poll for new calls/customers from Supabase
  const { newCustomers, clearNewCustomers, refetch: refetchCustomers } = useNewCalls({
    businessId: business?.id,
    pollInterval: 5000,
    enabled: !!business,
  });

  // Sync calls from Teli API to Supabase (manual only)
  const { lastSync, isSyncing, lastResult, syncNow } = useTeliSync({
    businessId: business?.id,
    agentId: business?.teli_agent_id,
  });

  // When sync completes, refetch customers to show new data
  const handleSyncNow = async () => {
    await syncNow();
    refetchCustomers();
  };

  // Check auth session and fetch business
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser(authUser);

      // Fetch business for this user
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (bizData) {
        setBusiness(bizData);
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOnboardingComplete = (newBusiness: any) => {
    setBusiness(newBusiness);
  };

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: C.body,
        color: C.textMuted
      }}>
        Loading...
      </div>
    );
  }

  // Show onboarding if authenticated but no business
  if (!business && user) {
    return (
      <>
        <link href={FONT_LINK} rel="stylesheet" />
        <style>{globalStyles}</style>
        <OnboardingForm
          onComplete={handleOnboardingComplete}
          userEmail={user.email || ""}
          userId={user.id}
        />
      </>
    );
  }

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
        {/* Header with hamburger menu */}
        <Header
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div style={{ padding: "20px 28px" }}>
          {/* Sync Button Row */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <SyncButton
              onSync={handleSyncNow}
              isSyncing={isSyncing}
              lastSync={lastSync}
              lastResult={lastResult}
            />
          </div>

          {/* Stats Grid */}
          <StatsGrid stats={WEEKLY_STATS} />

          {/* Tab Content (Code Split) */}
          <TabContent activeTab={activeTab} />
        </div>

        {/* New Calls Notification */}
        <NewCallsNotification
          newCustomers={newCustomers}
          onDismiss={clearNewCustomers}
          onViewAll={() => {
            setActiveTab("leads");
            clearNewCustomers();
          }}
        />
      </div>
    </>
  );
}
