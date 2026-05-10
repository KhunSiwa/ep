import React from 'react'

export default function StatusBadge({ status }) {
  const normalized = status === 'completed' ? 'completed' : 'pending'
  return <span className={`status-badge ${normalized}`}>{normalized}</span>
}
