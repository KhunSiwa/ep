export const TASK_STATUSES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
]

export function calculateProgress(checklist = [], fallback = 0) {
  if (checklist.length) {
    const done = checklist.filter((item) => item.done).length
    return Math.round((done / checklist.length) * 100)
  }

  const parsed = Number.parseInt(fallback || 0, 10)
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.min(parsed, 100))
}

export function inferStatusFromProgress(progress, currentStatus = 'pending') {
  if (currentStatus === 'blocked' || currentStatus === 'review' || currentStatus === 'backlog') return currentStatus
  if (progress >= 100) return 'completed'
  if (progress > 0) return 'in_progress'
  return 'pending'
}
