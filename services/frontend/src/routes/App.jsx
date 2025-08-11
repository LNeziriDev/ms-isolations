import React from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import Home from './Home'
import Users from './Users'
import Products from './Products'
import Tasks from './Tasks'
import Banner from '../components/Banner'

export default function App() {
  const navigate = useNavigate()
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h2 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>MS Isolations</h2>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/users">Users</Link>
          <Link to="/products">Products</Link>
          <Link to="/tasks">Tasks</Link>
        </nav>
      </header>
      <Banner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/products" element={<Products />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </div>
  )
}


