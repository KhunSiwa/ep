import React from 'react'

export default function LoadingState({ rows = 3 }) {
  return (
    <div className="loading-stack" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <span />
          <strong />
          <p />
        </div>
      ))}
    </div>
  )
}
