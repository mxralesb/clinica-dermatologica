import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, 'db.json')


// lowdb v7 requiere defaultData en el constructor
const defaultData = { users: [], patients: [], visits: [], prescriptions: [] }
export const db = new Low(new JSONFile(file), defaultData)


export async function initDb() {
await db.read()


// Seed demo si está vacío
if (db.data.users.length === 0) {
db.data.users.push(
{ id: 'u_derm1', role: 'DERM', name: 'Dra. Sofía López', email: 'sofia@histomed.gt', password: 'derm123' },
{ id: 'u_pat1', role: 'PATIENT', name: 'Juan Pérez', email: 'juan@paciente.com', password: '123456', patientId: 'p101' },
)
db.data.patients.push({ id: 'p101', name:'Juan Pérez', dpi:'1234567890101', phone:'58701234', createdAt: new Date().toISOString() })
await db.write()
}
}