import React, { useEffect, useMemo, useState } from 'react'
import { endpoints, timedFetch } from '../lib/api'

export default function Tasks() {
  const [rows, setRows] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', status: 'pending', product_ids: [] })

  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` })), [users])

  async function load() {
    try {
      setLoading(true)
      const [tasksRes, usersRes] = await Promise.all([
        timedFetch('Tasks: list', `${endpoints.tasks}/tasks`),
        timedFetch('Users: list', `${endpoints.users}/users`)
      ])
      const [tasksData, usersData] = await Promise.all([tasksRes.json(), usersRes.json()])
      if (tasksRes.ok) setRows(tasksData)
      else setError('Failed to load tasks')
      if (usersRes.ok) setUsers(usersData)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ title: '', description: '', assigned_to: users[0]?.id || '', status: 'pending', product_ids: [] })
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ title: row.title, description: row.description, assigned_to: row.assigned_to, status: row.status, product_ids: row.product_ids || [] })
    setModalOpen(true)
  }

  async function save() {
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `${endpoints.tasks}/tasks/${editing.id}` : `${endpoints.tasks}/tasks`
    const res = await timedFetch(editing ? 'Tasks: update' : 'Tasks: create', url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      setModalOpen(false)
      await load()
    } else {
      alert('Save failed')
    }
  }

  async function remove(row) {
    if (!confirm('Delete this task?')) return
    const res = await timedFetch('Tasks: delete', `${endpoints.tasks}/tasks/${row.id}`, { method: 'DELETE' })
    if (res.status === 204) await load()
    else alert('Delete failed')
  }

  function toggleProductId(pid) {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(pid)
        ? f.product_ids.filter(x => x !== pid)
        : [...f.product_ids, pid]
    }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Tasks</h3>
        <button onClick={openCreate}>Create</button>
      </div>
      {loading ? <p>Loading...</p> : error ? <p style={{ color: 'crimson' }}>{error}</p> : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th>Title</th>
              <th>Assigned to</th>
              <th>Status</th>
              <th>Product count</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td>{r.title}</td>
                <td>{r.assigned_name || r.assigned_to}</td>
                <td>{r.status}</td>
                <td>{Array.isArray(r.product_ids) ? r.product_ids.length : 0}</td>
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
            <h4 style={{ marginTop: 0 }}>{editing ? 'Edit task' : 'Create task'}</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                <div>Title</div>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </label>
              <label>
                <div>Description</div>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </label>
              <label>
                <div>Assigned to</div>
                <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                  {userOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label>
                <div>Status</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                </select>
              </label>
              <ProductIdsPicker value={form.product_ids} onToggle={toggleProductId} />
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

function ProductIdsPicker({ value, onToggle }) {
  const [products, setProducts] = useState([])
  useEffect(() => { (async () => {
    try { const res = await timedFetch('Products: list', `${endpoints.products}/products`); const data = await res.json(); if (res.ok) setProducts(data) } catch {}
  })() }, [])
  return (
    <div>
      <div>Products</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {products.map(p => (
          <label key={p.id} style={{ border: '1px solid #ddd', padding: '4px 8px', borderRadius: 6 }}>
            <input type="checkbox" checked={value.includes(p.id)} onChange={() => onToggle(p.id)} /> {p.name}
          </label>
        ))}
      </div>
    </div>
  )
}

const modalStyle = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.15)', display: 'grid', placeItems: 'center' },
  modal: { background: 'white', padding: 16, borderRadius: 8, width: 560 }
}


