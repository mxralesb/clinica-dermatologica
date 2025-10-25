// File: src/components/MedChat.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { chatMed } from '../api';

export default function MedChat({ patient, visits }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachContext, setAttachContext] = useState(true);

  const key = useMemo(() => `medchat:${patient?.id || 'global'}`, [patient?.id]);

  // Cargar historial por paciente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setMessages(JSON.parse(raw));
      else setMessages([]);
    } catch {}
  }, [key]);

  // Persistir
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {}
  }, [key, messages]);

  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  // Contexto clínico compacto
  const contextText = useMemo(() => {
    if (!patient) return '';
    const latest = (visits || [])
      .slice()
      .sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt))[0];

    const lines = [
      `Paciente: ${patient.name || 'N/D'}`,
      `DPI: ${maskDPI(patient.dpi)}`,
      `Tel: ${formatPhone(patient.phone)}`,
    ];

    if (latest) {
      lines.push(`Última visita: ${formatDate(latest.date || latest.createdAt)}`);
      if (latest.reason) lines.push(`Motivo: ${latest.reason}`);
      if (latest.diagnosis) lines.push(`Dx: ${latest.diagnosis}`);
    }

    // Extrae RX de la última visita si hay
    if (latest) {
      const meds = [];
      const indic = [];
      (latest.items || latest.rxItems || []).forEach(() => {}); 
    }
    return lines.join('\n');
  }, [patient, visits]);

  const quick = [
    'Recomienda rutina básica de skincare para acné leve.',
    'Posibles efectos secundarios del adapaleno tópico.',
    'Precauciones de fotoprotección para melasma.',
    'Checklist de signos de alarma dermatológicos.',
  ];

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content) return;

    const userMsg = { role: 'user', content, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const system = attachContext && contextText
        ? `Eres un asistente médico para dermatología. Responde en español, breve y claro.\n\nContexto del paciente:\n${contextText}\n\nNo des diagnósticos definitivos ni dosis específicas sin aclarar que debe confirmarlo un médico tratante.`
        : `Eres un asistente médico para dermatología. Responde en español, breve y claro. No des diagnósticos definitivos ni dosis específicas sin aclarar que debe confirmarlo un médico tratante.`;

      const res = await chatMed({
        system,
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
      });

      const botMsg = {
        role: 'assistant',
        content: res?.text || 'Lo siento, no pude generar una respuesta en este momento.',
        ts: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', ts: Date.now(), content: 'Hubo un problema al responder. Intenta de nuevo.' }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(key); } catch {}
  };

  const copyLast = async () => {
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.content);
   
    } catch {}
  };

  return (
    <>
      {/* Botón flotante */}
      <button className="dui-fab" title="Chat médico" onClick={() => setOpen(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path d="M2 5.5A3.5 3.5 0 0 1 5.5 2h13A3.5 3.5 0 0 1 22 5.5v8A3.5 3.5 0 0 1 18.5 17H9l-4.5 4.5V17H5.5A3.5 3.5 0 0 1 2 13.5v-8Z" fill="currentColor"/></svg>
      </button>

      {/* Cajón */}
      {open && (
        <div className="dui-drawer__backdrop" onClick={() => setOpen(false)}>
          <aside className="dui-drawer" role="dialog" aria-label="Chat médico" onClick={(e)=>e.stopPropagation()}>
            <header className="dui-drawer__header">
              <div>
                <h3 className="dui-drawer__title">Chat médico (beta)</h3>
                <p className="dui-drawer__sub">Asistente informativo. No reemplaza consulta médica.</p>
              </div>
              <button className="btn ghost" onClick={() => setOpen(false)}>Cerrar</button>
            </header>

            <div className="dui-banner -warning">
              <b>Aviso:</b> No es un diagnóstico. En urgencias, acude a tu servicio médico local.
            </div>

            <div className="dui-row -between -wrap" style={{gap:8}}>
              <div className="dui-switch">
                <input id="ctx" type="checkbox" checked={attachContext} onChange={e=>setAttachContext(e.target.checked)} />
                <label htmlFor="ctx">Adjuntar contexto del paciente</label>
              </div>
              {patient?.name && <div className="muted">Paciente: <b>{patient.name}</b></div>}
            </div>

            {/* Quick prompts */}
            <div className="dui-chips" aria-label="Sugerencias rápidas">
              {quick.map((q,i)=>(
                <button key={i} className="chip" onClick={()=>send(q)}>{q}</button>
              ))}
            </div>

            {/* Historial */}
            <div className="dui-chat" ref={scrollRef}>
              {messages.length===0 && (
                <div className="dui-chat__empty">
                  <p className="muted">Haz una pregunta sobre cuidados, rutina o efectos secundarios.</p>
                </div>
              )}
              {messages.map((m,i)=>(
                <div key={i} className={`dui-chat__row ${m.role==='user' ? '-user' : '-bot'}`}>
                  <div className="dui-chat__bubble">
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="dui-chat__row -bot">
                  <div className="dui-chat__bubble"><span className="dotdotdot">Escribiendo</span></div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="dui-chat__composer">
              <textarea
                className="derma-input"
                rows={2}
                placeholder="Escribe tu pregunta… (Shift+Enter para salto de línea)"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={(e)=>{
                  if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
              />
              <div className="dui-chat__actions">
                <button className="btn ghost" onClick={clearChat} disabled={messages.length===0}>Limpiar</button>
                <button className="btn" onClick={copyLast} disabled={!messages.some(m=>m.role==='assistant')}>Copiar última</button>
                <button className="btn primary" onClick={()=>send()} disabled={sending || !input.trim()}>
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}


function formatDate(iso){ try{ const d=new Date(iso); return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'}) }catch{ return iso } }
function maskDPI(dpi){ if(!dpi) return '—'; const s=String(dpi).replace(/\D/g,''); if(s.length!==13) return s; return s.slice(0,4)+' •••• •'+s.slice(9) }
function formatPhone(phone){ if(!phone) return '—'; const s=String(phone).replace(/\D/g,''); if(s.length===11 && s.startsWith('502')) return '+502 '+s.slice(3,7)+'-'+s.slice(7); if(s.length===8) return s.slice(0,4)+'-'+s.slice(4); return phone }
