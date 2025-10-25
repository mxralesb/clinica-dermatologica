// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {id, role, email, name, patientId?}
  const [ready, setReady] = useState(false);

  // re-hidrata sesión
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hm.auth");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const persist = (u, remember) => {
    setUser(u);
    if (remember) localStorage.setItem("hm.auth", JSON.stringify(u));
    else localStorage.removeItem("hm.auth");
  };

  const loginDerm = async (email, password, remember = true) => {
    const { data } = await axios.post("http://localhost:4000/api/auth/login-derm", { email, password });
    persist(data, remember);
    return data; // {role:'DERM', ...}
  };

  const loginPatient = async (email, password, remember = true) => {
    const { data } = await axios.post("http://localhost:4000/api/auth/login-patient", { email, password });
    persist(data, remember);
    return data; // {role:'PATIENT', patientId:...}
  };

  const logout = async () => {
    try { await axios.post("http://localhost:4000/api/auth/logout"); } catch {}
    localStorage.removeItem("hm.auth");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, loginDerm, loginPatient, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
