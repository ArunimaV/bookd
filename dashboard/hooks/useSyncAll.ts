import { useState, useCallback, useRef } from 'react'

interface SyncAllResult {
  success: boolean
  totalCalls: number
  syncedCalls: number
  newCustomers: number
  skippedCalls: number
  duplicateCalls: number
  callsByBusiness: Record<string, { name: string; synced: number; new: number }>
  errors: string[]
}

interface UseSyncAllReturn {
  lastSync: Date | null
  isSyncing: boolean
  lastResult: SyncAllResult | null
  error: string | null
  syncAll: () => Promise<void>
}

/**
 * Hook to sync ALL organization calls from Teli to Supabase
 * This fetches calls from all agents and maps them to the correct businesses
 */
export function useSyncAll(): UseSyncAllReturn {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncAllResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastSyncTimestamp = useRef<string | null>(null)

  const syncAll = useCallback(async () => {
    if (isSyncing) return

    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/teli/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          since: lastSyncTimestamp.current,
        }),
      })

      const data: SyncAllResult = await response.json()

      if (!data.success) {
        throw new Error(data.errors?.[0] || 'Sync failed')
      }

      setLastResult(data)
      setLastSync(new Date())
      lastSyncTimestamp.current = new Date().toISOString()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  return {
    lastSync,
    isSyncing,
    lastResult,
    error,
    syncAll,
  }
}
