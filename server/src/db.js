// server/src/db.js
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Usa DATA_DIR si existe (Render: /data). Si no, carpeta local "data".
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

const file = path.join(DATA_DIR, 'db.json')

// lowdb v7 requiere defaultData
const defaultData = { users: [], patients: [], visits: [], prescriptions: [] }
export const db = new Low({ storage: new JSONFile(file), defaultData })

export async function initDb() {
  await db.read()
  // Seed demo si está vacío
  if (!Array.isArray(db.data.users) || db.data.users.length === 0) {
    db.data.users.push(
      { id: 'u_derm1', role: 'DERM', name: 'Dra. Sofía López', email: 'sofia@histomed.gt', password: 'derm123' },
      { id: 'u_pat1', role: 'PATIENT', name: 'Juan Pérez', email: 'juan@paciente.com', password: '123456', patientId: 'p101' },
    )
    db.data.patients.push({
      id: 'p101',
      name:'Juan Pérez',
      dpi:'1234567890101',
      phone:'58701234',
      createdAt: new Date().toISOString()
    })
    await db.write()
  }
}
