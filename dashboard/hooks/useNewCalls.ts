import { useState, useEffect, useCallback, useRef } from 'react'

export interface CustomerFromCall {
  id: string
  business_id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  custom_fields: Record<string, string>
  created_at: string
  is_new: boolean
}

interface UseNewCallsOptions {
  businessId: string | null
  pollInterval?: number // in milliseconds, default 5000 (5 seconds)
  enabled?: boolean
}

interface UseNewCallsReturn {
  customers: CustomerFromCall[]
  newCustomers: CustomerFromCall[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearNewCustomers: () => void
}

/**
 * Hook to poll for new calls/customers
 * Automatically fetches new customers at regular intervals
 */
export function useNewCalls({
  businessId,
  pollInterval = 5000,
  enabled = true,
}: UseNewCallsOptions): UseNewCallsReturn {
  const [customers, setCustomers] = useState<CustomerFromCall[]>([])
  const [newCustomers, setNewCustomers] = useState<CustomerFromCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTime = useRef<string | null>(null)

  // Fetch recent customers (initial load)
  const fetchRecentCustomers = useCallback(async () => {
    if (!businessId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/calls?business_id=${businessId}&limit=20`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch customers')
      }

      setCustomers(data.customers || [])

      // Set the timestamp for polling
      if (data.customers && data.customers.length > 0) {
        lastFetchTime.current = data.customers[0].created_at
      } else {
        lastFetchTime.current = new Date().toISOString()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  // Poll for new customers since last fetch
  const pollForNewCustomers = useCallback(async () => {
    if (!businessId || !lastFetchTime.current) return

    try {
      const response = await fetch(
        `/api/calls?business_id=${businessId}&since=${encodeURIComponent(lastFetchTime.current)}`
      )
      const data = await response.json()

      if (!data.success) {
        console.error('Poll error:', data.error)
        return
      }

      if (data.customers && data.customers.length > 0) {
        // Update the timestamp
        lastFetchTime.current = data.customers[0].created_at

        // Add new customers to both lists
        setNewCustomers((prev) => [...data.customers, ...prev])
        setCustomers((prev) => [...data.customers, ...prev])
      }
    } catch (err) {
      console.error('Poll error:', err)
    }
  }, [businessId])

  // Clear new customers notification
  const clearNewCustomers = useCallback(() => {
    setNewCustomers([])
  }, [])

  // Refetch all data
  const refetch = useCallback(async () => {
    await fetchRecentCustomers()
    setNewCustomers([])
  }, [fetchRecentCustomers])

  // Initial fetch
  useEffect(() => {
    if (enabled && businessId) {
      fetchRecentCustomers()
    }
  }, [enabled, businessId, fetchRecentCustomers])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !businessId) return

    const interval = setInterval(pollForNewCustomers, pollInterval)
    return () => clearInterval(interval)
  }, [enabled, businessId, pollInterval, pollForNewCustomers])

  return {
    customers,
    newCustomers,
    isLoading,
    error,
    refetch,
    clearNewCustomers,
  }
}
