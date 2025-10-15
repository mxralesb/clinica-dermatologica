import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const defaultData = { patients: [], visits: [], prescriptions: [] }

const file = join(__dirname, '..', 'db.json')
const adapter = new JSONFile(file)
export const db = new Low(adapter, defaultData)

export async function initDb() {
  await db.read()
  db.data ||= { ...defaultData }
  await db.write()
}
