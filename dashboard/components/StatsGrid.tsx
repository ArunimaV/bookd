import React from "react";
import { C } from "../theme";
import { Icons } from "../icons";
import type { WeeklyStats } from "../types";
import { StatCard } from "./StatCard";

interface StatsGridProps {
  stats: WeeklyStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard
        icon={Icons.phone(C.accent, 22)}
        label="Calls This Week"
        value={stats.calls}
        bgColor={C.accentLight}
        delay={0}
      />
      <StatCard
        icon={Icons.text(C.blue, 22)}
        label="Texts This Week"
        value={stats.texts}
        bgColor={C.blueLight}
        delay={0.06}
      />
      <StatCard
        icon={Icons.check(C.green, 22)}
        label="Booked"
        value={stats.booked}
        bgColor={C.greenLight}
        delay={0.12}
      />
      <StatCard
        icon={Icons.alert(C.red, 22)}
        label="Missed"
        value={stats.missed}
        bgColor={C.redLight}
        delay={0.18}
      />
    </div>
  );
}
