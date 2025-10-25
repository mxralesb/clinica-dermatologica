// server/src/index.js
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { nanoid } from 'nanoid'
import { db, initDb } from './db.js'

const app = express()
const PORT = process.env.PORT || 4000

await initDb()

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false // si no usas cookies
}));

app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/health', (_req, res) => res.json({ ok: true }))

// ----------------- helpers auth -----------------
function slugifyName(name='') {
  return String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.)|(\.$)/g, '')
    || 'paciente';
}

function genTempPassword() {
  // 8-10 caracteres simples
  const s = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  return s.replace(/[^a-z0-9]/gi, '').slice(0, 10)
}

function ensureUniqueEmail(base) {
  let email = base
  let i = 1
  while (db.data.users.some(u => u.email === email)) {
    const [user, domain] = base.split('@')
    email = `${user}${++i}@${domain}`
  }
  return email
}
// ------------------------------------------------

// --- AUTH ---
app.post('/api/auth/login-derm', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const e = String(email).trim().toLowerCase();
  const p = String(password);

  const u = db.data.users.find(
    (x) => x.role === 'DERM' && String(x.email).toLowerCase() === e && x.password === p
  );
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });

  return res.json({
    id: u.id,
    role: u.role,
    email: u.email,
    name: u.name || 'Staff',
  });
});

app.post('/api/auth/login-patient', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const e = String(email).trim().toLowerCase();
  const p = String(password);

  const u = db.data.users.find(
    (x) => x.role === 'PATIENT' && String(x.email).toLowerCase() === e && x.password === p
  );
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });
  if (!u.patientId) return res.status(409).json({ error: 'Usuario sin paciente vinculado' });

  return res.json({
    id: u.id,
    role: u.role,
    email: u.email,
    name: u.name || 'Paciente',
    patientId: u.patientId,
  });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true });
});

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

  const patient = {
    id: nanoid(),
    name: name.trim(),
    dpi,
    phone,
    createdAt: new Date().toISOString()
  }
  db.data.patients.push(patient)

  // --- crear usuario de portal paciente ---
  const baseUser = slugifyName(patient.name)
  const domain = 'paciente.local' // cambia por tu dominio si quieres
  const suggestedEmail = `${baseUser || 'paciente'}.${(patient.dpi || '').toString().slice(-4) || '0000'}@${domain}`
  const email = ensureUniqueEmail(suggestedEmail)
  const password = genTempPassword()

  const user = {
    id: nanoid(),
    role: 'PATIENT',
    email,
    password,          // en dev plano; en prod hashear
    patientId: patient.id,
    createdAt: new Date().toISOString()
  }
  db.data.users.push(user)

  await db.write()

  // devolvemos credenciales para que el front las muestre/imprima
  res.status(201).json({
    ...patient,
    login: { email: user.email, password: user.password }
  })
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
  // cascade
  db.data.visits = db.data.visits.filter(v => v.patientId !== req.params.id)
  db.data.prescriptions = db.data.prescriptions.filter(r => r.patientId !== req.params.id)
  // (opcional) también eliminar usuario del portal
  db.data.users = db.data.users.filter(u => u.patientId !== req.params.id)
  await db.write()
  res.json({ removed })
})

// --- Visits ---
app.get('/api/patients/:id/visits', (req, res) => {
  const list = db.data.visits.filter(v => v.patientId === req.params.id)
  res.json(list)
})

app.post('/api/visits', async (req, res) => {
  const { patientId, reason, diagnosis = '', notes = '', recommendations = '' } = req.body || {}
  if (!patientId) return res.status(400).json({ error: 'patientId is required' })
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason is required' })
  const exists = db.data.patients.some(p => p.id === patientId)
  if (!exists) return res.status(404).json({ error: 'patient not found' })
  const visit = { id: nanoid(), patientId, reason, diagnosis, notes, recommendations, createdAt: new Date().toISOString() }
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

// --- MedChat (stub sin IA externa) ---
app.post('/api/medchat', (req, res) => {
  const { system = '', messages = [] } = req.body || {};
  // Tomamos el último mensaje del usuario
  const last = [...(messages || [])].reverse().find(m => (m.role || m.author) === 'user');
  const q = (last?.content || '').toLowerCase();

  // Reglas simples por palabra clave
  const rules = [
    {
      test: /acn[eé]|comedon|espinilla/,
      reply:
        `Para acné leve-moderado: limpieza suave 1–2/día, gel con peróxido de benzoilo o adapaleno por la noche y fotoprotección diaria. 
Evita manipular lesiones y usa cosmética no comedogénica. Si hay dolor intenso, nódulos o cicatrices activas, consulta a tu dermatólogo.`
    },
    {
      test: /adapaleno|retino/i,
      reply:
        `Adapaleno: aplicar una capa fina nocturna en piel completamente seca, 2–3 veces/semana al inicio y aumentar según tolerancia. 
Efectos esperables: sequedad, leve irritación, purga inicial. Evita embarazo y combinar con exfoliantes fuertes al principio. Siempre usa FPS 50+.`
    },
    {
      test: /melasma|mancha/i,
      reply:
        `Melasma: fotoprotección estricta (FPS 50+ amplio espectro, reaplicar cada 3–4 h), sombrero y filtros físicos. 
Rutina suave; por la noche, despigmentantes pautados por tu dermatólogo (p.ej. ácido azelaico/retinoide). Persistencia de 3–6 meses es habitual.`
    },
    {
      test: /fotoprotec|bloqueador|sol/i,
      reply:
        `Fotoprotección: FPS 50+, amplio espectro, 2 dedos para cara/cuello, reaplicar cada 3–4 horas o tras sudor/agua. 
Complementa con gorra/sombrero, gafas y sombra. Para piel sensible, filtros minerales.`
    },
    {
      test: /alarma|urgenc|infecci|fiebre|dolor intenso|ampolla extensa/i,
      reply:
        `Signos de alarma dermatológicos: fiebre, dolor intenso, ampollas extensas, lesiones que sangran o crecen rápido, 
hinchazón de labios/ojos o dificultad para respirar. En esos casos, acude a urgencias.`
    }
  ];

  let text =
    `Puedo orientarte sobre cuidados generales (no reemplaza una consulta). ` +
    `Cuéntame el motivo principal (acné, melasma, fotoprotección, irritación por adapaleno, etc.).`;

  for (const r of rules) {
    if (r.test.test(q)) { text = r.reply; break; }
  }

  // Si incluíste contexto del paciente en 'system', añadimos una línea de cortesía.
  if (system && /contexto del paciente/i.test(system)) {
    text += `\n\nNota: tomé en cuenta el contexto del paciente compartido.`;
  }

  res.json({ text });
});


// 404 fallback (debe ir al final)
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
