import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '□' },
  { to: '/planner', label: 'Planner', icon: '+' },
]

export default function AppLayout({ children, theme, onToggleTheme }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const pageTitle = location.pathname.includes('planner') ? 'Planner' : 'Dashboard'

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>Planora</strong>
            <small>Task planning suite</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setIsSidebarOpen(false)}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-panel">
          <span className="eyebrow">Workspace</span>
          <strong>Product roadmap</strong>
          <p>Keep sprint tasks, due dates, and outcomes moving in one focused view.</p>
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-only" onClick={() => setIsSidebarOpen((value) => !value)} aria-label="Toggle navigation">
              ☰
            </button>
            <div>
              <span className="eyebrow">Workspace</span>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button className="theme-toggle" onClick={onToggleTheme} type="button">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className="button button-ghost" onClick={logout} type="button">
              Log out
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
