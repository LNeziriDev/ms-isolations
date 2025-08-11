import React, { useEffect, useState } from 'react'
import { endpoints, timedFetch } from '../lib/api'

export default function Users() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '' })

  async function load() {
    try {
      setLoading(true)
      const res = await timedFetch('Users: list', `${endpoints.users}/users`)
      const data = await res.json()
      if (res.ok) setRows(data)
      else setError('Failed to load users')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ name: row.name, email: row.email })
    setModalOpen(true)
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `${endpoints.users}/users/${editing.id}` : `${endpoints.users}/users`
    const res = await timedFetch(editing ? 'Users: update' : 'Users: create', url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      setModalOpen(false)
      await load()
    } else {
      alert('Save failed')
    }
  }

  async function remove(row) {
    if (!confirm('Delete this user?')) return
    const res = await timedFetch('Users: delete', `${endpoints.users}/users/${row.id}`, { method: 'DELETE' })
    if (res.status === 204) await load()
    else alert('Delete failed')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Users</h3>
        <button onClick={openCreate}>Create</button>
      </div>
      {loading ? <p>Loading...</p> : error ? <p style={{ color: 'crimson' }}>{error}</p> : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>
                  <button onClick={() => openEdit(r)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => remove(r)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div style={modalStyle.overlay} onClick={() => setModalOpen(false)}>
          <div style={modalStyle.modal} onClick={e => e.stopPropagation()}>
            <h4 style={{ marginTop: 0 }}>{editing ? 'Edit user' : 'Create user'}</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                <div>Name</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                <div>Email</div>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </label>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <button onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const modalStyle = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.15)', display: 'grid', placeItems: 'center' },
  modal: { background: 'white', padding: 16, borderRadius: 8, width: 420 }
}


