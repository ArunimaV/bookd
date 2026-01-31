import { Appointment, Lead, WeeklyStats, BusinessAnalytics } from "./types";

export const LEADS: Lead[] = [
  { id: 1, name: "Maria Chen", phone: "(555) 234-5678", message: "Hi, I'd love to book a facial for next week!", time: "10 min ago", status: "new", channel: "text", replied: false },
  { id: 2, name: "James Wright", phone: "(555) 876-1234", message: "Do you accept walk-ins on Saturdays?", time: "32 min ago", status: "new", channel: "call", replied: false },
  { id: 3, name: "Priya Patel", phone: "(555) 345-9012", message: "Can I reschedule my Thursday appointment?", time: "1 hr ago", status: "in_progress", channel: "text", replied: true, aiReply: "Of course! I've moved you to Friday at 2 PM. Does that work?" },
  { id: 4, name: "Tom Bakker", phone: "(555) 567-3456", message: "What are your prices for a men's haircut?", time: "2 hrs ago", status: "handled", channel: "text", replied: true, aiReply: "Our men's cuts start at $35. Would you like to book one?" },
  { id: 5, name: "Sofia Reyes", phone: "(555) 890-4567", message: "Called twice, no answer. Need appointment ASAP.", time: "3 hrs ago", status: "urgent", channel: "call", replied: false },
  { id: 6, name: "Derek Holms", phone: "(555) 123-7890", message: "Thanks for the reminder! I'll be there.", time: "4 hrs ago", status: "handled", channel: "text", replied: true, aiReply: "Great, see you tomorrow at 11 AM!" },
];

export const EMPLOYEES = ["Jamie", "Sam", "Jordan"];

export const APPOINTMENTS: Appointment[] = [
  { id: 1, client: "Maria Chen", service: "Facial Treatment", date: "2026-02-01", time: "10:00 AM", duration: "60 min", status: "confirmed", phone: "(555) 234-5678", assignedTo: "Jamie" },
  { id: 2, client: "Lena Cho", service: "Hair Coloring", date: "2026-02-01", time: "1:00 PM", duration: "90 min", status: "confirmed", phone: "(555) 456-7890", assignedTo: "Jordan" },
  { id: 3, client: "Priya Patel", service: "Manicure", date: "2026-02-02", time: "2:00 PM", duration: "45 min", status: "confirmed", phone: "(555) 345-9012", assignedTo: "Sam" },
  { id: 4, client: "Tom Bakker", service: "Men's Haircut", date: "2026-02-02", time: "3:30 PM", duration: "30 min", status: "pending", phone: "(555) 567-3456", assignedTo: "Jordan" },
  { id: 5, client: "Alex Johnson", service: "Deep Tissue Massage", date: "2026-02-03", time: "9:00 AM", duration: "60 min", status: "confirmed", phone: "(555) 678-1234", assignedTo: "Jamie" },
  { id: 6, client: "Nina Williams", service: "Facial Treatment", date: "2026-02-03", time: "11:30 AM", duration: "60 min", status: "reminder_sent", phone: "(555) 789-2345", assignedTo: "Jamie" },
  { id: 7, client: "Derek Holms", service: "Beard Trim", date: "2026-02-04", time: "11:00 AM", duration: "20 min", status: "confirmed", phone: "(555) 123-7890", assignedTo: "Jordan" },
  { id: 8, client: "Sofia Reyes", service: "Consultation", date: "2026-02-04", time: "4:00 PM", duration: "30 min", status: "pending", phone: "(555) 890-4567", assignedTo: "Sam" },
  { id: 9, client: "Chris Lee", service: "Haircut", date: "2026-02-01", time: "2:00 PM", duration: "30 min", status: "cancelled", phone: "(555) 111-2222", assignedTo: "Jordan" },
  { id: 10, client: "Morgan Hill", service: "Manicure", date: "2026-02-03", time: "3:00 PM", duration: "45 min", status: "cancelled", phone: "(555) 333-4444", assignedTo: "Sam" },
];

export const BUSINESS_ANALYTICS: BusinessAnalytics = {
  totalClients: 142,
  clientsThisWeek: 24,
  clientsLastWeek: 18,
  cancellationsThisWeek: 2,
};

export const WEEKLY_STATS: WeeklyStats = { calls: 47, texts: 83, booked: 31, missed: 3 };
