import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLogo from '../components/AuthLogo'
import '../styles/Login.css' // ← sólo este css aquí

export default function Login() {
  const [mode, setMode] = useState('DERM') // 'DERM' | 'PATIENT'
  const [email, setEmail] = useState('sofia@histomed.gt')
  const [password, setPassword] = useState('derm123')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const { loginDerm, loginPatient } = useAuth()
  const nav = useNavigate()

  const switchMode = (m) => {
    setMode(m); setErr('')
    if (m === 'DERM') { setEmail('sofia@histomed.gt'); setPassword('derm123') }
    else { setEmail('juan@paciente.com'); setPassword('123456') }
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      if (mode === 'DERM') {
        await loginDerm(email.trim(), password, remember)
        nav('/patients', { replace: true })
      } else {
        const u = await loginPatient(email.trim(), password, remember)
        nav(`/patient/${u.patientId}`, { replace: true })
      }
    } catch (ex) {
      setErr(ex?.response?.data?.error || 'Credenciales inválidas')
    } finally { setLoading(false) }
  }

  return (
    <div className="hm-form-only">
      <div className="hmfo-card">
        <div className="hmfo-brand"><AuthLogo light /></div>

        <div className="hmfo-role" role="tablist" aria-label="Cambiar rol">
          <button
            type="button"
            className={mode==='DERM' ? 'active' : ''}
            onClick={()=>switchMode('DERM')}
            aria-pressed={mode==='DERM'}
          >Staff</button>
          <button
            type="button"
            className={mode==='PATIENT' ? 'active' : ''}
            onClick={()=>switchMode('PATIENT')}
            aria-pressed={mode==='PATIENT'}
          >Paciente</button>
        </div>

        <h1 className="hmfo-title">Inicio de sesión</h1>
        <p className="hmfo-cap">{mode==='DERM' ? 'Acceso del personal' : 'Portal del paciente'}</p>

        {err && <div className="hmfo-alert">{err}</div>}

        <form className="hmfo-form" onSubmit={submit}>
          <label className="hmfo-label">Correo electrónico</label>
          <input
            className="hmfo-input"
            type="email"
            placeholder="nombre@dominio.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            autoFocus
          />
          <label className="hmfo-label">Contraseña</label>
          <input
            className="hmfo-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />

          <div className="hmfo-row">
            <label className="hmfo-check">
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
              Recordarme
            </label>
            <a className="hmfo-link" href="#" onClick={(e)=>e.preventDefault()}>¿Olvidaste tu contraseña?</a>
          </div>

          <button className="hmfo-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="hmfo-foot">
          <div className="hmfo-note">Acceso restringido a usuarios autorizados.</div>
          <div className="hmfo-copy">© {new Date().getFullYear()} Clínica Dermatológica HistoMed</div>
        </div>
      </div>
    </div>
  )
}
