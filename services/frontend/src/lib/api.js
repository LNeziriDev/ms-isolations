// Centralized fetch wrapper that records durations for a UI banner

const GW = import.meta.env.VITE_GATEWAY_URL || ''
const USERS_URL = import.meta.env.VITE_USERS_URL || 'http://localhost:3001'
const PRODUCTS_URL = import.meta.env.VITE_PRODUCTS_URL || 'http://localhost:3003'
const TASKS_URL = import.meta.env.VITE_TASKS_URL || 'http://localhost:3002'

export const endpoints = {
  gateway: GW,
  users: USERS_URL,
  products: PRODUCTS_URL,
  tasks: TASKS_URL,
}

let listeners = new Set()
export function onTiming(listener) { listeners.add(listener); return () => listeners.delete(listener) }

function notify(t) { listeners.forEach(l => l(t)) }

export async function timedFetch(name, url, options) {
  const start = performance.now()
  const res = await fetch(url, options)
  const end = performance.now()
  const durationMs = Math.round(end - start)
  notify({ name, url, durationMs, ok: res.ok, status: res.status })
  return res
}


