import React, { useEffect, useState } from 'react'
import { calculateProgress, inferStatusFromProgress, TASK_STATUSES } from '../taskOptions'

const emptyForm = { title: '', description: '', due_date: '', status: 'pending', progress: 0, checklist: [] }

export default function TaskModal({ isOpen, initialTask, onClose, onSubmit, isSaving }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (initialTask) {
      setForm({
        title: initialTask.title || '',
        description: initialTask.description || '',
        due_date: initialTask.due_date ? initialTask.due_date.slice(0, 10) : '',
        status: initialTask.status || 'pending',
        progress: initialTask.progress || 0,
        checklist: initialTask.checklist || [],
      })
    } else {
      setForm(emptyForm)
    }
  }, [initialTask, isOpen])

  if (!isOpen) return null

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const progress = calculateProgress(form.checklist, form.progress)

  const addChecklistItem = () => {
    setForm((current) => ({
      ...current,
      checklist: [...current.checklist, { id: `step-${Date.now()}`, text: '', done: false }],
    }))
  }

  const updateChecklistItem = (id, patch) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  const removeChecklistItem = (id) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.filter((item) => item.id !== id),
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      due_date: form.due_date || null,
      progress,
      status: inferStatusFromProgress(progress, form.status),
      checklist: form.checklist.filter((item) => item.text.trim()),
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{initialTask ? 'Edit task' : 'New task'}</span>
            <h2 id="task-modal-title">{initialTask ? 'Update task details' : 'Create a focused task'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <label>
            Task title
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Design onboarding checklist" required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Add context, owners, or acceptance notes" rows="4" />
          </label>
          <div className="form-row">
            <label>
              Due date
              <input type="date" value={form.due_date} onChange={(event) => updateField('due_date', event.target.value)} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                {TASK_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Progress
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => updateField('progress', Number(event.target.value))}
              disabled={form.checklist.length > 0}
            />
            <small className="field-hint">
              {form.checklist.length > 0 ? 'Progress is calculated from completed checklist steps.' : `${progress}% complete`}
            </small>
          </label>
          <div className="checklist-editor">
            <div className="checklist-editor-head">
              <div>
                <span className="eyebrow">Checklist</span>
                <strong>Task steps</strong>
              </div>
              <button className="button button-soft" type="button" onClick={addChecklistItem}>
                Add step
              </button>
            </div>
            {form.checklist.length === 0 ? (
              <p className="muted-copy">Add steps to calculate progress automatically as you complete them.</p>
            ) : (
              <div className="checklist-editor-list">
                {form.checklist.map((item) => (
                  <div className="checklist-editor-row" key={item.id}>
                    <input type="checkbox" checked={item.done} onChange={(event) => updateChecklistItem(item.id, { done: event.target.checked })} />
                    <input value={item.text} onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })} placeholder="Describe this step" />
                    <button className="icon-action danger" type="button" onClick={() => removeChecklistItem(item.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="button button-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : initialTask ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
