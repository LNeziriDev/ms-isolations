import React, { useEffect, useState } from 'react'
import { onTiming } from '../lib/api'

export default function Banner() {
  const [events, setEvents] = useState([])
  useEffect(() => onTiming(ev => setEvents(prev => [ev, ...prev].slice(0, 5))), [])
  return (
    <div style={{ background: '#f6f9ff', border: '1px solid #dde7ff', color: '#223', padding: 8, borderRadius: 6, marginBottom: 16 }}>
      <strong>Recent calls:</strong>
      {events.length === 0 ? <span> none yet</span> : (
        <ul style={{ display: 'flex', gap: 12, listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
          {events.map((e, idx) => (
            <li key={idx} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {e.name}: {e.durationMs}ms <span style={{ color: '#666' }}>({e.status})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


