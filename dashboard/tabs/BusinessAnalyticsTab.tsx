import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type {
  Appointment,
  BusinessAnalytics as BusinessAnalyticsType,
} from "../types";

interface BusinessAnalyticsTabProps {
  analytics: BusinessAnalyticsType;
  appointments: Appointment[];
  employees: string[];
}

/* -------------------- Helpers -------------------- */

function getTrendPercent(
  thisWeek: number,
  lastWeek: number
): { value: number; isUp: boolean } {
  if (lastWeek === 0) {
    return { value: thisWeek > 0 ? 100 : 0, isUp: thisWeek > 0 };
  }
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { value: Math.abs(pct), isUp: pct >= 0 };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isInWeek(dateStr: string, weekStart: Date): boolean {
  const d = new Date(dateStr);
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

/* -------------------- Card -------------------- */

function ItemCard({
  icon,
  title,
  subtitle,
  value,
  bg,
  valueColor = C.accent,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value: React.ReactNode;
  bg: string;
  valueColor?: string;
  delay?: number;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: C.shadow,
        animation: `slideUp 0.35s ease ${delay}s both`,
        minHeight: 76,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: bg,
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
              fontSize: 16,
              fontWeight: 700,
              color: C.text,
              fontFamily: C.heading,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 13,
                color: C.textMuted,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Aligned value column */}
      <div
        style={{
          minWidth: 140,
          textAlign: "right",
          fontSize: 28,
          fontWeight: 800,
          color: valueColor,
          fontFamily: C.heading,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* -------------------- Main -------------------- */

export function BusinessAnalyticsTab({
  analytics,
  appointments,
  employees,
}: BusinessAnalyticsTabProps) {
  const trend = getTrendPercent(
    analytics.clientsThisWeek,
    analytics.clientsLastWeek
  );

  const refDate = new Date(2026, 1, 1);
  const weekStart = getWeekStart(refDate);

  const thisWeekAppointments = appointments.filter(
    (a) => a.status !== "cancelled" && isInWeek(a.date, weekStart)
  );

  const countByEmployee: Record<string, number> = {};
  employees.forEach((name) => {
    countByEmployee[name] = thisWeekAppointments.filter(
      (a) =>
        (a.assignedTo || "").toLowerCase() === name.toLowerCase()
    ).length;
  });

  const sortedEmployees = [...employees].sort(
    (a, b) => (countByEmployee[b] ?? 0) - (countByEmployee[a] ?? 0)
  );

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <h2
        style={{
          fontSize: 20,
          fontFamily: C.heading,
          fontWeight: 700,
          color: C.text,
          margin: "0 0 20px 0",
        }}
      >
        Business overview
      </h2>

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontSize: 17,
            fontFamily: C.heading,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Week in review
        </h3>

        <h3
          style={{
            fontSize: 17,
            fontFamily: C.heading,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Customers served by employee (this week)
        </h3>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ItemCard
            icon={Icons.people(C.accent, 22)}
            title="Total current clients"
            value={analytics.totalClients}
            bg={C.accentLight}
            delay={0}
          />

          <ItemCard
            icon={Icons.chartBar(trend.isUp ? C.green : C.red, 22)}
            title="Weekly trend"
            subtitle={`vs ${analytics.clientsLastWeek} last week`}
            value={`${analytics.clientsThisWeek} (${
              trend.isUp ? "+" : "-"
            }${trend.value}%)`}
            bg={trend.isUp ? C.greenLight : C.redLight}
            valueColor={trend.isUp ? C.green : C.red}
            delay={0.05}
          />

          <ItemCard
            icon={Icons.alert(C.red, 22)}
            title="Cancellations this week"
            value={analytics.cancellationsThisWeek}
            bg={C.redLight}
            delay={0.1}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedEmployees.map((name, idx) => {
            const count = countByEmployee[name] ?? 0;
            return (
              <ItemCard
                key={name}
                icon={Icons.people(C.accent, 22)}
                title={name}
                subtitle={count === 1 ? "1 customer" : `${count} customers`}
                value={count}
                bg={C.accentLight}
                delay={idx * 0.05}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
