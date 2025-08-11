import React, { useState } from 'react'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import { endpoints } from '../lib/api'

export default function TasksPcPanel() {
  const [state, setState] = useState('idle') // idle -> broken -> fixing -> fixed
  const [downtime, setDowntime] = useState(0)
  const [start, setStart] = useState(0)

  async function breakSchema() {
    setStart(Date.now())
    await fetch(`${endpoints.tasks}/admin/rename-productids`, { method: 'POST' })
    try {
      const res = await fetch(`${endpoints.gateway}/summary-with-joins`)
      if (!res.ok) throw new Error('failed')
    } catch {
      setState('broken')
    }
  }

  async function migrate() {
    setState('fixing')
    await fetch(`${endpoints.tasks}/admin/migrate`, { method: 'POST' })
    await fetch(`${endpoints.gateway}/summary-with-joins`)
    setDowntime(Date.now() - start)
    setState('fixed')
  }

  return (
    <Box sx={{ width: 260 }}>
      <Typography level="h4" sx={{ mb: 1 }}>TASKS-PC</Typography>
      <Typography level="body-sm" sx={{ mb: 2 }}>Simulate schema changes of tasks</Typography>
      {state === 'idle' && (
        <Button onClick={breakSchema}>Change productIDS to products</Button>
      )}
      {state === 'broken' && (
        <Button color="warning" onClick={migrate}>Migrate services to latest schema</Button>
      )}
      {state === 'fixed' && (
        <Typography level="body-sm">Services recovered in {downtime} ms</Typography>
      )}
    </Box>
  )
}
