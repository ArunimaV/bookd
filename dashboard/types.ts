import { ReactNode } from "react";

export type LeadStatus = "new" | "in_progress" | "handled" | "urgent";
export type AppointmentStatus = "confirmed" | "pending" | "reminder_sent" | "cancelled";
export type Channel = "call" | "text";
export type AllStatus = LeadStatus | AppointmentStatus;
export type TabId = "inbox" | "calendar" | "leads" | "business_analytics";
export type InboxFilter = "all" | "new" | "replied" | "urgent";

export interface Lead {
  id: number;
  name: string;
  phone: string;
  message: string;
  time: string;
  status: LeadStatus;
  channel: Channel;
  replied: boolean;
  aiReply?: string;
}

export interface Appointment {
  id: number;
  client: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  status: AppointmentStatus;
  phone: string;
  assignedTo?: string;
}

export interface BusinessAnalytics {
  totalClients: number;
  clientsThisWeek: number;
  clientsLastWeek: number;
  cancellationsThisWeek: number;
}

export interface WeeklyStats {
  calls: number;
  texts: number;
  booked: number;
  missed: number;
}

export interface StatusStyle {
  label: string;
  bg: string;
  color: string;
  dot: string;
}

export interface TabDef {
  id: TabId;
  label: string;
  icon: (c?: string, s?: number) => ReactNode;
  count: number | null;
}
