import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLogo from '../components/AuthLogo'
import '../styles/derma-ui.css'
import '../styles/login.css' // ⬅️ añadimos un css específico

export default function LoginDerm() {
  const { loginDerm } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('sofia@histomed.gt')
  const [password, setPassword] = useState('derm123')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await loginDerm(email.trim(), password, remember)
      nav('/patients', { replace: true })
    } catch (ex) {
      setErr(ex?.response?.data?.error || 'Credenciales inválidas')
    } finally { setLoading(false) }
  }

  return (
    <div className="hm-login">
      {/* banda lateral con ilustración tenue */}
      <aside className="hm-login__aside" aria-hidden>
        <div className="hm-stetho"></div>
      </aside>

      {/* panel central */}
      <main className="hm-login__panel" role="main">
        <div className="hm-login__card">
          <div className="hm-login__brand">
            <AuthLogo light />
          </div>

          <h1 className="hm-login__title">Inicio de sesión</h1>

          <form className="hm-form" onSubmit={submit}>
            <label className="hm-label">Correo electrónico</label>
            <input
              className="hm-input"
              type="email"
              placeholder="nombre@dominio.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              autoFocus
            />

            <label className="hm-label">Contraseña</label>
            <input
              className="hm-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />

            <div className="hm-form__row">
              <label className="hm-check">
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
                Recordarme
              </label>
              <Link className="hm-link" to="#" onClick={e=>e.preventDefault()}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {err && <div className="hm-alert">{err}</div>}

            <button className="hm-btn" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="hm-note">Acceso restringido al personal autorizado.</p>
          <p className="hm-copy">© {new Date().getFullYear()} Clínica Dermatológica HistoMed</p>
        </div>
      </main>
    </div>
  )
}
