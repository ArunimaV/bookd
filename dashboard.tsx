import { useState, ReactNode } from "react";

const FONT_LINK: string = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=Nunito:wght@400;500;600;700;800&display=swap";

// ── Types ─────────────────────────────────────────────────
type LeadStatus = "new" | "in_progress" | "handled" | "urgent";
type AppointmentStatus = "confirmed" | "pending" | "reminder_sent";
type Channel = "call" | "text";
type AllStatus = LeadStatus | AppointmentStatus;
type TabId = "inbox" | "calendar" | "leads";
type InboxFilter = "all" | "new" | "replied" | "urgent";

interface Lead {
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

interface Appointment {
  id: number;
  client: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  status: AppointmentStatus;
  phone: string;
}

interface WeeklyStats {
  calls: number;
  texts: number;
  booked: number;
  missed: number;
}

interface StatusStyle {
  label: string;
  bg: string;
  color: string;
  dot: string;
}

interface TabDef {
  id: TabId;
  label: string;
  icon: (c?: string, s?: number) => ReactNode;
  count: number | null;
}

// ── Friendly seed data ────────────────────────────────────
const LEADS: Lead[] = [
  { id: 1, name: "Maria Chen", phone: "(555) 234-5678", message: "Hi, I'd love to book a facial for next week!", time: "10 min ago", status: "new", channel: "text", replied: false },
  { id: 2, name: "James Wright", phone: "(555) 876-1234", message: "Do you accept walk-ins on Saturdays?", time: "32 min ago", status: "new", channel: "call", replied: false },
  { id: 3, name: "Priya Patel", phone: "(555) 345-9012", message: "Can I reschedule my Thursday appointment?", time: "1 hr ago", status: "in_progress", channel: "text", replied: true, aiReply: "Of course! I've moved you to Friday at 2 PM. Does that work?" },
  { id: 4, name: "Tom Bakker", phone: "(555) 567-3456", message: "What are your prices for a men's haircut?", time: "2 hrs ago", status: "handled", channel: "text", replied: true, aiReply: "Our men's cuts start at $35. Would you like to book one?" },
  { id: 5, name: "Sofia Reyes", phone: "(555) 890-4567", message: "Called twice, no answer. Need appointment ASAP.", time: "3 hrs ago", status: "urgent", channel: "call", replied: false },
  { id: 6, name: "Derek Holms", phone: "(555) 123-7890", message: "Thanks for the reminder! I'll be there.", time: "4 hrs ago", status: "handled", channel: "text", replied: true, aiReply: "Great, see you tomorrow at 11 AM!" },
];

const APPOINTMENTS: Appointment[] = [
  { id: 1, client: "Maria Chen", service: "Facial Treatment", date: "2026-02-01", time: "10:00 AM", duration: "60 min", status: "confirmed", phone: "(555) 234-5678" },
  { id: 2, client: "Lena Cho", service: "Hair Coloring", date: "2026-02-01", time: "1:00 PM", duration: "90 min", status: "confirmed", phone: "(555) 456-7890" },
  { id: 3, client: "Priya Patel", service: "Manicure", date: "2026-02-02", time: "2:00 PM", duration: "45 min", status: "confirmed", phone: "(555) 345-9012" },
  { id: 4, client: "Tom Bakker", service: "Men's Haircut", date: "2026-02-02", time: "3:30 PM", duration: "30 min", status: "pending", phone: "(555) 567-3456" },
  { id: 5, client: "Alex Johnson", service: "Deep Tissue Massage", date: "2026-02-03", time: "9:00 AM", duration: "60 min", status: "confirmed", phone: "(555) 678-1234" },
  { id: 6, client: "Nina Williams", service: "Facial Treatment", date: "2026-02-03", time: "11:30 AM", duration: "60 min", status: "reminder_sent", phone: "(555) 789-2345" },
  { id: 7, client: "Derek Holms", service: "Beard Trim", date: "2026-02-04", time: "11:00 AM", duration: "20 min", status: "confirmed", phone: "(555) 123-7890" },
  { id: 8, client: "Sofia Reyes", service: "Consultation", date: "2026-02-04", time: "4:00 PM", duration: "30 min", status: "pending", phone: "(555) 890-4567" },
];

const WEEKLY_STATS: WeeklyStats = { calls: 47, texts: 83, booked: 31, missed: 3 };

// ── Color Tokens ──────────────────────────────────────────
const C = {
  bg: "#FBF8F4",
  card: "#FFFFFF",
  cardHover: "#FEFCF9",
  border: "#F0EAE0",
  borderDark: "#E4DCD0",
  text: "#2C2418",
  textSoft: "#6B5D4D",
  textMuted: "#A89B8A",
  accent: "#E07A3A",
  accentLight: "#FDF0E8",
  accentDark: "#C4622A",
  green: "#3BA55D",
  greenLight: "#EBF7EF",
  greenDark: "#2D8A49",
  blue: "#4A90D9",
  blueLight: "#EDF4FC",
  red: "#D94A4A",
  redLight: "#FDECEC",
  yellow: "#E8B931",
  yellowLight: "#FEF8E7",
  purple: "#8B6CC1",
  purpleLight: "#F3EFF9",
  shadow: "0 1px 3px rgba(44,36,24,0.06), 0 1px 2px rgba(44,36,24,0.04)",
  shadowLg: "0 4px 12px rgba(44,36,24,0.08), 0 2px 4px rgba(44,36,24,0.04)",
  radius: "14px",
  radiusSm: "10px",
  heading: "'Fraunces', serif",
  body: "'Nunito', sans-serif",
} as const;

// ── Icons ─────────────────────────────────────────────────
const Icons = {
  inbox: (c: string = C.textSoft, s: number = 20): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
  calendar: (c: string = C.textSoft, s: number = 20): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  people: (c: string = C.textSoft, s: number = 20): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  phone: (c: string = C.textSoft, s: number = 16): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  text: (c: string = C.textSoft, s: number = 16): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  check: (c: string = C.green, s: number = 16): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: (c: string = C.red, s: number = 16): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  clock: (c: string = C.textMuted, s: number = 14): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  chevLeft: (c: string = C.textSoft, s: number = 18): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevRight: (c: string = C.textSoft, s: number = 18): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  send: (c: string = "#FFF", s: number = 16): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  bot: (c: string = C.accent, s: number = 18): ReactNode => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/></svg>,
};

// ── Helper components ─────────────────────────────────────
const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const colors: string[] = ["#E07A3A", "#4A90D9", "#3BA55D", "#D94A4A", "#8B6CC1", "#E8B931"];
  const idx: number = name.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colors[idx], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#FFF", fontFamily: C.body, flexShrink: 0 }}>
      {name.split(" ").map((n: string) => n[0]).join("")}
    </div>
  );
};

const StatusPill = ({ status }: { status: AllStatus }) => {
  const map: Record<string, StatusStyle> = {
    new: { label: "New", bg: C.accentLight, color: C.accent, dot: C.accent },
    in_progress: { label: "AI Replied", bg: C.blueLight, color: C.blue, dot: C.blue },
    handled: { label: "Done", bg: C.greenLight, color: C.greenDark, dot: C.green },
    urgent: { label: "Needs You", bg: C.redLight, color: C.red, dot: C.red },
    confirmed: { label: "Confirmed", bg: C.greenLight, color: C.greenDark, dot: C.green },
    pending: { label: "Pending", bg: C.yellowLight, color: "#9A7B1A", dot: C.yellow },
    reminder_sent: { label: "Reminded", bg: C.blueLight, color: C.blue, dot: C.blue },
  };
  const s: StatusStyle = map[status] || map.handled;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 8px", borderRadius: 999, background: s.bg, fontSize: 12, fontWeight: 700, color: s.color, fontFamily: C.body }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────
interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  delay: number;
}

const StatCard = ({ icon, label, value, bgColor, delay }: StatCardProps) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "18px 20px",
    display: "flex", alignItems: "center", gap: 14, boxShadow: C.shadow,
    animation: `cardIn 0.5s ease ${delay}s both`,
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: C.heading, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.textSoft, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// ── Lead Card (Inbox) ─────────────────────────────────────
interface LeadCardProps {
  lead: Lead;
  selected: boolean;
  onClick: () => void;
  delay: number;
}

const LeadCard = ({ lead, selected, onClick, delay }: LeadCardProps) => (
  <div onClick={onClick} style={{
    background: selected ? C.accentLight : C.card,
    border: `1.5px solid ${selected ? C.accent : C.border}`,
    borderRadius: C.radiusSm, padding: "14px 16px", cursor: "pointer",
    boxShadow: selected ? C.shadowLg : C.shadow,
    transition: "all 0.2s ease",
    animation: `slideUp 0.4s ease ${delay}s both`,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={lead.name} size={36} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{lead.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
            {lead.channel === "call" ? Icons.phone(C.textMuted, 12) : Icons.text(C.textMuted, 12)}
            <span style={{ fontSize: 12, color: C.textMuted }}>{lead.phone}</span>
          </div>
        </div>
      </div>
      <StatusPill status={lead.status} />
    </div>
    <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5, margin: 0 }}>"{lead.message}"</p>
    {lead.replied && lead.aiReply && (
      <div style={{ marginTop: 8, padding: "8px 10px", background: C.blueLight, borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
        {Icons.bot(C.blue, 14)}
        <p style={{ fontSize: 12, color: C.blue, margin: 0, lineHeight: 1.4, fontWeight: 500 }}>Teli replied: "{lead.aiReply}"</p>
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
      {Icons.clock(C.textMuted, 12)}
      <span style={{ fontSize: 11, color: C.textMuted }}>{lead.time}</span>
    </div>
  </div>
);

// ── Lead Detail Panel ─────────────────────────────────────
const LeadDetail = ({ lead }: { lead: Lead | null }) => {
  if (!lead) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        {Icons.inbox(C.accent, 28)}
      </div>
      <h3 style={{ fontSize: 18, fontFamily: C.heading, color: C.text, fontWeight: 700, marginBottom: 4 }}>Select a message</h3>
      <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 240 }}>Click on any conversation to see the full details and take action.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeIn 0.3s ease" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <Avatar name={lead.name} size={48} />
          <div>
            <h3 style={{ fontSize: 18, fontFamily: C.heading, fontWeight: 700, color: C.text, margin: 0 }}>{lead.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              {lead.channel === "call" ? Icons.phone(C.textMuted, 13) : Icons.text(C.textMuted, 13)}
              <span style={{ fontSize: 13, color: C.textMuted }}>{lead.phone}</span>
              <span style={{ margin: "0 4px", color: C.border }}>·</span>
              <StatusPill status={lead.status} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Avatar name={lead.name} size={30} />
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "4px 14px 14px 14px", padding: "10px 14px", maxWidth: "80%" }}>
            <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.5 }}>{lead.message}</p>
            <span style={{ fontSize: 11, color: C.textMuted, marginTop: 4, display: "block" }}>{lead.time}</span>
          </div>
        </div>
        {lead.replied && lead.aiReply && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: "row-reverse" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {Icons.bot(C.accent, 16)}
            </div>
            <div style={{ background: C.accent, borderRadius: "14px 4px 14px 14px", padding: "10px 14px", maxWidth: "80%" }}>
              <p style={{ fontSize: 14, color: "#FFF", margin: 0, lineHeight: 1.5 }}>{lead.aiReply}</p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4, display: "block" }}>Teli AI · just now</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <button style={{ flex: 1, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: C.accent, color: "#FFF", border: "none", fontFamily: C.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {Icons.send("#FFF", 14)} Reply
        </button>
        <button style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: C.greenLight, color: C.greenDark, border: `1px solid ${C.green}30`, fontFamily: C.body }}>
          Book Appointment
        </button>
        <button style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: C.redLight, color: C.red, border: `1px solid ${C.red}30`, fontFamily: C.body }}>
          Call Back
        </button>
      </div>
    </div>
  );
};

// ── Calendar Tab ──────────────────────────────────────────
const CalendarTab = (): ReactNode => {
  const today: Date = new Date(2026, 1, 1);
  const [weekStart, setWeekStart] = useState<Date>(new Date(2026, 0, 26));

  const days: Date[] = Array.from({ length: 7 }, (_, i: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayNames: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getAppts = (date: Date): Appointment[] => {
    const dateStr: string = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return APPOINTMENTS.filter((a: Appointment) => a.date === dateStr);
  };

  const shiftWeek = (dir: number): void => {
    const nw = new Date(weekStart);
    nw.setDate(nw.getDate() + dir * 7);
    setWeekStart(nw);
  };

  const isToday = (d: Date): boolean => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontFamily: C.heading, fontWeight: 700, color: C.text, margin: 0 }}>
          {monthNames[days[0].getMonth()]} {days[0].getFullYear()}
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => shiftWeek(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadow }}>
            {Icons.chevLeft(C.textSoft)}
          </button>
          <button onClick={() => setWeekStart(new Date(2026, 0, 26))} style={{ padding: "0 14px", height: 36, borderRadius: 10, background: C.accent, color: "#FFF", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: C.body }}>
            Today
          </button>
          <button onClick={() => shiftWeek(1)} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadow }}>
            {Icons.chevRight(C.textSoft)}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((d: Date, i: number) => {
          const appts: Appointment[] = getAppts(d);
          const todayFlag: boolean = isToday(d);
          return (
            <div key={i} style={{
              background: todayFlag ? C.accentLight : C.card,
              border: `1.5px solid ${todayFlag ? C.accent : C.border}`,
              borderRadius: C.radius, padding: 14, minHeight: 200,
              boxShadow: todayFlag ? C.shadowLg : C.shadow,
              animation: `slideUp 0.4s ease ${i * 0.05}s both`,
            }}>
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: todayFlag ? C.accent : C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {dayNames[i]}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 700, fontFamily: C.heading,
                  width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "4px auto 0",
                  background: todayFlag ? C.accent : "transparent", color: todayFlag ? "#FFF" : C.text,
                }}>
                  {d.getDate()}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {appts.map((a: Appointment, j: number) => (
                  <div key={j} style={{
                    background: a.status === "pending" ? C.yellowLight : a.status === "reminder_sent" ? C.blueLight : C.greenLight,
                    borderRadius: 8, padding: "8px 10px",
                    borderLeft: `3px solid ${a.status === "pending" ? C.yellow : a.status === "reminder_sent" ? C.blue : C.green}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.time}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{a.client}</div>
                    <div style={{ fontSize: 11, color: C.textSoft }}>{a.service}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{a.duration}</div>
                  </div>
                ))}
                {appts.length === 0 && (
                  <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "20px 0", fontStyle: "italic" }}>No appointments</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: 20, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 16, fontFamily: C.heading, fontWeight: 700, color: C.text, margin: "0 0 14px 0" }}>All Upcoming</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {APPOINTMENTS.map((a: Appointment, i: number) => (
            <div key={a.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", borderRadius: C.radiusSm, background: C.bg, border: `1px solid ${C.border}`,
              animation: `slideUp 0.3s ease ${i * 0.04}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={a.client} size={34} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{a.client}</div>
                  <div style={{ fontSize: 12, color: C.textSoft }}>{a.service} · {a.duration}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.time}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                </div>
                <StatusPill status={a.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Leads Tab ─────────────────────────────────────────────
const LeadsTab = (): ReactNode => {
  const sorted: Lead[] = [...LEADS].sort((a: Lead, b: Lead) => {
    const order: Record<LeadStatus, number> = { urgent: 0, new: 1, in_progress: 2, handled: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });
  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <h2 style={{ fontSize: 22, fontFamily: C.heading, fontWeight: 700, color: C.text, margin: "0 0 16px 0" }}>All Leads</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {sorted.map((lead: Lead, i: number) => (
          <div key={lead.id} style={{
            background: C.card, border: `1.5px solid ${lead.status === "urgent" ? C.red + "40" : C.border}`, borderRadius: C.radius,
            padding: 18, boxShadow: C.shadow, animation: `slideUp 0.4s ease ${i * 0.06}s both`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar name={lead.name} size={40} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                    {lead.channel === "call" ? Icons.phone(C.textMuted, 12) : Icons.text(C.textMuted, 12)}
                    {lead.phone}
                  </div>
                </div>
              </div>
              <StatusPill status={lead.status} />
            </div>
            <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5, margin: "0 0 10px 0" }}>"{lead.message}"</p>
            {lead.replied && lead.aiReply && (
              <div style={{ padding: "8px 10px", background: C.blueLight, borderRadius: 8, marginBottom: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
                {Icons.bot(C.blue, 14)}
                <p style={{ fontSize: 12, color: C.blue, margin: 0, lineHeight: 1.4 }}>Teli: "{lead.aiReply}"</p>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>{Icons.clock(C.textMuted, 12)} {lead.time}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: C.accent, color: "#FFF", border: "none", cursor: "pointer", fontFamily: C.body }}>Reply</button>
                <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: C.greenLight, color: C.greenDark, border: "none", cursor: "pointer", fontFamily: C.body }}>Book</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────
export default function App(): ReactNode {
  const [tab, setTab] = useState<TabId>("inbox");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");

  const filteredLeads: Lead[] = inboxFilter === "all" ? LEADS
    : inboxFilter === "new" ? LEADS.filter((l: Lead) => l.status === "new" || l.status === "urgent")
    : inboxFilter === "replied" ? LEADS.filter((l: Lead) => l.replied)
    : LEADS.filter((l: Lead) => l.status === "urgent");

  const tabs: TabDef[] = [
    { id: "inbox", label: "Inbox", icon: Icons.inbox, count: LEADS.filter((l: Lead) => l.status === "new" || l.status === "urgent").length },
    { id: "calendar", label: "Calendar", icon: Icons.calendar, count: null },
    { id: "leads", label: "All Leads", icon: Icons.people, count: LEADS.length },
  ];

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.borderDark}; border-radius: 10px; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      `}</style>
      <div style={{ fontFamily: C.body, color: C.text, background: C.bg, minHeight: "100vh" }}>
        {/* ── Header ──────────────── */}
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(44,36,24,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #F4A261)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${C.accent}40` }}>
              {Icons.bot("#FFF", 20)}
            </div>
            <div>
              <h1 style={{ fontSize: 19, fontFamily: C.heading, fontWeight: 700, color: C.text, lineHeight: 1.2, margin: 0 }}>
                Bloom Studio
              </h1>
              <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Powered by Teli + OpenClaw</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.greenLight, borderRadius: 999, border: `1px solid ${C.green}30` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 2.5s ease infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark }}>AI Active</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 28px" }}>
          {/* ── Stats ─────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <StatCard icon={Icons.phone(C.accent, 22)} label="Calls This Week" value={WEEKLY_STATS.calls} color={C.accent} bgColor={C.accentLight} delay={0} />
            <StatCard icon={Icons.text(C.blue, 22)} label="Texts This Week" value={WEEKLY_STATS.texts} color={C.blue} bgColor={C.blueLight} delay={0.06} />
            <StatCard icon={Icons.check(C.green, 22)} label="Booked" value={WEEKLY_STATS.booked} color={C.green} bgColor={C.greenLight} delay={0.12} />
            <StatCard icon={Icons.alert(C.red, 22)} label="Missed" value={WEEKLY_STATS.missed} color={C.red} bgColor={C.redLight} delay={0.18} />
          </div>

          {/* ── Tabs ──────────────── */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, width: "fit-content", boxShadow: C.shadow }}>
            {tabs.map((t: TabDef) => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedLead(null); }} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                cursor: "pointer", border: "none", fontFamily: C.body, transition: "all 0.2s",
                background: tab === t.id ? C.accent : "transparent",
                color: tab === t.id ? "#FFF" : C.textSoft,
              }}>
                {t.icon(tab === t.id ? "#FFF" : C.textSoft, 17)}
                {t.label}
                {t.count !== null && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 999,
                    background: tab === t.id ? "rgba(255,255,255,0.25)" : C.accentLight,
                    color: tab === t.id ? "#FFF" : C.accent,
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Content ────────── */}
          {tab === "inbox" && (
            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, animation: "fadeIn 0.3s ease" }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden", boxShadow: C.shadow }}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {([["all", "All"], ["new", "New"], ["replied", "AI Replied"], ["urgent", "Needs You"]] as const).map(([key, label]) => (
                      <button key={key} onClick={() => setInboxFilter(key as InboxFilter)} style={{
                        padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                        background: inboxFilter === key ? C.accentLight : "transparent",
                        color: inboxFilter === key ? C.accent : C.textMuted, fontFamily: C.body,
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ maxHeight: 520, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {filteredLeads.map((l: Lead, i: number) => (
                    <LeadCard key={l.id} lead={l} selected={selectedLead?.id === l.id} onClick={() => setSelectedLead(l)} delay={i * 0.05} />
                  ))}
                </div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, boxShadow: C.shadow, minHeight: 480 }}>
                <LeadDetail lead={selectedLead} />
              </div>
            </div>
          )}

          {tab === "calendar" && <CalendarTab />}
          {tab === "leads" && <LeadsTab />}
        </div>
      </div>
    </>
  );
}
