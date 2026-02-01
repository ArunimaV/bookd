import React, { useState, useEffect, Suspense, lazy, ReactNode, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { HiSparkles } from "react-icons/hi2";
import { createBrowserSupabaseClient } from "./lib/supabase/client";

// Theme & Styles
import { C, FONT_LINK } from "./dashboard/theme";
import { globalStyles } from "./dashboard/styles";

// Icons
import { Icons } from "./dashboard/icons";

// Data (TODO: Replace remaining mock data with real Supabase data)
import { LEADS, WEEKLY_STATS, EMPLOYEES, BUSINESS_ANALYTICS } from "./dashboard/data";

// Components
import { Header } from "./dashboard/components/Header";
import { StatsGrid } from "./dashboard/components/StatsGrid";
import { OnboardingForm } from "./dashboard/components/OnboardingForm";
import { NewCallsNotification } from "./dashboard/components/NewCallsNotification";
import { SyncButton } from "./dashboard/components/SyncButton";
import { SyncAllButton } from "./dashboard/components/SyncAllButton";

// Hooks
import { useNewCalls } from "./dashboard/hooks/useNewCalls";
import { useTeliSync } from "./dashboard/hooks/useTeliSync";
import { useSyncAll } from "./dashboard/hooks/useSyncAll";
import { useCustomers, getAppointmentsFromCustomers } from "./dashboard/hooks/useCustomers";
import type { Customer } from "./dashboard/hooks/useCustomers";

// Types
import type { TabId, TabDef, Lead, Appointment } from "./dashboard/types";

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
const ProfileTab = lazy(() =>
  import("./dashboard/tabs/ProfileTab").then((m) => ({ default: m.ProfileTab }))
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
      icon: (c?: string, s?: number) => <HiSparkles size={s || 20} color={c || "#6B5D4D"} />,
      count: null,
    },
    {
      id: "profile",
      label: "Profile",
      icon: Icons.user,
      count: null,
    },
  ];
}

// Tab content renderer with code splitting
interface TabContentProps {
  activeTab: TabId;
  business?: any;
  user?: any;
  customers?: Customer[];
  customersLoading?: boolean;
  customersError?: string | null;
  appointments?: Appointment[];
  appointmentsLoading?: boolean;
  onBusinessUpdate?: (business: any) => void;
}

function TabContent({ 
  activeTab, 
  business, 
  user, 
  customers = [], 
  customersLoading = false,
  customersError = null,
  appointments = [],
  appointmentsLoading = false,
  onBusinessUpdate 
}: TabContentProps): ReactNode {
  return (
    <Suspense fallback={<TabLoadingFallback />}>
      {activeTab === "inbox" && <InboxTab leads={LEADS} />}
      {activeTab === "calendar" && (
        <CalendarTab 
          appointments={appointments}
          appointmentsLoading={appointmentsLoading}
          customers={customers}
          customersLoading={customersLoading}
          customersError={customersError}
          businessId={business?.id}
          agentPhoneNumber={business?.teli_phone_number || null} 
        />
      )}
      {activeTab === "leads" && <LeadsTab leads={LEADS} />}
      {activeTab === "business_analytics" && (
        <BusinessAnalyticsTab
          analytics={BUSINESS_ANALYTICS}
          appointments={appointments}
          employees={EMPLOYEES}
        />
      )}
      {activeTab === "your_agent" && business && onBusinessUpdate && (
        <YourAgentTab business={business} onBusinessUpdate={onBusinessUpdate} />
      )}
      {activeTab === "profile" && business && (
        <ProfileTab business={business} user={user} />
      )}
    </Suspense>
  );
}

// Map TabId to URL path
const TAB_TO_URL: Record<TabId, string> = {
  calendar: "/calendar",
  inbox: "/inbox",
  leads: "/leads",
  business_analytics: "/analytics",
  your_agent: "/agent",
  profile: "/profile",
};

interface AppProps {
  defaultTab?: TabId;
}

export default function App({ defaultTab = "calendar" }: AppProps): ReactNode {
  const router = useRouter();
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const activeTab = defaultTab;
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const authCheckedRef = useRef(false);

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

  // Sync ALL organization calls (admin sync)
  const {
    lastSync: lastSyncAll,
    isSyncing: isSyncingAll,
    lastResult: lastResultAll,
    error: syncAllError,
    syncAll,
  } = useSyncAll();

  // Fetch customers by business_name from Supabase
  const { 
    customers, 
    loading: customersLoading,
    error: customersError,
    refetch: refetchCustomersByName 
  } = useCustomers({
    businessName: business?.business_name,
    enabled: !!business?.business_name,
  });

  // Derive appointments from customers who have appointment data
  const appointments = useMemo(() => {
    return getAppointmentsFromCustomers(customers);
  }, [customers]);
  
  const appointmentsLoading = customersLoading; // Same loading state as customers

  // When sync completes, refetch customers (appointments are derived from customers)
  const handleSyncNow = async () => {
    await syncNow();
    refetchCustomers();
    refetchCustomersByName();
  };

  // When sync all completes, refetch customers
  const handleSyncAll = async () => {
    await syncAll();
    refetchCustomers();
    refetchCustomersByName();
  };

  // Check auth session and fetch business
  useEffect(() => {
    // Prevent double-running in strict mode or on re-renders
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Middleware handles redirect to /login if no session
        // Just set state here, don't redirect
        if (!session?.user) {
          setCheckingAuth(false);
          return;
        }

        const authUser = session.user;
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
      } catch (error) {
        console.error("Auth check error:", error);
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase]);

  const handleOnboardingComplete = (result: { business: any; phoneNumber: string; agentId: string }) => {
    // Extract the business object from the result
    setBusiness(result.business);
  };

  const handleTabChange = (tabId: TabId) => {
    router.push(TAB_TO_URL[tabId]);
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
          businessName={business?.name}
        />

        {/* Main Content */}
        <div style={{ padding: "20px 28px" }}>
          {/* Sync Button Row */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginBottom: 16 }}>
            <SyncButton
              onSync={handleSyncNow}
              isSyncing={isSyncing}
              lastSync={lastSync}
              lastResult={lastResult}
            />
            <SyncAllButton
              onSync={handleSyncAll}
              isSyncing={isSyncingAll}
              lastSync={lastSyncAll}
              lastResult={lastResultAll}
              error={syncAllError}
            />
          </div>

          {/* Stats Grid */}
          <StatsGrid stats={WEEKLY_STATS} />

          {/* Tab Content (Code Split) */}
          <TabContent
            activeTab={activeTab}
            business={business}
            user={user}
            customers={customers}
            customersLoading={customersLoading}
            customersError={customersError}
            appointments={appointments}
            appointmentsLoading={appointmentsLoading}
            onBusinessUpdate={setBusiness}
          />
        </div>

        {/* New Calls Notification */}
        <NewCallsNotification
          newCustomers={newCustomers}
          onDismiss={clearNewCustomers}
          onViewAll={() => {
            router.push("/leads");
            clearNewCustomers();
          }}
        />
      </div>
    </>
  );
}
