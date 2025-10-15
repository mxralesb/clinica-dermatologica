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

// --- Patients ---
app.get('/api/patients', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase()
  let list = db.data.patients
  if (q) {
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.dpi || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q)
    )
  }
  res.json(list)
})

app.post('/api/patients', async (req, res) => {
  const { name, dpi = '', phone = '' } = req.body || {}
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' })
  const patient = { id: nanoid(), name: name.trim(), dpi, phone, createdAt: new Date().toISOString() }
  db.data.patients.push(patient)
  await db.write()
  res.status(201).json(patient)
})

app.get('/api/patients/:id', (req, res) => {
  const p = db.data.patients.find(x => x.id === req.params.id)
  if (!p) return res.status(404).json({ error: 'not found' })
  res.json(p)
})

app.put('/api/patients/:id', async (req, res) => {
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

app.delete('/api/patients/:id', async (req, res) => {
  const before = db.data.patients.length
  db.data.patients = db.data.patients.filter(x => x.id !== req.params.id)
  const removed = before !== db.data.patients.length
  // cascade deletes of visits/prescriptions for this patient
  db.data.visits = db.data.visits.filter(v => v.patientId !== req.params.id)
  db.data.prescriptions = db.data.prescriptions.filter(r => r.patientId !== req.params.id)
  await db.write()
  res.json({ removed })
})

// --- Visits ---
app.get('/api/patients/:id/visits', (req, res) => {
  const list = db.data.visits.filter(v => v.patientId === req.params.id)
  res.json(list)
})

app.post('/api/visits', async (req, res) => {
  const { patientId, reason, diagnosis = '', notes = '' } = req.body || {}
  if (!patientId) return res.status(400).json({ error: 'patientId is required' })
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason is required' })
  const exists = db.data.patients.some(p => p.id === patientId)
  if (!exists) return res.status(404).json({ error: 'patient not found' })
  const visit = { id: nanoid(), patientId, reason, diagnosis, notes, createdAt: new Date().toISOString() }
  db.data.visits.push(visit)
  await db.write()
  res.status(201).json(visit)
})

// --- Prescriptions ---
app.get('/api/patients/:id/prescriptions', (req, res) => {
  const list = db.data.prescriptions.filter(r => r.patientId === req.params.id)
  res.json(list)
})

app.post('/api/prescriptions', async (req, res) => {
  const { patientId, items } = req.body || {}
  if (!patientId) return res.status(400).json({ error: 'patientId is required' })
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items array required' })
  const exists = db.data.patients.some(p => p.id === patientId)
  if (!exists) return res.status(404).json({ error: 'patient not found' })
  const rx = { id: nanoid(), patientId, items, createdAt: new Date().toISOString() }
  db.data.prescriptions.push(rx)
  await db.write()
  res.status(201).json(rx)
})

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
