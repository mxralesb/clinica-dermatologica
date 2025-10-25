import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'           
import LoginDerm from './pages/LoginDerm.jsx'
import LoginPatient from './pages/LoginPatient.jsx'
import Patients from './pages/Patients.jsx'
import PatientDetail from './pages/PatientDetail.jsx'
import './styles/derma-ui.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login unificado con switch Staff/Paciente */}
          <Route path="/login" element={<Login />} />

          {/* Logins existentes: se mantienen */}
          <Route path="/login/derm" element={<LoginDerm />} />
          <Route path="/login/patient" element={<LoginPatient />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute roles={['DERM']} />}>
            <Route path="/patients" element={<Patients />} />
          </Route>
          <Route element={<ProtectedRoute roles={['DERM', 'PATIENT']} />}>
            <Route path="/patient/:id" element={<PatientDetail />} />
          </Route>

          {/* fallback al login unificado */}
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
