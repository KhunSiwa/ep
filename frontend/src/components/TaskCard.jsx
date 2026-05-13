import React from 'react'
import { calculateProgress } from '../taskOptions'
import StatusBadge from './StatusBadge'

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus, onToggleChecklistItem }) {
  const dueLabel = task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'
  const checklist = task.checklist || []
  const progress = calculateProgress(checklist, task.progress)

  return (
    <article className="task-card">
      <div className="task-card-top">
        <StatusBadge status={task.status} />
        <span className="task-date">{dueLabel}</span>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description || 'No description added yet.'}</p>
      <div className="task-progress" aria-label={`${progress}% complete`}>
        <div className="task-progress-meta">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      {checklist.length > 0 && (
        <div className="task-checklist">
          {checklist.slice(0, 4).map((item) => (
            <label className="task-checklist-item" key={item.id}>
              <input checked={item.done} onChange={() => onToggleChecklistItem(task, item.id)} type="checkbox" />
              <span>{item.text}</span>
            </label>
          ))}
          {checklist.length > 4 && <small>{checklist.length - 4} more steps</small>}
        </div>
      )}
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
