import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

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
    try {
      await api.put(`/tasks/${task.id}`, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      })
      await loadTasks()
    } catch (err) {
      setError(err.error || 'Failed to update task.')
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
          {['all', 'pending', 'completed'].map((option) => (
            <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)} type="button">
              {option}
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
            <TaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={deleteTask} onToggleStatus={toggleStatus} />
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
