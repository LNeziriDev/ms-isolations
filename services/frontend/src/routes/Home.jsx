import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { endpoints, timedFetch } from '../lib/api'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Card from '@mui/joy/Card'
import Link from '@mui/joy/Link'
import Chip from '@mui/joy/Chip'

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
          {data.users.map(user => {
            const tasksForUser = data.tasks.filter(t => t.assigned_to === user.id)
            return (
              <Card key={user.id} variant="outlined">
                <Typography level="title-md">
                  {user.name}{' '}
                  <Typography component="span" level="body-sm" sx={{ color: 'neutral.500' }}>
                    ({user.email})
                  </Typography>
                </Typography>
                {tasksForUser.length === 0 ? (
                  <Typography level="body-sm" sx={{ color: 'neutral.500' }}>No tasks</Typography>
                ) : (
                  <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                    {tasksForUser.map(t => (
                      <Card key={t.id} variant="outlined" sx={{ p: 1 }}>
                        <Typography level="body-sm">{t.title}</Typography>
                        <Chip size="sm" variant="soft" sx={{ mt: 0.5 }}>{t.status}</Chip>
                        {Array.isArray(t.product_ids) && t.product_ids.length > 0 && (
                          <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 0.5 }}>
                            Products: {t.product_ids.join(', ')}
                          </Typography>
                        )}
                      </Card>
                    ))}
                  </Box>
                )}
              </Card>
            )
          })}
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


