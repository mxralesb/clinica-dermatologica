// src/pages/LoginDerm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLogo from "../components/AuthLogo"; 
import "../styles/derma-ui.css";
import "../styles/Login.css";

export default function LoginDerm() {
  const [mode, setMode] = useState("DERM"); // 'DERM' | 'PATIENT'
  const [email, setEmail] = useState("sofia@histomed.gt");
  const [password, setPassword] = useState("derm123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { user, loginDerm, loginPatient } = useAuth();
  const nav = useNavigate();

  // si ya hay sesión, manda a su home
  useEffect(() => {
    if (!user) return;
    if (user.role === "DERM") nav("/patients", { replace: true });
    else if (user.role === "PATIENT") nav(`/patient/${user.patientId}`, { replace: true });
  }, [user, nav]);

  const switchMode = (m) => {
    setMode(m);
    setErr("");
    if (m === "DERM") {
      setEmail("sofia@histomed.gt");
      setPassword("derm123");
    } else {
      setEmail("juan@paciente.com");
      setPassword("123456");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "DERM") {
        const u = await loginDerm(email.trim(), password, remember);
        nav("/patients", { replace: true });
      } else {
        const u = await loginPatient(email.trim(), password, remember);
        nav(`/patient/${u.patientId}`, { replace: true });
      }
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hm-login">
      {/* Lateral ilustrado */}
      <aside className="hm-login__aside">
        <div className="hm-stetho" aria-hidden />
      </aside>

      {/* Panel derecho */}
      <main className="hm-login__panel">
        <div className="hm-login__card">
          <div className="hm-login__brand">
            {/* Si no tienes AuthLogo, quítalo o cambia por un texto */}
            {AuthLogo ? <AuthLogo light /> : <h3 style={{margin:0}}>HistoMed</h3>}
          </div>

          {/* Switch Staff/Paciente */}
          <div className="hm-role" role="tablist" aria-label="Cambiar rol">
            <button
              type="button"
              className={`hm-role__btn ${mode==='DERM' ? '-active' : ''}`}
              onClick={()=>switchMode('DERM')}
              aria-pressed={mode==='DERM'}
            >Staff</button>
            <button
              type="button"
              className={`hm-role__btn ${mode==='PATIENT' ? '-active' : ''}`}
              onClick={()=>switchMode('PATIENT')}
              aria-pressed={mode==='PATIENT'}
            >Paciente</button>
          </div>

          <h1 className="hm-login__title">Inicio de sesión</h1>

          {err && <div className="hm-alert" role="alert">{err}</div>}

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
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e=>setRemember(e.target.checked)}
                />
                Recordarme
              </label>
              <a className="hm-link" href="#" onClick={(e)=>e.preventDefault()}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button className="hm-btn" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="hm-note">
            Acceso restringido a usuarios autorizados.
          </div>
          <div className="hm-copy">© {new Date().getFullYear()} Clínica Dermatológica HistoMed</div>
        </div>
      </main>
    </div>
  );
}
