import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Planner() {
	const [tasks, setTasks] = useState([])
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [dueDate, setDueDate] = useState('')
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

	const add = async (e) => {
		e.preventDefault()
		setError(null)
		try {
			await api.post('/tasks', { title, description, due_date: dueDate })
			setTitle('')
			setDescription('')
			setDueDate('')
			await load()
		} catch (err) {
			setError(err.error || 'Failed to create task')
		}
	}

	const toggleStatus = async (task) => {
		const newStatus = task.status === 'completed' ? 'pending' : 'completed'
		try {
			await api.put(`/tasks/${task.id}`, { status: newStatus })
			await load()
		} catch (err) {
			setError(err.error || 'Failed to update')
		}
	}

	const remove = async (task) => {
		try {
			await api.delete(`/tasks/${task.id}`)
			await load()
		} catch (err) {
			setError(err.error || 'Failed to delete')
		}
	}

	return (
		<div className="container">
			<h2>Planner</h2>
			<form onSubmit={add} className="card">
				<div>
					<label>Title</label>
					<input value={title} onChange={e => setTitle(e.target.value)} required />
				</div>
				<div>
					<label>Description</label>
					<input value={description} onChange={e => setDescription(e.target.value)} />
				</div>
				<div>
					<label>Due Date</label>
					<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
				</div>
				<div style={{ marginTop: 8 }}>
					<button type="submit">Add Task</button>
				</div>
			</form>

			{error && <div style={{ color: 'red' }}>{error}</div>}

			<div style={{ marginTop: 12 }}>
				{tasks.map(t => (
					<div key={t.id} className="card">
						<div><strong>{t.title}</strong></div>
						<div>{t.description}</div>
						<div>Due: {t.due_date || '—'}</div>
						<div>
							<button onClick={() => toggleStatus(t)} style={{ marginRight: 8 }}>{t.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}</button>
							<button onClick={() => remove(t)}>Delete</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}