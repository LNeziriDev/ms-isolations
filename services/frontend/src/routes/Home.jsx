import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { endpoints, timedFetch } from '../lib/api'

export default function Home() {
  const [data, setData] = useState({ users: [], tasks: [], products: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await timedFetch('Gateway: summary', `${endpoints.gateway}/summary`)
        const json = await res.json()
        if (res.ok) {
          setData(json)
        } else {
          setError(json?.error || 'Failed to load summary')
        }
      } catch (e) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const userIdToUser = useMemo(() => new Map(data.users.map(u => [u.id, u])), [data.users])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <Tile title="Users" to="/users" />
        <Tile title="Products" to="/products" />
        <Tile title="Tasks" to="/tasks" />
      </div>

      <h3>Users and their tasks</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'crimson' }}>{error}</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {data.users.map(user => {
            const tasksForUser = data.tasks.filter(t => t.assigned_to === user.id)
            return (
              <div key={user.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{user.name} <span style={{ color: '#666', fontWeight: 400 }}>({user.email})</span></div>
                {tasksForUser.length === 0 ? (
                  <div style={{ color: '#666' }}>No tasks</div>
                ) : (
                  <ul style={{ margin: '8px 0 0 16px' }}>
                    {tasksForUser.map(t => (
                      <li key={t.id}>
                        {t.title} — {t.status}
                        {Array.isArray(t.product_ids) && t.product_ids.length > 0 && (
                          <span style={{ color: '#666' }}> with products: {t.product_ids.join(', ')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Tile({ title, to }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{title}</div>
        <div style={{ color: '#666' }}>Open {title}</div>
      </div>
    </Link>
  )
}


