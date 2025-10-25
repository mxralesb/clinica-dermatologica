import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLogo from '../components/AuthLogo'
import '../styles/derma-ui.css'
import '../styles/login-alt.css' // 👈 nuevo css

export default function LoginAlt() {
  const [mode, setMode] = useState('DERM') // 'DERM' | 'PATIENT'
  const { loginDerm, loginPatient } = useAuth()
  const nav = useNavigate()

  // valores demo por rol
  const [email, setEmail] = useState('sofia@histomed.gt')
  const [password, setPassword] = useState('derm123')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

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
    <div className={`hm-alt ${mode === 'PATIENT' ? '--patient' : '--derm'}`}>
      <div className="hm-alt__bg" aria-hidden />
      <div className="hm-alt__center">
        <div className="hm-alt__card">
          <div className="hm-alt__brand"><AuthLogo light /></div>

          {/* switch de rol */}
          <div className="hm-alt__role" role="tablist" aria-label="Cambiar rol">
            <button
              type="button"
              className={`role-btn ${mode==='DERM' ? 'active' : ''}`}
              onClick={()=>switchMode('DERM')}
              aria-pressed={mode==='DERM'}
            >Staff</button>
            <button
              type="button"
              className={`role-btn ${mode==='PATIENT' ? 'active' : ''}`}
              onClick={()=>switchMode('PATIENT')}
              aria-pressed={mode==='PATIENT'}
            >Paciente</button>
          </div>

          <h1 className="hm-alt__title">Inicio de sesión</h1>
          <p className="hm-alt__caption">
            {mode === 'DERM' ? 'Acceso del personal' : 'Portal del paciente'}
          </p>

          {err && <div className="hm-alt__alert">{err}</div>}

          <form className="hm-alt__form" onSubmit={submit}>
            <label className="hm-alt__label">Correo electrónico</label>
            <input
              className="hm-alt__input"
              type="email"
              placeholder="nombre@dominio.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              autoFocus
            />

            <label className="hm-alt__label">Contraseña</label>
            <input
              className="hm-alt__input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />

            <div className="hm-alt__row">
              <label className="hm-alt__check">
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
                Recordarme
              </label>
              <a className="hm-alt__link" href="#" onClick={(e)=>e.preventDefault()}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button className="hm-alt__btn" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="hm-alt__foot">
            <div className="hm-alt__note">Acceso restringido a usuarios autorizados.</div>
            <div className="hm-alt__copy">© {new Date().getFullYear()} Clínica Dermatológica HistoMed</div>
          </div>
        </div>
      </div>
    </div>
  )
}
