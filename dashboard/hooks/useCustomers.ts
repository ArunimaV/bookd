import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Appointment, AppointmentStatus } from '../types';

export interface Customer {
  id: string;
  business_id: string;
  business_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string | null;
  notes: string | null;
  last_appointment: string | null;
  appointment_time: string | null;
  month: string | null;
  day: string | null;
  call_id: string | null;
  call_transcript: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
}

// Helper to get full name
export function getCustomerName(customer: Customer): string {
  return `${customer.first_name} ${customer.last_name}`.trim() || 'Unknown';
}

// Month name to number mapping
const MONTH_MAP: Record<string, string> = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
  'oct': '10', 'nov': '11', 'dec': '12',
};

/**
 * Convert a customer with appointment data into an Appointment object
 */
export function customerToAppointment(customer: Customer, index: number): Appointment | null {
  // Must have at least appointment type and some date info
  if (!customer.last_appointment || (!customer.month && !customer.day)) {
    return null;
  }

  // Parse month - could be name or number
  let monthNum = '01';
  if (customer.month) {
    const monthLower = customer.month.toLowerCase().trim();
    if (MONTH_MAP[monthLower]) {
      monthNum = MONTH_MAP[monthLower];
    } else if (/^\d{1,2}$/.test(customer.month)) {
      monthNum = customer.month.padStart(2, '0');
    }
  }

  // Parse day
  const dayNum = customer.day ? customer.day.padStart(2, '0') : '01';

  // Build date string (assume current year 2026)
  const dateStr = `2026-${monthNum}-${dayNum}`;

  // Parse time or default
  const timeStr = customer.appointment_time || '12:00 PM';

  return {
    id: index + 1,
    client: getCustomerName(customer),
    service: customer.last_appointment,
    date: dateStr,
    time: timeStr,
    duration: '30 min', // Default duration
    status: 'confirmed' as AppointmentStatus,
    phone: customer.phone_number,
  };
}

/**
 * Get appointments from customers who have appointment data
 */
export function getAppointmentsFromCustomers(customers: Customer[]): Appointment[] {
  return customers
    .map((customer, index) => customerToAppointment(customer, index))
    .filter((apt): apt is Appointment => apt !== null);
}

interface UseCustomersOptions {
  businessName: string | undefined;
  enabled?: boolean;
}

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch customers from Supabase by business_name
 */
export function useCustomers({ 
  businessName,
  enabled = true 
}: UseCustomersOptions): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!businessName || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/customers?business_name=${encodeURIComponent(businessName)}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setCustomers(data);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [businessName, enabled]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
  };
}
