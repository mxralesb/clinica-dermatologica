// File: server/src/db.js
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, 'db.json')

// lowdb v7: se pasa defaultData en el constructor
const defaultData = {
  users: [],
  patients: [],
  visits: [],
  prescriptions: []
}

export const db = new Low(new JSONFile(file), defaultData)

export async function initDb() {
  await db.read()

  // Asegura estructuras (por si alguien borra claves en el JSON)
  db.data.users ??= []
  db.data.patients ??= []
  db.data.visits ??= []
  db.data.prescriptions ??= []

  // Seed demo si está vacío
  const needSeed = (db.data.users.length === 0) && (db.data.patients.length === 0)
  if (needSeed) {
    const now = new Date().toISOString()
    db.data.users.push(
      { id: 'u_derm1', role: 'DERM', name: 'Dra. Sofía López', email: 'sofia@histomed.gt', password: 'derm123', createdAt: now },
      { id: 'u_pat1', role: 'PATIENT', name: 'Juan Pérez', email: 'juan@paciente.com', password: '123456', patientId: 'p101', createdAt: now },
    )
    db.data.patients.push({
      id: 'p101',
      name: 'Juan Pérez',
      dpi: '1234567890101',
      phone: '58701234',
      createdAt: now
    })
    await db.write()
  }
}
