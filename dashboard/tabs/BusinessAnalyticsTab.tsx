import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import { StatCard } from "../components/StatCard";
import type { Appointment, BusinessAnalytics as BusinessAnalyticsType } from "../types";

interface BusinessAnalyticsTabProps {
  analytics: BusinessAnalyticsType;
  appointments: Appointment[];
  employees: string[];
}

function getTrendPercent(thisWeek: number, lastWeek: number): { value: number; isUp: boolean } {
  if (lastWeek === 0) return { value: thisWeek > 0 ? 100 : 0, isUp: thisWeek > 0 };
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

export function BusinessAnalyticsTab({ analytics, appointments, employees }: BusinessAnalyticsTabProps) {
  const trend = getTrendPercent(analytics.clientsThisWeek, analytics.clientsLastWeek);

  const refDate = new Date(2026, 1, 1);
  const weekStart = getWeekStart(refDate);
  const thisWeekAppointments = appointments.filter(
    (a) => a.status !== "cancelled" && isInWeek(a.date, weekStart)
  );
  const countByEmployee: Record<string, number> = {};
  employees.forEach((name) => {
    countByEmployee[name] = thisWeekAppointments.filter(
      (a) => (a.assignedTo || "").toLowerCase() === name.toLowerCase()
    ).length;
  });
  const sortedEmployees = [...employees].sort(
    (a, b) => (countByEmployee[b] ?? 0) - (countByEmployee[a] ?? 0)
  );

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={Icons.people(C.accent, 22)}
          label="Total current clients"
          value={analytics.totalClients}
          bgColor={C.accentLight}
          delay={0}
        />
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
            animation: "cardIn 0.5s ease 0.06s both",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: trend.isUp ? C.greenLight : C.redLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {Icons.chartBar(trend.isUp ? C.green : C.red, 22)}
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
              {analytics.clientsThisWeek}{" "}
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: trend.isUp ? C.green : C.red,
                }}
              >
                ({trend.isUp ? "+" : "-"}
                {trend.value}%)
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.textSoft,
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              Weekly trend (vs {analytics.clientsLastWeek} last week)
            </div>
          </div>
        </div>
        <StatCard
          icon={Icons.alert(C.red, 22)}
          label="Cancellations this week"
          value={analytics.cancellationsThisWeek}
          bgColor={C.redLight}
          delay={0.12}
        />
      </div>

      <h3
        style={{
          fontSize: 17,
          fontFamily: C.heading,
          fontWeight: 700,
          color: C.text,
          margin: "0 0 14px 0",
        }}
      >
        Customers served by employee (this week)
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sortedEmployees.map((name, index) => {
          const count = countByEmployee[name] ?? 0;
          return (
            <div
              key={name}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: C.radius,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: C.shadow,
                animation: `slideUp 0.4s ease ${index * 0.05}s both`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: C.accentLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Icons.people(C.accent, 22)}
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
                    {name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {count === 1 ? "1 customer" : `${count} customers`} this week
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.accent,
                  fontFamily: C.heading,
                }}
              >
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
