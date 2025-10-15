# derma-server (MVP)
API mínima para gestión de pacientes, consultas y recetas.

## Requisitos
- Node.js 18+

## Uso
```bash
npm install
npm run dev
# API en http://localhost:4000
```

## Endpoints
- GET `/health`
- GET `/api/patients?q=`
- POST `/api/patients` `{ name, dpi?, phone? }`
- GET `/api/patients/:id`
- PUT `/api/patients/:id` `{ name?, dpi?, phone? }`
- DELETE `/api/patients/:id`

- GET `/api/patients/:id/visits`
- POST `/api/visits` `{ patientId, reason, diagnosis?, notes? }`

- GET `/api/patients/:id/prescriptions`
- POST `/api/prescriptions` `{ patientId, items: [{ med, dosis, frecuencia }] }`
```
