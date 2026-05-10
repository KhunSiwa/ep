import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing({ theme, onToggleTheme }) {
  return (
    <div className="landing-page">
      <header className="marketing-nav">
        <Link to="/" className="brand landing-brand">
          <span className="brand-mark">P</span>
          <strong>Planora</strong>
        </Link>
        <div className="topbar-actions">
          <button className="theme-toggle" onClick={onToggleTheme} type="button">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <Link className="button button-ghost" to="/login">
            Log in
          </Link>
        </div>
      </header>

      <main className="landing-hero">
        <section className="hero-copy">
          <span className="eyebrow">Task planning for modern teams</span>
          <h1>Planora</h1>
          <p>Bring tasks, status, due dates, and team activity into one calm SaaS workspace that is fast enough for daily planning.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/login">
              Start planning
            </Link>
            <Link className="button button-ghost" to="/dashboard">
              View dashboard
            </Link>
          </div>
        </section>

        <section className="hero-product" aria-label="Product preview">
          <div className="preview-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-grid">
            <div className="preview-stat">
              <small>Total tasks</small>
              <strong>48</strong>
            </div>
            <div className="preview-stat">
              <small>Completed</small>
              <strong>31</strong>
            </div>
            <div className="preview-list">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="preview-panel">
              <strong>Launch checklist</strong>
              <p>Design QA, copy review, engineering handoff</p>
            </div>
          </div>
        </section>
      </main>

      <section className="feature-band">
        {['Clean task boards', 'Live dashboard signals', 'Responsive by default'].map((feature) => (
          <article key={feature}>
            <strong>{feature}</strong>
            <p>Built for quick scanning, confident decisions, and focused execution.</p>
          </article>
        ))}
      </section>
    </div>
  )
}
