import { useState, useCallback, useRef } from 'react'

interface UseTeliSyncOptions {
  businessId: string | null
  agentId: string | null
}

interface SyncResult {
  success: boolean
  synced: number
  new_customers: number
  errors?: string[]
}

interface UseTeliSyncReturn {
  lastSync: Date | null
  isSyncing: boolean
  lastResult: SyncResult | null
  error: string | null
  syncNow: () => Promise<void>
}

/**
 * Hook to manually sync Teli calls to Supabase
 */
export function useTeliSync({
  businessId,
  agentId,
}: UseTeliSyncOptions): UseTeliSyncReturn {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastSyncTimestamp = useRef<string | null>(null)

  // Perform sync
  const syncNow = useCallback(async () => {
    if (!businessId || isSyncing) return

    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/teli/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          agent_id: agentId,
          since: lastSyncTimestamp.current,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      setLastResult(data)
      setLastSync(new Date())
      lastSyncTimestamp.current = new Date().toISOString()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSyncing(false)
    }
  }, [businessId, agentId, isSyncing])

  return {
    lastSync,
    isSyncing,
    lastResult,
    error,
    syncNow,
  }
}
