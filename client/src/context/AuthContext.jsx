// ==============================
// client/src/context/AuthContext.jsx
// ==============================
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginDermReq, loginPatientReq, meReq } from '../api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('hm_auth')
    if (!raw) { setLoading(false); return }
    try {
      const { token: t } = JSON.parse(raw)
      if (!t) { setLoading(false); return }
      setToken(t)
      meReq(t)
        .then(setUser)
        .catch(() => { localStorage.removeItem('hm_auth'); setUser(null); setToken(null) })
        .finally(() => setLoading(false))
    } catch { setLoading(false) }
  }, [])

  const loginDerm = async (email, password, remember = true) => {
    const { token: t, user: u } = await loginDermReq(email, password)
    setToken(t); setUser(u)
    if (remember) localStorage.setItem('hm_auth', JSON.stringify({ token: t }))
    return u
  }

  const loginPatient = async (email, password, remember = true) => {
    const { token: t, user: u } = await loginPatientReq(email, password)
    setToken(t); setUser(u)
    if (remember) localStorage.setItem('hm_auth', JSON.stringify({ token: t }))
    return u
  }

  const logout = () => { setUser(null); setToken(null); localStorage.removeItem('hm_auth') }

  const value = useMemo(() => ({ user, token, loading, loginDerm, loginPatient, logout }), [user, token, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


