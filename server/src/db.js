import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Render te da un volumen en /data (lo creas más abajo)
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const file = path.join(dataDir, 'db.json')

// defaultData requerido por lowdb v7
const defaultData = { users: [], patients: [], visits: [], prescriptions: [] }
export const db = new Low(new JSONFile(file), defaultData)

export async function initDb(){
  await db.read()
  if (!db.data) db.data = JSON.parse(JSON.stringify(defaultData))

  // Seed si vacío
  if (db.data.users.length === 0) {
    db.data.users.push(
      { id: 'u_derm1', role: 'DERM', name: 'Dra. Sofía López', email: 'sofia@histomed.gt', password: 'derm123' },
      { id: 'u_pat1', role: 'PATIENT', name: 'Juan Pérez', email: 'juan@paciente.com', password: '123456', patientId: 'p101' }
    )
    db.data.patients.push({ id: 'p101', name:'Juan Pérez', dpi:'1234567890101', phone:'58701234', createdAt: new Date().toISOString() })
    await db.write()
  }
}
