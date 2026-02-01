import React from "react";
import { C } from "../theme";
import { Avatar } from "./Avatar";
import type { Customer } from "../hooks/useCustomers";
import { getCustomerName } from "../hooks/useCustomers";
import type { Appointment } from "../types";

interface CustomerCardProps {
  customer: Customer;
  appointments?: Appointment[];
  onClick: () => void;
  delay?: number;
}

export function CustomerCard({ 
  customer, 
  appointments = [],
  onClick, 
  delay = 0 
}: CustomerCardProps) {
  const customerName = getCustomerName(customer);
  
  // Find next upcoming appointment for this customer
  const nextAppointment = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        return (
          apt.phone === customer.phone_number &&
          aptDate >= today &&
          apt.status !== "cancelled"
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [appointments, customer.phone_number]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No appointments";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radiusSm,
        cursor: "pointer",
        transition: "all 0.2s",
        animation: `slideUp 0.3s ease ${delay}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.bg;
        e.currentTarget.style.borderColor = C.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.card;
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <Avatar name={customerName} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {customerName}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft }}>
          {customer.phone_number}
        </div>
        
        {/* Next Appointment Badge */}
        {nextAppointment ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              padding: "3px 8px",
              background: C.accentLight,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: C.accent,
            }}
          >
            <span>📅</span>
            <span>
              {formatDate(nextAppointment.date)} · {nextAppointment.time}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            {customer.last_appointment 
              ? `Last visit: ${formatDate(customer.last_appointment)}`
              : "No appointments yet"
            }
          </div>
        )}
      </div>
    </div>
  );
}
