import axios from 'axios';

// FORZAR Render (temporal)
const API_URL = 'https://derma-api.onrender.com';

export const api = axios.create({ baseURL: API_URL });
console.info('[API baseURL]', API_URL);


// Si algún día agregas token:
api.interceptors.request.use((cfg) => {
  try {
    const raw = localStorage.getItem('hm_auth');
    const t = raw ? JSON.parse(raw).token : null;
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  } catch {}
  return cfg;
});

/* AUTH */
export const loginDermReq    = (email, password) => api.post('/api/auth/login-derm',    { email, password }).then(r=>r.data);
export const loginPatientReq = (email, password) => api.post('/api/auth/login-patient', { email, password }).then(r=>r.data);
export const meReq           = () => api.get('/api/auth/me').then(r=>r.data);

/* Patients */
export const listPatients   = (q='')   => api.get('/api/patients', { params:{ q }}).then(r=>r.data);
export const createPatient  = (p)      => api.post('/api/patients', p).then(r=>r.data);
export const getPatient     = (id)     => api.get(`/api/patients/${id}`).then(r=>r.data);
export const updatePatient  = (id, p)  => api.put(`/api/patients/${id}`, p).then(r=>r.data);
export const deletePatient  = (id)     => api.delete(`/api/patients/${id}`).then(r=>r.data);

/* Visits */
export const listVisits     = (patientId) => api.get(`/api/patients/${patientId}/visits`).then(r=>r.data);
export const createVisit    = (v)         => api.post('/api/visits', v).then(r=>r.data);

/* Prescriptions */
export const listPrescriptions  = (patientId) => api.get(`/api/patients/${patientId}/prescriptions`).then(r=>r.data);
export const createPrescription = (rx)        => api.post('/api/prescriptions', rx).then(r=>r.data);

/* MedChat */
export const chatMed = (payload) => api.post('/api/medchat', payload).then(r=>r.data);

// Compat opcional si en algún lado aún llaman apiLogin(...)
export function apiLogin(emailOrObj, password, type) {
  let email, pass, kind;
  if (typeof emailOrObj === 'object') {
    email = emailOrObj.email; pass = emailOrObj.password;
    kind = (emailOrObj.type || emailOrObj.role || 'DERM').toUpperCase();
  } else {
    email = emailOrObj; pass = password; kind = (type || 'DERM').toUpperCase();
  }
  return kind === 'PATIENT' ? loginPatientReq(email, pass) : loginDermReq(email, pass);
}
