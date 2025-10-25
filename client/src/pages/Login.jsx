import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLogo from "../components/AuthLogo";
import "../styles/LoginCentered.css";

export default function LoginCentered() {
  const [mode, setMode] = useState("DERM"); // 'DERM' | 'PATIENT'
  const [email, setEmail] = useState("sofia@histomed.gt");
  const [password, setPassword] = useState("derm123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { user, loginDerm, loginPatient } = useAuth();
  const nav = useNavigate();

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
    <div className="hmc-wrap">
      <div className="hmc-card">
        <div className="hmc-brand">{AuthLogo ? <AuthLogo light /> : <h2>HistoMed</h2>}</div>

        {/* Switch Staff/Paciente */}
        <div className="hmc-role" role="tablist" aria-label="Cambiar rol">
          <button
            type="button"
            className={`hmc-role__btn ${mode === "DERM" ? "-active" : ""}`}
            onClick={() => switchMode("DERM")}
            aria-pressed={mode === "DERM"}
          >
            Staff
          </button>
          <button
            type="button"
            className={`hmc-role__btn ${mode === "PATIENT" ? "-active" : ""}`}
            onClick={() => switchMode("PATIENT")}
            aria-pressed={mode === "PATIENT"}
          >
            Paciente
          </button>
        </div>

        <h1 className="hmc-title">Inicio de sesión</h1>

        {err && <div className="hmc-alert" role="alert">{err}</div>}

        <form className="hmc-form" onSubmit={submit}>
          <label className="hmc-label">Correo electrónico</label>
          <input
            className="hmc-input"
            type="email"
            placeholder="nombre@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <label className="hmc-label">Contraseña</label>
          <input
            className="hmc-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="hmc-row">
            <label className="hmc-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordarme
            </label>
            <a className="hmc-link" href="#" onClick={(e) => e.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button className="hmc-btn" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <div className="hmc-note">Acceso restringido a usuarios autorizados.</div>
        <div className="hmc-copy">© {new Date().getFullYear()} Clínica Dermatológica HistoMed</div>
      </div>
    </div>
  );
}
