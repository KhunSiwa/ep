import React from 'react'
import { TASK_STATUSES } from '../taskOptions'

export default function StatusBadge({ status }) {
  const normalized = TASK_STATUSES.some((item) => item.value === status) ? status : 'pending'
  const label = TASK_STATUSES.find((item) => item.value === normalized)?.label || 'Pending'
  return <span className={`status-badge ${normalized}`}>{label}</span>
}
