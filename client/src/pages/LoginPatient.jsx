import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/derma-ui.css'

export default function LoginPatient() {
  const { loginPatient } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('juan@paciente.com')
  const [password, setPassword] = useState('123456')
  const [remember, setRemember] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const u = await loginPatient(email.trim(), password, remember)
      nav(`/patient/${u.patientId}`, { replace: true })
    } catch (ex) {
      setErr(typeof ex?.response?.data?.error === 'string' ? ex.response.data.error : 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* Panel visual */}
      <aside className="auth-hero patient">
        <div className="auth-hero__overlay" />
        <div className="auth-hero__content">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden>🌤️</div>
            <div>
              <h1 className="auth-title">HistoMed</h1>
              <p className="auth-sub">Portal del paciente</p>
            </div>
          </div>
          <ul className="auth-bullets">
            <li>Consulta tu <b>historial</b></li>
            <li>Imprime indicaciones</li>
            <li>Acceso seguro</li>
          </ul>
        </div>
      </aside>

      {/* Formulario */}
      <main className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <Link to="/login/derm" className="auth-tab" role="tab" aria-selected={false}>Staff</Link>
          <Link to="/login/patient" className="auth-tab -active" role="tab" aria-selected>Paciente</Link>
        </div>

        <h2 className="auth-heading">Bienvenido/a</h2>
        <p className="auth-caption">Ingresa con el correo y clave que te asignaron</p>

        {err && <div className="auth-alert --danger">{err}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label className="derma-label">Correo</label>
          <div className="auth-inputwrap">
            <span className="auth-icon" aria-hidden>📧</span>
            <input
              className="input auth-input"
              type="email"
              placeholder="tucorreo@example.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <label className="derma-label">Contraseña</label>
          <div className="auth-inputwrap">
            <span className="auth-icon" aria-hidden>🔒</span>
            <input
              className="input auth-input"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-eye"
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={()=>setShowPass(s=>!s)}
            >{showPass ? '🙈' : '👁️'}</button>
          </div>

          <label className="derma-check">
            <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
            Recordarme en este equipo
          </label>

          <button className="btn primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="auth-switch muted">
          ¿Eres staff? <Link to="/login/derm" className="dui-link">Ir a staff</Link>
        </div>
      </main>
    </div>
  )
}
