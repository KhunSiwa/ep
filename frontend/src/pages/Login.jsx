import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState(null)

	const submit = async (e) => {
		e.preventDefault()
		setError(null)
		try {
			const res = await api.post('/auth/login', { email, password })
			const token = res.data.token || res.token || res
			// store token
			localStorage.setItem('token', token)
			navigate('/dashboard')
		} catch (err) {
			setError(err.error || err.message || 'Login failed')
		}
	}

	return (
		<div className="container">
			<h2>Login</h2>
			<form onSubmit={submit} className="card">
				<div>
					<label>Email</label>
					<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
				</div>
				<div>
					<label>Password</label>
					<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
				</div>
				<div style={{ marginTop: 8 }}>
					<button type="submit">Login</button>
				</div>
				{error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
			</form>
		</div>
	)
}