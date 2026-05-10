import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await api.get('/tasks')
        if (mounted) setTasks(response.data.tasks || [])
      } catch (err) {
        if (mounted) setError(err.error || 'Failed to load dashboard data.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  // Derived dashboard metrics stay memoized so cards update predictably with task data.
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === 'completed').length
    const pending = total - completed
    const completionRate = total ? Math.round((completed / total) * 100) : 0

    return { total, completed, pending, completionRate }
  }, [tasks])

  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(a.due_date || '2999-12-31') - new Date(b.due_date || '2999-12-31'))
      .slice(0, 5)
  }, [tasks])

  if (isLoading) {
    return (
      <div className="page-stack">
        <div className="page-heading">
          <span className="eyebrow">Overview</span>
          <h2>Loading your workspace</h2>
        </div>
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Overview</span>
          <h2>Today&apos;s planning pulse</h2>
          <p>Track what is planned, what is finished, and what needs attention next.</p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="stats-grid">
        <StatCard label="Total tasks" value={stats.total} caption="Across your workspace" tone="blue" />
        <StatCard label="Completed" value={stats.completed} caption={`${stats.completionRate}% completion rate`} tone="green" />
        <StatCard label="Pending" value={stats.pending} caption="Open items to move forward" tone="amber" />
      </section>

      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Activity</span>
              <h3>Recent task flow</h3>
            </div>
          </div>

          {upcomingTasks.length === 0 ? (
            <EmptyState title="No task activity yet" description="Create your first task in the planner to populate your dashboard." />
          ) : (
            <div className="activity-list">
              {upcomingTasks.map((task) => (
                <div className="activity-item" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.description || 'No description added'}</span>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel progress-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Progress</span>
              <h3>Completion health</h3>
            </div>
          </div>
          <div className="progress-ring" style={{ '--progress': `${stats.completionRate * 3.6}deg` }}>
            <span>{stats.completionRate}%</span>
          </div>
          <p>{stats.completed} of {stats.total} tasks are marked complete.</p>
        </article>
      </section>
    </div>
  )
}
