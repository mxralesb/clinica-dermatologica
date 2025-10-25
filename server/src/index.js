// ==============================
// server/src/index.js
// ==============================
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { nanoid } from 'nanoid'
import { db, initDb } from './db.js'

const app = express()
const PORT = process.env.PORT || 4000

await initDb()

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/health', (_req, res) => res.json({ ok: true }))

/* =========================
   Auth helpers + middleware
   ========================= */
function makeToken(user) {
  return Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')
}
function parseTokenRaw(t) {
  try { return JSON.parse(Buffer.from(String(t || ''), 'base64').toString('utf8')) } catch { return null }
}
function getUserFromReq(req) {
  const h = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  const tok = m?.[1] || req.query.token
  if (!tok) return null
  const payload = parseTokenRaw(tok)
  if (!payload?.id) return null
  const u = db.data.users.find(x => x.id === payload.id)
  return u ? { id: u.id, role: u.role, patientId: u.patientId } : null
}
const requireAuth = (req, res, next) => { if (!req.user) return res.status(401).json({ error: 'unauthorized' }); next() }
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' })
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  next()
}
// Adjunta req.user si viene token
app.use((req, _res, next) => { req.user = getUserFromReq(req); next() })

/* ============ AUTH ============ */
app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'invalid token' })
  const u = db.data.users.find(x => x.id === req.user.id)
  const { password, ...safe } = u
  res.json(safe)
})

app.post('/api/auth/login-derm', (req, res) => {
  const { email, password } = req.body || {}
  const u = db.data.users.find(x => x.email === email && x.password === password && x.role === 'DERM')
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' })
  const { password: _, ...safe } = u
  res.json({ token: makeToken(u), user: safe })
})

app.post('/api/auth/login-patient', (req, res) => {
  const { email, password } = req.body || {}
  const u = db.data.users.find(x => x.email === email && x.password === password && x.role === 'PATIENT')
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' })
  const { password: _, ...safe } = u
  res.json({ token: makeToken(u), user: safe })
})

/* ============ Patients ============ */
// Lista: SOLO DERM
app.get('/api/patients', requireRole('DERM'), (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase()
  let list = db.data.patients
  if (q) {
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.dpi  || '').toLowerCase().includes(q) ||
      (p.phone|| '').toLowerCase().includes(q)
    )
  }
  res.json(list)
})

// Crear/Actualizar/Borrar: SOLO DERM
app.post('/api/patients', requireRole('DERM'), async (req, res) => {
  const { name, dpi = '', phone = '' } = req.body || {}
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' })
  const patient = { id: nanoid(), name: name.trim(), dpi, phone, createdAt: new Date().toISOString() }
  db.data.patients.push(patient)
  await db.write()
  res.status(201).json(patient)
})

app.put('/api/patients/:id', requireRole('DERM'), async (req, res) => {
  const p = db.data.patients.find(x => x.id === req.params.id)
  if (!p) return res.status(404).json({ error: 'not found' })
  const { name, dpi, phone } = req.body || {}
  if (name !== undefined) p.name = name
  if (dpi !== undefined) p.dpi = dpi
  if (phone !== undefined) p.phone = phone
  p.updatedAt = new Date().toISOString()
  await db.write()
  res.json(p)
})

app.delete('/api/patients/:id', requireRole('DERM'), async (req, res) => {
  const before = db.data.patients.length
  db.data.patients = db.data.patients.filter(x => x.id !== req.params.id)
  const removed = before !== db.data.patients.length
  db.data.visits = db.data.visits.filter(v => v.patientId !== req.params.id)
  db.data.prescriptions = db.data.prescriptions.filter(r => r.patientId !== req.params.id)
  await db.write()
  res.json({ removed })
})

// Obtener 1: DERM cualquiera; PATIENT solo el suyo
app.get('/api/patients/:id', requireAuth, (req, res) => {
  const p = db.data.patients.find(x => x.id === req.params.id)
  if (!p) return res.status(404).json({ error: 'not found' })
  if (req.user.role === 'PATIENT' && req.user.patientId !== p.id) {
    return res.status(403).json({ error: 'forbidden' })
  }
  res.json(p)
})

/* ============ Visits ============ */
app.get('/api/patients/:id/visits', requireAuth, (req, res) => {
  const pid = req.params.id
  if (req.user.role === 'PATIENT' && req.user.patientId !== pid) {
    return res.status(403).json({ error: 'forbidden' })
  }
  const list = db.data.visits.filter(v => v.patientId === pid)
  res.json(list)
})

app.post('/api/visits', requireRole('DERM'), async (req, res) => {
  const { patientId, reason, diagnosis = '', notes = '', recommendations = '', date } = req.body || {}
  if (!patientId) return res.status(400).json({ error: 'patientId is required' })
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason is required' })
  const exists = db.data.patients.some(p => p.id === patientId)
  if (!exists) return res.status(404).json({ error: 'patient not found' })
  const createdAt = date ? new Date(date).toISOString() : new Date().toISOString()
  const visit = { id: nanoid(), patientId, reason, diagnosis, notes, recommendations, createdAt }
  db.data.visits.push(visit)
  await db.write()
  res.status(201).json(visit)
})

/* ============ Prescriptions ============ */
app.get('/api/patients/:id/prescriptions', requireAuth, (req, res) => {
  const pid = req.params.id
  if (req.user.role === 'PATIENT' && req.user.patientId !== pid) {
    return res.status(403).json({ error: 'forbidden' })
  }
  const list = db.data.prescriptions.filter(r => r.patientId === pid)
  res.json(list)
})

app.post('/api/prescriptions', requireRole('DERM'), async (req, res) => {
  const { patientId, items, visitId = null } = req.body || {}
  if (!patientId) return res.status(400).json({ error: 'patientId is required' })
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items array required' })
  const exists = db.data.patients.some(p => p.id === patientId)
  if (!exists) return res.status(404).json({ error: 'patient not found' })
  const rx = { id: nanoid(), patientId, visitId, items, createdAt: new Date().toISOString() }
  db.data.prescriptions.push(rx)
  await db.write()
  res.status(201).json(rx)
})

/* ============ MedChat (stub) ============ */
app.post('/api/medchat', (_req, res) => {
  res.json({ text: '🤖 Demo: MedChat aún no está conectado.' })
})

/* 404 */
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))

