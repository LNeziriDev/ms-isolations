import React, { useEffect, useState } from 'react'
import { endpoints, timedFetch } from '../lib/api'

export default function Products() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', stock: 0 })

  async function load() {
    try {
      setLoading(true)
      const res = await timedFetch('Products: list', `${endpoints.products}/products`)
      const data = await res.json()
      if (res.ok) setRows(data)
      else setError('Failed to load products')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', price: '', stock: 0 })
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ name: row.name, price: row.price, stock: row.stock })
    setModalOpen(true)
  }

  async function save() {
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `${endpoints.products}/products/${editing.id}` : `${endpoints.products}/products`
    const res = await timedFetch(editing ? 'Products: update' : 'Products: create', url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setModalOpen(false)
      await load()
    } else {
      alert('Save failed')
    }
  }

  async function remove(row) {
    if (!confirm('Delete this product?')) return
    const res = await timedFetch('Products: delete', `${endpoints.products}/products/${row.id}`, { method: 'DELETE' })
    if (res.status === 204) await load()
    else alert('Delete failed')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Products</h3>
        <button onClick={openCreate}>Create</button>
      </div>
      {loading ? <p>Loading...</p> : error ? <p style={{ color: 'crimson' }}>{error}</p> : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td>{r.name}</td>
                <td>{r.price}</td>
                <td>{r.stock}</td>
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
            <h4 style={{ marginTop: 0 }}>{editing ? 'Edit product' : 'Create product'}</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                <div>Name</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                <div>Price</div>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </label>
              <label>
                <div>Stock</div>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
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


