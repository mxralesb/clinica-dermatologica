// client/src/api.js
import axios from 'axios';


const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE });


api.interceptors.request.use((cfg) => {
  try {
    const raw = localStorage.getItem('hm_auth');
    const t = raw ? JSON.parse(raw).token : null;
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  } catch {}
  return cfg;
});

/* =====================  AUTH  ===================== */
export const loginDermReq = (email, password) =>
  api.post('/api/auth/login-derm', { email, password }).then((r) => r.data);

export const loginPatientReq = (email, password) =>
  api.post('/api/auth/login-patient', { email, password }).then((r) => r.data);

// Compat si en algún lugar aún llaman apiLogin(...)
export function apiLogin(emailOrObj, password, type) {
  let email, pass, kind;
  if (typeof emailOrObj === 'object') {
    email = emailOrObj.email;
    pass = emailOrObj.password;
    kind = (emailOrObj.type || emailOrObj.role || 'DERM').toUpperCase();
  } else {
    email = emailOrObj;
    pass = password;
    kind = (type || 'DERM').toUpperCase();
  }
  return kind === 'PATIENT'
    ? loginPatientReq(email, pass)
    : loginDermReq(email, pass);
}



/* ===================  PATIENTS  =================== */
export const listPatients = (q = '') =>
  api.get('/api/patients', { params: { q } }).then((r) => r.data);

export const createPatient = (p) =>
  api.post('/api/patients', p).then((r) => r.data);

export const getPatient = (id) =>
  api.get(`/api/patients/${id}`).then((r) => r.data);

export const updatePatient = (id, p) =>
  api.put(`/api/patients/${id}`, p).then((r) => r.data);

export const deletePatient = (id) =>
  api.delete(`/api/patients/${id}`).then((r) => r.data);

/* ====================  VISITS  ==================== */
export const listVisits = (patientId) =>
  api.get(`/api/patients/${patientId}/visits`).then((r) => r.data);

export const createVisit = (v) =>
  api.post('/api/visits', v).then((r) => r.data);

/* ================  PRESCRIPTIONS  ================= */
export const listPrescriptions = (patientId) =>
  api.get(`/api/patients/${patientId}/prescriptions`).then((r) => r.data);

export const createPrescription = (rx) =>
  api.post('/api/prescriptions', rx).then((r) => r.data);

/* ====================  MEDCHAT  =================== */
export const chatMed = (payload) =>
  api.post('/api/medchat', payload).then((r) => r.data);
