// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginDermReq, loginPatientReq } from '../api'; 
const AuthCtx = createContext(null);

const LS_KEY = 'hm_auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth());

  useEffect(() => {
    
    if (user) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(user)); } catch {}
    } else {
      try { localStorage.removeItem(LS_KEY); } catch {}
    }
  }, [user]);

  const loginDerm = async (email, password, remember = true) => {
    const u = await loginDermReq(email, password); 
    const payload = { ...u, role: 'DERM' };
    setUser(payload);
    if (remember) localStorage.setItem(LS_KEY, JSON.stringify(payload));
    return payload;
  };

  const loginPatient = async (email, password, remember = true) => {
    const u = await loginPatientReq(email, password); 
    const payload = { ...u, role: 'PATIENT' };
    setUser(payload);
    if (remember) localStorage.setItem(LS_KEY, JSON.stringify(payload));
    return payload;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(LS_KEY); } catch {}
  };

  const value = useMemo(() => ({
    user,
    role: user?.role || null,
    isAuth: !!user,
    loginDerm,
    loginPatient,
    logout,
  }), [user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
