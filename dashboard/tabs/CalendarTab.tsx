import React, { useState, useMemo } from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type { Appointment } from "../types";
import type { Customer } from "../hooks/useCustomers";
import { Avatar } from "../components/Avatar";
import { StatusPill } from "../components/StatusPill";
import { CustomerCard } from "../components/CustomerCard";
import { CustomerDetailModal } from "../components/CustomerDetailModal";

interface CalendarTabProps {
  appointments: Appointment[];
  appointmentsLoading?: boolean;
  customers?: Customer[];
  customersLoading?: boolean;
  customersError?: string | null;
  businessId?: string;
  agentPhoneNumber?: string | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0
  const diff = -day; // move back to Sunday of the same week
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getAppointmentColor(status: Appointment["status"]) {
  switch (status) {
    case "pending":
      return { bg: C.yellowLight, border: C.yellow };
    case "reminder_sent":
      return { bg: C.blueLight, border: C.blue };
    case "cancelled":
      return { bg: C.redLight, border: C.red };
    default:
      return { bg: C.greenLight, border: C.green };
  }
}

export type CalendarViewMode = "week" | "day" | "all";

interface CalendarToolbarProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function CalendarToolbar({
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {/* Week | Day | All Upcoming toggle */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 4,
          boxShadow: C.shadow,
        }}
      >
        {(["week", "day", "all"] as const).map((mode) => {
          const isActive = viewMode === mode;
          const label = mode === "week" ? "Week" : mode === "day" ? "Day" : "All Upcoming";
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
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
              {label}
            </button>
          );
        })}
      </div>

      {/* <- Today -> (only when not "all" view) */}
      {viewMode !== "all" && (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={onPrev}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.card,
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: C.shadow,
            }}
          >
            {Icons.chevLeft(C.textSoft)}
          </button>
          <button
            type="button"
            onClick={onToday}
            style={{
              padding: "0 14px",
              height: 36,
              borderRadius: 10,
              background: C.accent,
              color: "#FFF",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: C.body,
            }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.card,
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: C.shadow,
            }}
          >
            {Icons.chevRight(C.textSoft)}
          </button>
        </div>
      )}
    </div>
  );
}

interface SingleDayViewProps {
  date: Date;
  isToday: boolean;
  appointments: Appointment[];
}

function SingleDayView({ date, isToday, appointments }: SingleDayViewProps) {
  const dayName = DAY_NAMES[date.getDay()];
  const dateLabel = `${dayName}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  return (
    <div
      style={{
        background: isToday ? C.accentLight : C.card,
        border: `1.5px solid ${isToday ? C.accent : C.border}`,
        borderRadius: C.radius,
        padding: 24,
        minHeight: 320,
        boxShadow: isToday ? C.shadowLg : C.shadow,
        animation: "slideUp 0.4s ease both",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: isToday ? C.accent : C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 16,
        }}
      >
        {dateLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {appointments.map((appt, index) => {
          const colors = getAppointmentColor(appt.status);
          const isCancelled = appt.status === "cancelled";
          const strikeStyle = isCancelled
            ? { textDecoration: "line-through" as const, opacity: 0.75 }
            : {};
          return (
            <div
              key={index}
              style={{
                background: colors.bg,
                borderRadius: 10,
                padding: "14px 16px",
                borderLeft: `4px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, ...strikeStyle }}>
                {appt.time}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 4, ...strikeStyle }}>
                {appt.client}
              </div>
              <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2, ...strikeStyle }}>
                {appt.service}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, ...strikeStyle }}>
                {appt.duration}
              </div>
            </div>
          );
        })}
        {appointments.length === 0 && (
          <div
            style={{
              fontSize: 14,
              color: C.textMuted,
              textAlign: "center",
              padding: "40px 0",
              fontStyle: "italic",
            }}
          >
            No appointments this day
          </div>
        )}
      </div>
    </div>
  );
}

interface DayCardProps {
  date: Date;
  isToday: boolean;
  dayIndex: number;
  appointments: Appointment[];
}

function DayCard({ date, isToday, dayIndex, appointments }: DayCardProps) {
  return (
    <div
      style={{
        background: isToday ? C.accentLight : C.card,
        border: `1.5px solid ${isToday ? C.accent : C.border}`,
        borderRadius: C.radius,
        padding: 14,
        minHeight: "min(520px, 68vh)",
        boxShadow: isToday ? C.shadowLg : C.shadow,
        animation: `slideUp 0.4s ease ${dayIndex * 0.05}s both`,
      }}
    >
      {/* Day Header */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isToday ? C.accent : C.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {DAY_NAMES[dayIndex]}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: C.heading,
            width: 38,
            height: 38,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "4px auto 0",
            background: isToday ? C.accent : "transparent",
            color: isToday ? "#FFF" : C.text,
          }}
        >
          {date.getDate()}
        </div>
      </div>

      {/* Appointments */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {appointments.map((appt, index) => {
          const colors = getAppointmentColor(appt.status);
          const isCancelled = appt.status === "cancelled";
          const strikeStyle = isCancelled
            ? { textDecoration: "line-through" as const, opacity: 0.75 }
            : {};
          return (
            <div
              key={index}
              style={{
                background: colors.bg,
                borderRadius: 8,
                padding: "8px 10px",
                borderLeft: `3px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, ...strikeStyle }}>
                {appt.time}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2, ...strikeStyle }}>
                {appt.client}
              </div>
              <div style={{ fontSize: 11, color: C.textSoft, ...strikeStyle }}>{appt.service}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, ...strikeStyle }}>
                {appt.duration}
              </div>
            </div>
          );
        })}
        {appointments.length === 0 && (
          <div
            style={{
              fontSize: 12,
              color: C.textMuted,
              textAlign: "center",
              padding: "20px 0",
              fontStyle: "italic",
            }}
          >
            No appointments
          </div>
        )}
      </div>
    </div>
  );
}

interface AppointmentListProps {
  appointments: Appointment[];
}

function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <div
      style={{
        marginTop: 20,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: 20,
        boxShadow: C.shadow,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontFamily: C.heading,
          fontWeight: 700,
          color: C.text,
          margin: "0 0 14px 0",
        }}
      >
        All Upcoming
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {appointments.map((appt, index) => {
          const isCancelled = appt.status === "cancelled";
          const strikeStyle = isCancelled
            ? { textDecoration: "line-through" as const, opacity: 0.75 }
            : {};
          return (
            <div
              key={appt.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: C.radiusSm,
                background: C.bg,
                border: `1px solid ${C.border}`,
                animation: `slideUp 0.3s ease ${index * 0.04}s both`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={appt.client} size={34} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, ...strikeStyle }}>
                    {appt.client}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSoft, ...strikeStyle }}>
                    {appt.service} · {appt.duration}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, ...strikeStyle }}>
                    {appt.time}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, ...strikeStyle }}>
                    {new Date(appt.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <StatusPill status={appt.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarTab({ 
  appointments, 
  appointmentsLoading = false,
  customers = [], 
  customersLoading = false,
  customersError = null,
  businessId,
  agentPhoneNumber 
}: CalendarTabProps) {
  const today = new Date(2026, 1, 1);
  const defaultWeekStart = getWeekStart(today);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [focusDate, setFocusDate] = useState(defaultWeekStart);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const weekStart = viewMode === "week" ? getWeekStart(focusDate) : focusDate;
  const days = getWeekDays(weekStart);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter((customer) => {
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      return (
        fullName.includes(query) ||
        customer.phone_number.includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query))
      );
    });
  }, [customers, searchQuery]);

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = formatDateString(date);
    return appointments.filter((a) => a.date === dateStr);
  };

  const handlePrev = () => {
    const d = new Date(focusDate);
    d.setDate(d.getDate() + (viewMode === "week" ? -7 : -1));
    setFocusDate(d);
  };

  const handleNext = () => {
    const d = new Date(focusDate);
    d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1));
    setFocusDate(d);
  };

  const handleToday = () => {
    if (viewMode === "week") {
      setFocusDate(getWeekStart(today));
    } else {
      setFocusDate(new Date(today));
    }
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === "day") {
      setFocusDate(new Date(today));
    } else if (mode === "week" && viewMode === "day") {
      setFocusDate(getWeekStart(focusDate));
    }
  };

  return (
    <div style={{ display: "flex", gap: 24, animation: "fadeIn 0.4s ease" }}>
      {/* Main Calendar Section */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <CalendarToolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        {/* Status Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            padding: "10px 14px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 12,
            color: C.textSoft,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: C.green,
              }}
            />
            <span>Confirmed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: C.yellow,
              }}
            />
            <span>Pending</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: C.blue,
              }}
            />
            <span>Reminded</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: C.red,
              }}
            />
            <span>Cancelled</span>
          </div>
          {agentPhoneNumber && (
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {Icons.phone(C.accent, 14)}
              <span style={{ fontWeight: 700, color: C.text }}>
                Agent Phone #: {agentPhoneNumber}
              </span>
            </div>
          )}
        </div>

        {viewMode === "week" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 12,
              minHeight: "min(560px, 72vh)",
            }}
          >
            {days.map((date, index) => (
              <DayCard
                key={index}
                date={date}
                isToday={isSameDay(date, today)}
                dayIndex={index}
                appointments={getAppointmentsForDate(date)}
              />
            ))}
          </div>
        )}

        {viewMode === "day" && (
          <SingleDayView
            date={focusDate}
            isToday={isSameDay(focusDate, today)}
            appointments={getAppointmentsForDate(focusDate)}
          />
        )}

        {viewMode === "all" && <AppointmentList appointments={appointments} />}
      </div>

      {/* Customer Sidebar */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          padding: 16,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          boxShadow: C.shadow,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: C.heading,
            color: C.text,
            margin: "0 0 12px 0",
          }}
        >
          Customers ({customers.length})
        </h3>

        {/* Search Input */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              fontSize: 13,
              fontFamily: C.body,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              background: C.bg,
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "none",
                background: C.border,
                color: C.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filtered count */}
        {searchQuery && filteredCustomers.length !== customers.length && (
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
            Showing {filteredCustomers.length} of {customers.length}
          </div>
        )}

        {/* Customer Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {customersLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              Loading customers...
            </div>
          ) : customersError ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 16px",
                color: C.red,
                fontSize: 13,
                background: C.redLight,
                borderRadius: C.radiusSm,
              }}
            >
              <div style={{ marginBottom: 4 }}>Error loading customers</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{customersError}</div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                appointments={appointments}
                onClick={() => setSelectedCustomer(customer)}
                delay={index * 0.03}
              />
            ))
          ) : customers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              <div style={{ marginBottom: 8 }}>No customers yet</div>
              <div style={{ fontSize: 12 }}>
                Click "Sync Now" to fetch customers
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "24px 16px",
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              No customers match "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          businessId={businessId}
          appointments={appointments}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
