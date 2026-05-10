import React, { useEffect, useState } from 'react'

const emptyForm = { title: '', description: '', due_date: '', status: 'pending' }

export default function TaskModal({ isOpen, initialTask, onClose, onSubmit, isSaving }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (initialTask) {
      setForm({
        title: initialTask.title || '',
        description: initialTask.description || '',
        due_date: initialTask.due_date ? initialTask.due_date.slice(0, 10) : '',
        status: initialTask.status || 'pending',
      })
    } else {
      setForm(emptyForm)
    }
  }, [initialTask, isOpen])

  if (!isOpen) return null

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      due_date: form.due_date || null,
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
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>
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
