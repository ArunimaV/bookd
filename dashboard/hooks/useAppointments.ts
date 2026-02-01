import { useState, useEffect, useCallback } from 'react';
import type { Appointment, AppointmentStatus } from '../types';

// Raw appointment from Supabase
interface DBAppointment {
  id: string;
  created_at: string;
  business_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  service_type: string;
  status: string;
  google_event_id: string | null;
  notes: string | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string | null;
  } | null;
}

interface UseAppointmentsOptions {
  businessId: string | undefined;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Convert DB status to frontend status
function mapStatus(dbStatus: string): AppointmentStatus {
  const statusMap: Record<string, AppointmentStatus> = {
    pending: 'pending',
    confirmed: 'confirmed',
    cancelled: 'cancelled',
    completed: 'confirmed', // completed shows as confirmed
  };
  return statusMap[dbStatus] || 'pending';
}

// Calculate duration from start and end times
function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hr`;
  }
  return `${minutes} min`;
}

// Format time for display (e.g., "10:00 AM")
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format date for display (e.g., "2026-02-01")
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

// Transform DB appointment to frontend format
function transformAppointment(db: DBAppointment, index: number): Appointment {
  const customerName = db.customer
    ? `${db.customer.first_name} ${db.customer.last_name}`.trim()
    : 'Unknown Customer';
  
  const phone = db.customer?.phone_number || '';
  
  return {
    id: index + 1, // Frontend expects numeric id
    client: customerName,
    service: db.service_type,
    date: formatDate(db.start_time),
    time: formatTime(db.start_time),
    duration: calculateDuration(db.start_time, db.end_time),
    status: mapStatus(db.status),
    phone: phone,
    // assignedTo is not in DB schema yet, can add later
  };
}

/**
 * Hook to fetch appointments from Supabase
 */
export function useAppointments({
  businessId,
  startDate,
  endDate,
  enabled = true,
}: UseAppointmentsOptions): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!businessId || !enabled) {
      console.log('[useAppointments] Skipping fetch - businessId:', businessId, 'enabled:', enabled);
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams({ business_id: businessId });
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      
      console.log('[useAppointments] Fetching appointments for business:', businessId);
      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();
      console.log('[useAppointments] API response:', data);

      if (Array.isArray(data)) {
        const transformed = data.map(transformAppointment);
        setAppointments(transformed);
        setError(null);
        console.log('[useAppointments] Loaded', transformed.length, 'appointments');
      } else if (data.error) {
        setError(data.error);
        console.error('[useAppointments] API error:', data.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMsg);
      console.error('[useAppointments] Fetch error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [businessId, startDate, endDate, enabled]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}
