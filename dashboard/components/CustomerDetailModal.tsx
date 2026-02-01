import React, { useEffect, useState } from "react";
import { C } from "../theme";
import { Avatar } from "./Avatar";
import type { Customer } from "../hooks/useCustomers";
import { getCustomerName } from "../hooks/useCustomers";
import type { Appointment } from "../types";

interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: string[];
  display_order: number;
}

interface CustomerDetailModalProps {
  customer: Customer | null;
  businessId: string | undefined;
  appointments?: Appointment[];
  onClose: () => void;
}

export function CustomerDetailModal({ 
  customer, 
  businessId,
  appointments = [],
  onClose 
}: CustomerDetailModalProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Fetch custom field definitions for this business
  useEffect(() => {
    if (!businessId) return;

    const fetchFieldDefinitions = async () => {
      try {
        const response = await fetch(`/api/custom-fields?business_id=${businessId}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setFieldDefinitions(data.sort((a, b) => a.display_order - b.display_order));
        }
      } catch (err) {
        console.error("Failed to fetch field definitions:", err);
      }
    };

    fetchFieldDefinitions();
  }, [businessId]);

  if (!customer) return null;

  const customerName = getCustomerName(customer);

  // Get appointments for this customer
  const customerAppointments = appointments
    .filter((apt) => apt.phone === customer.phone_number)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFieldValue = (value: any, fieldType: string): string => {
    if (value === null || value === undefined) return "Not provided";
    if (fieldType === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const formatFieldKey = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          background: C.card,
          borderRadius: C.radius,
          boxShadow: C.shadowLg,
          zIndex: 1001,
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={customerName} size={48} />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: C.heading,
                  color: C.text,
                }}
              >
                {customerName}
              </h2>
              <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2 }}>
                Customer since {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: C.textMuted,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          {/* Contact Info Section */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}
            >
              Contact Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow label="Phone" value={customer.phone_number} />
              <InfoRow label="Email" value={customer.email || "Not provided"} />
              <InfoRow label="Last Appointment" value={formatDate(customer.last_appointment)} />
            </div>
          </div>

          {/* Notes Section */}
          {customer.notes && (
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 12px 0",
                }}
              >
                Notes
              </h3>
              <div
                style={{
                  padding: "12px 14px",
                  background: C.bg,
                  borderRadius: C.radiusSm,
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.5,
                }}
              >
                {customer.notes}
              </div>
            </div>
          )}

          {/* Custom Fields Section */}
          {Object.keys(customer.custom_fields || {}).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 12px 0",
                }}
              >
                Additional Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fieldDefinitions.length > 0
                  ? fieldDefinitions.map((fieldDef) => {
                      const value = customer.custom_fields?.[fieldDef.field_name];
                      if (value === undefined) return null;
                      return (
                        <InfoRow
                          key={fieldDef.id}
                          label={fieldDef.field_label}
                          value={formatFieldValue(value, fieldDef.field_type)}
                        />
                      );
                    })
                  : Object.entries(customer.custom_fields || {}).map(([key, value]) => (
                      <InfoRow
                        key={key}
                        label={formatFieldKey(key)}
                        value={String(value)}
                      />
                    ))}
              </div>
            </div>
          )}

          {/* Appointments Section */}
          <div>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}
            >
              Appointments
            </h3>
            {customerAppointments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {customerAppointments.slice(0, 5).map((apt) => (
                  <AppointmentRow key={apt.id} appointment={apt} />
                ))}
                {customerAppointments.length > 5 && (
                  <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: 8 }}>
                    + {customerAppointments.length - 5} more appointments
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 16px",
                  background: C.bg,
                  borderRadius: C.radiusSm,
                  color: C.textMuted,
                  fontSize: 13,
                }}
              >
                No appointments scheduled
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={() => {
              // TODO: Implement booking flow
              alert("Booking flow coming soon!");
            }}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: C.accent,
              color: "#FFF",
              border: "none",
              borderRadius: C.radiusSm,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book Appointment
          </button>
          <button
            onClick={() => window.open(`tel:${customer.phone_number}`, "_self")}
            title={`Call ${customer.phone_number}`}
            style={{
              padding: "10px 16px",
              background: C.bg,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call
          </button>
          <button
            onClick={() => window.open(`sms:${customer.phone_number}`, "_self")}
            title={`Text ${customer.phone_number}`}
            style={{
              padding: "10px 16px",
              background: C.bg,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.body,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Text
          </button>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        background: C.bg,
        borderRadius: C.radiusSm,
      }}
    >
      <span style={{ fontSize: 13, color: C.textSoft }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value}</span>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const isPast = new Date(appointment.date) < new Date();
  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: C.greenLight, text: C.green },
    pending: { bg: C.yellowLight, text: C.yellow },
    cancelled: { bg: C.redLight, text: C.red },
    reminder_sent: { bg: C.blueLight, text: C.blue },
  };
  const colors = statusColors[appointment.status] || statusColors.pending;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        background: C.bg,
        borderRadius: C.radiusSm,
        opacity: isPast ? 0.6 : 1,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
          {appointment.service}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
          {new Date(appointment.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          at {appointment.time}
        </div>
      </div>
      <div
        style={{
          padding: "4px 10px",
          borderRadius: 12,
          background: colors.bg,
          fontSize: 11,
          fontWeight: 700,
          color: colors.text,
          textTransform: "capitalize",
        }}
      >
        {appointment.status.replace("_", " ")}
      </div>
    </div>
  );
}
