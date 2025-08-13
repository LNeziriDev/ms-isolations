import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { endpoints, timedFetch } from '../lib/api'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Card from '@mui/joy/Card'
import Link from '@mui/joy/Link'
import Chip from '@mui/joy/Chip'

export default function Home() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await timedFetch('Gateway: summary-with-joins', `${endpoints.gateway}/summary-with-joins`)
        const json = await res.json()
        if (res.ok) {
          setUsers(json)
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
    const handler = () => load()
    window.addEventListener('refresh-summary', handler)
    return () => window.removeEventListener('refresh-summary', handler)
  }, [])

  return (
    <Box>
      <Card variant="soft" sx={{ mb: 3, p: 3 }}>
        <Typography level="h3" sx={{ mb: 1 }}>Employee Task Manager</Typography>
        <Typography level="body-md">
          Manage employees and their assigned tasks across your organization in one place.
        </Typography>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        <Tile title="Users" to="/users" />
        <Tile title="Products" to="/products" />
        <Tile title="Tasks" to="/tasks" />
      </Box>

      <Typography level="h4" sx={{ mb: 1 }}>Users and inventory tasks</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="danger">{error}</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {users.map(user => (
            <Card key={user.id} variant="outlined">
              <Typography level="title-md">
                {user.name}{' '}
                <Typography component="span" level="body-sm" sx={{ color: 'neutral.500' }}>
                  ({user.email})
                </Typography>
              </Typography>
              {(!user.tasks || user.tasks.length === 0) ? (
                <Typography level="body-sm" sx={{ color: 'neutral.500' }}>No tasks</Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                  {user.tasks.map(t => (
                    <Card key={t.id} variant="outlined" sx={{ p: 1 }}>
                      <Typography level="body-sm">{t.title}</Typography>
                      <Chip size="sm" variant="soft" sx={{ mt: 0.5 }}>{t.status}</Chip>
                      {Array.isArray(t.products) && t.products.length > 0 && (
                        <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 0.5 }}>
                          Products: {t.products.map(p => p.name).join(', ')}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Box>
              )}
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}

function Tile({ title, to }) {
  return (
    <Link component={RouterLink} to={to} sx={{ textDecoration: 'none' }}>
      <Card variant="outlined" sx={{ textAlign: 'center', p: 3 }}>
        <Typography level="title-md">{title}</Typography>
        <Typography level="body-sm" sx={{ color: 'neutral.500' }}>Open {title}</Typography>
      </Card>
    </Link>
  )
}


