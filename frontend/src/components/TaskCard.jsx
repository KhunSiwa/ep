import React from 'react'
import StatusBadge from './StatusBadge'

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const dueLabel = task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'

  return (
    <article className="task-card">
      <div className="task-card-top">
        <StatusBadge status={task.status} />
        <span className="task-date">{dueLabel}</span>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description || 'No description added yet.'}</p>
      <div className="task-actions">
        <button className="button button-soft" onClick={() => onToggleStatus(task)} type="button">
          {task.status === 'completed' ? 'Mark pending' : 'Complete'}
        </button>
        <button className="icon-action" onClick={() => onEdit(task)} type="button" aria-label={`Edit ${task.title}`}>
          Edit
        </button>
        <button className="icon-action danger" onClick={() => onDelete(task)} type="button" aria-label={`Delete ${task.title}`}>
          Delete
        </button>
      </div>
    </article>
  )
}
