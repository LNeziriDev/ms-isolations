import React from 'react'
import { Link as RouterLink, Route, Routes, useNavigate } from 'react-router-dom'
import Home from './Home'
import Users from './Users'
import Products from './Products'
import Tasks from './Tasks'
import TimingSummary from './TimingSummary'
import Banner from '../components/Banner'
import TasksPcPanel from '../components/TasksPcPanel'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Link from '@mui/joy/Link'

export default function App() {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'flex', gap: 2, p: 3, maxWidth: 1200, mx: 'auto' }}>
      <TasksPcPanel />
      <Box sx={{ flex: 1 }}>
        <Box component="header" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography level="h3" sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Retail CORP</Typography>
          <Box component="nav" sx={{ display: 'flex', gap: 2 }}>
            <Link component={RouterLink} to="/users">Users</Link>
            <Link component={RouterLink} to="/products">Products</Link>
            <Link component={RouterLink} to="/tasks">Tasks</Link>
            <Link component={RouterLink} to="/timing">Timing Summary</Link>
          </Box>
        </Box>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/products" element={<Products />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/timing" element={<TimingSummary />} />
        </Routes>
      </Box>
      <Banner />
    </Box>
  )
}


