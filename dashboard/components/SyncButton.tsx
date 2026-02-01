import React from 'react'
import { C } from '../theme'

interface SyncButtonProps {
  onSync: () => void
  isSyncing: boolean
  lastSync: Date | null
  lastResult?: {
    synced: number
    new_customers: number
  } | null
}

export function SyncButton({ onSync, isSyncing, lastSync, lastResult }: SyncButtonProps) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Last sync info */}
      {lastSync && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            Last sync: {formatLastSync(lastSync)}
          </div>
          {lastResult && lastResult.synced > 0 && (
            <div style={{ fontSize: 11, color: C.green }}>
              {lastResult.new_customers} new customer{lastResult.new_customers !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Sync button */}
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
          background: isSyncing ? C.border : C.card,
          color: isSyncing ? C.textMuted : C.text,
          border: `1px solid ${C.border}`,
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
        {isSyncing ? 'Syncing...' : 'Sync Now'}
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
  )
}
