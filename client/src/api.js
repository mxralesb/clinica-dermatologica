import axios from 'axios'
const api = axios.create({ baseURL: 'http://localhost:4000' })

// Patients
export const listPatients = (q='') => api.get('/api/patients', { params:{ q }}).then(r=>r.data)
export const createPatient = (p) => api.post('/api/patients', p).then(r=>r.data)
export const getPatient = (id) => api.get(`/api/patients/${id}`).then(r=>r.data)
export const updatePatient = (id, p) => api.put(`/api/patients/${id}`, p).then(r=>r.data)
export const deletePatient = (id) => api.delete(`/api/patients/${id}`).then(r=>r.data)

// Visits
export const listVisits = (patientId) => api.get(`/api/patients/${patientId}/visits`).then(r=>r.data)
export const createVisit = (v) => api.post('/api/visits', v).then(r=>r.data)

// Prescriptions
export const listPrescriptions = (patientId) => api.get(`/api/patients/${patientId}/prescriptions`).then(r=>r.data)
export const createPrescription = (rx) => api.post('/api/prescriptions', rx).then(r=>r.data)


// File: src/api.js (agrega esto)
export async function chatMed(payload){
  // payload: { system: string, messages: [{role, content}] }
  const res = await fetch('/api/medchat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  // Esperamos { text: string }
  return await res.json();
}
