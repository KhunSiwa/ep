import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validation = useMemo(() => {
    return {
      email: /\S+@\S+\.\S+/.test(email) ? '' : 'Enter a valid email address.',
      password: password.length >= 6 ? '' : 'Password must be at least 6 characters.',
    }
  }, [email, password])

  const hasErrors = Boolean(validation.email || validation.password)

  const submit = async (event) => {
    event.preventDefault()
    setTouched({ email: true, password: true })
    if (hasErrors) return

    setError('')
    setIsSubmitting(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const token = response.data?.token?.trim()
      if (!token) {
        throw new Error('Login response did not include a token.')
      }
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.error || err.message || 'Login failed. Check your credentials and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <header className="marketing-nav">
        <Link to="/" className="brand landing-brand">
          <span className="brand-mark">P</span>
          <strong>Planora</strong>
        </Link>
        <button className="theme-toggle" onClick={onToggleTheme} type="button">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="auth-shell">
        <section className="auth-card">
          <span className="eyebrow">Welcome back</span>
          <h1>Log in to Planora</h1>
          <p>Access your dashboard, planner, and task workflow.</p>

          <form className="form-grid" onSubmit={submit} noValidate>
            <label>
              Email
              <input
                className={touched.email && validation.email ? 'invalid' : ''}
                value={email}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@company.com"
              />
              {touched.email && validation.email && <small className="field-error">{validation.email}</small>}
            </label>

            <label>
              Password
              <input
                className={touched.password && validation.password ? 'invalid' : ''}
                value={password}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
              />
              {touched.password && validation.password && <small className="field-error">{validation.password}</small>}
            </label>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="button button-primary full-width" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
