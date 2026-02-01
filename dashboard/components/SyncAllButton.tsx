import React from 'react'
import { C } from '../theme'

interface SyncAllButtonProps {
  onSync: () => void
  isSyncing: boolean
  lastSync: Date | null
  lastResult?: {
    totalCalls: number
    syncedCalls: number
    newCustomers: number
    duplicateCalls: number
    skippedCalls: number
    callsByBusiness: Record<string, { name: string; synced: number; new: number }>
  } | null
  error?: string | null
}

export function SyncAllButton({ 
  onSync, 
  isSyncing, 
  lastSync, 
  lastResult,
  error 
}: SyncAllButtonProps) {
  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 min ago'
    if (diffMins < 60) return `${diffMins} mins ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    return `${diffHours} hours ago`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Last sync info */}
        {lastSync && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              Last sync: {formatLastSync(lastSync)}
            </div>
            {lastResult && lastResult.syncedCalls > 0 && (
              <div style={{ fontSize: 11, color: C.green }}>
                {lastResult.syncedCalls} synced, {lastResult.newCustomers} new
              </div>
            )}
            {lastResult && lastResult.duplicateCalls > 0 && (
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {lastResult.duplicateCalls} duplicates skipped
              </div>
            )}
          </div>
        )}

        {/* Sync All button */}
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: C.body,
            background: isSyncing ? C.border : C.accent,
            color: isSyncing ? C.textMuted : '#fff',
            border: 'none',
            borderRadius: C.radiusSm,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {/* Sync icon */}
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: isSyncing ? 'spin 1s linear infinite' : 'none',
            }}
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          {isSyncing ? 'Syncing All...' : 'Sync All Calls'}
        </button>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ 
          fontSize: 12, 
          color: C.red || '#ef4444',
          padding: '6px 10px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: C.radiusSm,
        }}>
          {error}
        </div>
      )}

      {/* Business breakdown (when results exist) */}
      {lastResult && Object.keys(lastResult.callsByBusiness).length > 0 && (
        <div style={{
          fontSize: 11,
          color: C.textMuted,
          padding: '8px 10px',
          background: C.bg,
          borderRadius: C.radiusSm,
          marginTop: 4,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Breakdown by business:</div>
          {Object.entries(lastResult.callsByBusiness).map(([id, stats]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{stats.name}</span>
              <span>{stats.synced} calls ({stats.new} new)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
