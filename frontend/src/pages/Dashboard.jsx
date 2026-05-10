import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Dashboard() {
	const [tasks, setTasks] = useState([])
	const [error, setError] = useState(null)

	const load = async () => {
		try {
			const res = await api.get('/tasks')
			setTasks(res.data.tasks || [])
		} catch (err) {
			setError(err.error || 'Failed to load tasks')
		}
	}

	useEffect(() => { load() }, [])

	const total = tasks.length
	const completed = tasks.filter(t => t.status === 'completed').length
	const pending = tasks.filter(t => t.status !== 'completed').length

	return (
		<div className="container">
			<h2>Dashboard</h2>
			{error && <div style={{color: 'red'}}>{error}</div>}
			<div className="card">
				<div><strong>Total:</strong> {total}</div>
				<div><strong>Completed:</strong> {completed}</div>
				<div><strong>Pending:</strong> {pending}</div>
			</div>
			<div>
				<h3>Recent tasks</h3>
				{tasks.map(t => (
					<div key={t.id} className="card">
						<div><strong>{t.title}</strong></div>
						<div>{t.description}</div>
						<div>Status: {t.status} | Due: {t.due_date || '—'}</div>
					</div>
				))}
			</div>
		</div>
	)
}