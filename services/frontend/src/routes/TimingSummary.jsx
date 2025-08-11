import React, { useState } from 'react'
import { endpoints, timedFetch } from '../lib/api'
import Box from '@mui/joy/Box'
import Button from '@mui/joy/Button'
import Typography from '@mui/joy/Typography'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'

export default function TimingSummary() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)

  async function fetchWithDuration(name, url) {
    const start = performance.now()
    await timedFetch(name, url)
    return Math.round(performance.now() - start)
  }

  async function analyze() {
    setLoading(true)
    const services = [
      { key: 'users', path: '/users', label: 'Users' },
      { key: 'products', path: '/products', label: 'Products' },
      { key: 'tasks', path: '/tasks', label: 'Tasks' }
    ]
    const results = []
    for (const svc of services) {
      const direct = await fetchWithDuration(`${svc.label}: direct`, `${endpoints[svc.key]}${svc.path}`)
      const gateway = await fetchWithDuration(`${svc.label}: gateway`, `${endpoints.gateway}${svc.path}`)
      results.push({ label: svc.label, direct, gateway })
    }
    setRows(results)
    setLoading(false)
  }

  const chartData = rows && {
    labels: rows.map(r => r.label),
    datasets: [
      { label: 'Direct service', data: rows.map(r => r.direct), backgroundColor: '#1976d2' },
      { label: 'Gateway', data: rows.map(r => r.gateway), backgroundColor: '#9c27b0' }
    ]
  }

  return (
    <Box>
      <Typography level="h4" sx={{ mb: 2 }}>Timing Summary</Typography>
      <Button onClick={analyze} disabled={loading} sx={{ mb: 2 }}>
        {loading ? 'Analyzing...' : 'Do Analysis'}
      </Button>
      {chartData && (
        <Box sx={{ maxWidth: 500 }}>
          <Bar data={chartData} />
        </Box>
      )}
    </Box>
  )
}

