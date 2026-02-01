import React from 'react'
import { C } from '../theme'
import { CustomerFromCall } from '../hooks/useNewCalls'

interface NewCallsNotificationProps {
  newCustomers: CustomerFromCall[]
  onDismiss: () => void
  onViewAll?: () => void
}

export function NewCallsNotification({
  newCustomers,
  onDismiss,
  onViewAll,
}: NewCallsNotificationProps) {
  if (newCustomers.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: C.card,
        borderRadius: C.radius,
        boxShadow: C.shadowLg,
        border: `1px solid ${C.accent}40`,
        padding: 16,
        maxWidth: 360,
        zIndex: 1000,
        animation: 'slideUp 0.3s ease',
      }}
    >
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.green,
              animation: 'pulse 2s ease infinite',
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
            }}
          >
            {newCustomers.length} New Call{newCustomers.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: C.textMuted,
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Customer list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {newCustomers.slice(0, 3).map((customer) => (
          <div
            key={customer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              background: C.accentLight,
              borderRadius: C.radiusSm,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: C.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {customer.first_name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {customer.first_name} {customer.last_name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textMuted,
                }}
              >
                {customer.phone}
              </div>
            </div>

            {/* New badge */}
            {customer.is_new && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: C.green,
                  color: '#fff',
                }}
              >
                NEW
              </span>
            )}
          </div>
        ))}

        {newCustomers.length > 3 && (
          <div
            style={{
              fontSize: 12,
              color: C.textMuted,
              textAlign: 'center',
              padding: '4px 0',
            }}
          >
            +{newCustomers.length - 3} more
          </div>
        )}
      </div>

      {/* Actions */}
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: C.radiusSm,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          View All Leads
        </button>
      )}
    </div>
  )
}
