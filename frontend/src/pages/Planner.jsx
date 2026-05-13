import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { calculateProgress, inferStatusFromProgress, TASK_STATUSES } from '../taskOptions'

export default function Planner() {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadTasks = async () => {
    setError('')
    try {
      const response = await api.get('/tasks')
      setTasks(response.data.tasks || [])
    } catch (err) {
      setError(err.error || 'Failed to load tasks.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  // Search and status filters are kept client-side for a fast planning workflow.
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesStatus = filter === 'all' || task.status === filter
      const matchesSearch = !query || `${task.title} ${task.description || ''}`.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [filter, search, tasks])

  const openCreateModal = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const saveTask = async (payload) => {
    setIsSaving(true)
    setError('')
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload)
      } else {
        await api.post('/tasks', payload)
      }
      setIsModalOpen(false)
      setEditingTask(null)
      await loadTasks()
    } catch (err) {
      setError(err.error || 'Failed to save task.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTask = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title}"? This action cannot be undone.`)
    if (!confirmed) return

    setError('')
    try {
      await api.delete(`/tasks/${task.id}`)
      await loadTasks()
    } catch (err) {
      setError(err.error || 'Failed to delete task.')
    }
  }

  const toggleStatus = async (task) => {
    setError('')
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const checklist = (task.checklist || []).map((item) => ({ ...item, done: nextStatus === 'completed' }))
    const progress = nextStatus === 'completed' ? 100 : calculateProgress(checklist, 0)
    try {
      await api.put(`/tasks/${task.id}`, {
        status: nextStatus,
        progress,
        checklist,
      })
      await loadTasks()
    } catch (err) {
      setError(err.error || 'Failed to update task.')
    }
  }

  const toggleChecklistItem = async (task, itemId) => {
    const checklist = (task.checklist || []).map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    const progress = calculateProgress(checklist, task.progress)
    const status = inferStatusFromProgress(progress, task.status)

    setError('')
    try {
      await api.put(`/tasks/${task.id}`, { checklist, progress, status })
      await loadTasks()
    } catch (err) {
      setError(err.error || 'Failed to update checklist.')
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading split-heading">
        <div>
          <span className="eyebrow">Planner</span>
          <h2>Organize your task pipeline</h2>
          <p>Search, filter, update status, and keep every task moving from one responsive workspace.</p>
        </div>
        <button className="button button-primary" onClick={openCreateModal} type="button">
          Add task
        </button>
      </section>

      <section className="filter-bar">
        <label className="search-field">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or descriptions" />
        </label>
        <div className="segmented-control" aria-label="Filter tasks">
          {[{ value: 'all', label: 'All' }, ...TASK_STATUSES].map((option) => (
            <button key={option.value} className={filter === option.value ? 'active' : ''} onClick={() => setFilter(option.value)} type="button">
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {isLoading ? (
        <LoadingState rows={3} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No matching tasks"
          description="Adjust your filters or create a new task to start planning."
          action={
            <button className="button button-primary" onClick={openCreateModal} type="button">
              Add task
            </button>
          }
        />
      ) : (
        <section className="task-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEditModal}
              onDelete={deleteTask}
              onToggleStatus={toggleStatus}
              onToggleChecklistItem={toggleChecklistItem}
            />
          ))}
        </section>
      )}

      <TaskModal
        isOpen={isModalOpen}
        initialTask={editingTask}
        onClose={() => setIsModalOpen(false)}
        onSubmit={saveTask}
        isSaving={isSaving}
      />
    </div>
  )
}
