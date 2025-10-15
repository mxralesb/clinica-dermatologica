// File: src/pages/PatientDetail.jsx
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getPatient,
  listVisits,
  listPrescriptions,
  createVisit,
  createPrescription,
  updatePatient,
} from '../api';
import '../styles/derma-ui.css';
import MedChat from '../components/MedChat.jsx';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado principal
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [rxs, setRxs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edición paciente
  const [editing, setEditing] = useState(false);
  const [pform, setPform] = useState({ name: '', dpi: '', phone: '' });
  const firstFieldRef = useRef(null);

  // Tabs
  const [view, setView] = useState('visit'); // 'visit' | 'rx' | 'history'
  const barRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const TABS = [
    { id: 'visit', label: 'Nueva consulta' },
    { id: 'rx', label: 'Nueva receta' },
    { id: 'history', label: 'Historial' },
  ];

  // Nueva consulta
  const [visit, setVisit] = useState({ date: '', reason: '', diagnosis: '', notes: '', recommendations: '' });
  const [savingVisit, setSavingVisit] = useState(false);

  // Nueva receta
  const [rxVisitId, setRxVisitId] = useState('');
  const [item, setItem] = useState({ tipo: 'medicamento', med: '', dosis: '', frecuencia: '' });
  const [items, setItems] = useState([]);
  const [savingRx, setSavingRx] = useState(false);

  // Filtros de fecha (historial)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (t) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, title: t.title || 'Listo', msg: t.msg || '', tone: t.tone || 'info', ttl: t.ttl ?? 3500 };
    setToasts((prev) => [...prev, toast]);
    if (toast.ttl > 0) setTimeout(() => dismissToast(id), toast.ttl);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  // Normalizador genérico
  const pickArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.visits)) return payload.visits;
    if (Array.isArray(payload?.prescriptions)) return payload.prescriptions;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  // Carga inicial
  const load = async () => {
    setLoading(true);
    try {
      const p = await getPatient(id);
      setPatient(p);
      setPform({ name: p?.name || '', dpi: p?.dpi || '', phone: p?.phone || '' });

      const v = await listVisits(id);
      const r = await listPrescriptions(id);

      const visitsArr = pickArray(v);
      let rxArr = pickArray(r);

      if (!Array.isArray(r) && r && typeof r === 'object' && rxArr.length === 0) {
        rxArr = [r];
      }

      rxArr = rxArr.map((rx, i) => {
        let items = rx.items;
        if (!Array.isArray(items) || items.length === 0) {
          const { med, dosis, frecuencia, tipo } = rx;
          if (med || dosis || frecuencia) {
            items = [{ med: med || '', dosis: dosis || '', frecuencia: frecuencia || '', tipo: tipo || 'medicamento' }];
          } else {
            items = [];
          }
        }
        return {
          id: rx.id || `rx_${i}`,
          visitId: rx.visitId || rx.visit_id || null,
          createdAt: rx.createdAt || rx.created_at || Date.now(),
          items,
        };
      });

      setVisits(Array.isArray(visitsArr) ? visitsArr : []);
      setRxs(Array.isArray(rxArr) ? rxArr : []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  // Agrupa recetas por visita
  const { byVisit, orphans } = useMemo(() => {
    const map = new Map();
    const orphansTmp = [];
    const vs = (visits || []).slice().sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    vs.forEach((v) => map.set(v.id, []));

    const ONE_DAY = 24 * 60 * 60 * 1000;
    rxs.forEach((rx) => {
      if (rx.visitId && map.has(rx.visitId)) {
        map.get(rx.visitId).push(rx); return;
      }
      const rxt = new Date(rx.createdAt).getTime();
      let best = null, diff = Infinity;
      for (const v of vs) {
        const vt = new Date(v.date || v.createdAt).getTime();
        const d = Math.abs(vt - rxt);
        if (d < diff) { best = v.id; diff = d; }
      }
      if (best && diff <= ONE_DAY) map.get(best).push(rx);
      else orphansTmp.push(rx);
    });

    return { byVisit: map, orphans: orphansTmp };
  }, [visits, rxs]);

  // Validaciones Paciente (DPI 13, Tel 8)
  const toDigits = (s, max) => (s || '').replace(/\D/g, '').slice(0, max);
  const pf_dpi = toDigits(pform.dpi, 13);
  const pf_phone = toDigits(pform.phone, 8);
  const pf_valid = pform.name.trim().length > 0 && pf_dpi.length === 13 && pf_phone.length === 8;

  // Tabs indicator
  const updateIndicator = () => {
    const bar = barRef.current;
    const el = tabRefs.current[view];
    if (!bar || !el) return;
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({ left: elRect.left - barRect.left, width: elRect.width });
  };
  useLayoutEffect(updateIndicator, [view]);
  useEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Helpers de tiempo
  const vTime = (v) => new Date(v.date || v.createdAt).getTime();
  const fromTS = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
  const toTS   = dateTo   ? new Date(`${dateTo}T23:59:59.999`).getTime() :  Infinity;

  // Visitas filtradas por rango
  const filteredVisits = useMemo(() => {
    return visits
      .slice()
      .filter(v => {
        const t = vTime(v);
        return t >= fromTS && t <= toTS;
      })
      .sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));
  }, [visits, fromTS, toTS]);

  // Acciones (paciente / consulta / receta)
  const savePatient = async () => {
    if (!pf_valid) return;
    await updatePatient(id, { name: pform.name.trim(), dpi: pf_dpi, phone: pf_phone });
    setEditing(false);
    await load();
    addToast({ tone: 'success', title: 'Paciente actualizado', msg: 'Se guardaron los cambios.' });
  };

  const addVisit = async () => {
    if (!visit.reason.trim()) return;
    setSavingVisit(true);
    try {
      await createVisit({ patientId: id, ...visit });
      setVisit({ date: '', reason: '', diagnosis: '', notes: '', recommendations: '' });
      await load();
      setView('rx');
      addToast({ tone: 'success', title: 'Consulta guardada', msg: 'Ahora puedes crear la receta.' });
    } finally { setSavingVisit(false); }
  };

  const addItem = () => {
    if (!item.med.trim()) return;
    setItems((prev) => [...prev, item]);
    setItem({ tipo: item.tipo, med: '', dosis: '', frecuencia: '' });
  };
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveRx = async () => {
    if (!rxVisitId || items.length === 0) return;
    setSavingRx(true);
    try {
      await createPrescription({ patientId: id, visitId: rxVisitId, items });
      setItems([]); await load();
      setView('history');
      addToast({ tone: 'success', title: 'Receta guardada', msg: 'Se registró exitosamente.' });
    } finally { setSavingRx(false); }
  };

  // Export / Print historial
  const downloadCSV = () => {
    const rows = [];
    rows.push(['Fecha', 'Recetado', 'Prescrito']); // solo lo pedido
    filteredVisits.forEach(v => {
      const rxList = byVisit.get(v.id) || [];
      const meds = [];
      const indic = [];
      rxList.forEach(rx => {
        rx.items.forEach(it => {
          if ((it.tipo || 'medicamento') === 'medicamento') meds.push(`${it.med} — ${it.dosis} — ${it.frecuencia}`);
          else indic.push(`${it.med} — ${it.dosis} — ${it.frecuencia}`);
        });
      });
      const fecha = formatDate(v.date || v.createdAt);
      rows.push([fecha, meds.join(' | '), indic.join(' | ')]);
    });

    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `historial_${(patient?.name || 'paciente').replace(/[^\w\-]+/g,'_')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    addToast({ tone: 'success', title: 'CSV exportado', msg: 'Se descargó el archivo.' });
  };

  const printHistory = () => {
    // Cambia a "Historial", asegura render y manda imprimir (usa @media print)
    setView('history');
    setTimeout(() => window.print(), 0);
  };

  // PDF individual por visita (Blob + fallback)
  const printSingleVisit = (v) => {
    const rxList = byVisit.get(v.id) || [];
    const meds = [];
    const indic = [];
    rxList.forEach(rx => {
      rx.items.forEach(it => {
        if ((it.tipo || 'medicamento') === 'medicamento') meds.push(it);
        else indic.push(it);
      });
    });

    const fecha = formatDate(v.date || v.createdAt);
    const html = buildVisitHTML({ patient, fecha, meds, indic });
    openPrintableHTML(html, `Visita_${(fecha || '').replace(/[^\w\-]+/g,'_')}.html`);
  };

  // Renders de carga / error
  if (loading) return (
    <div className="dui-container dui-page">
      <section className="dui-card"><div className="derma-skeleton-item" style={{height:64}}/></section>
    </div>
  );
  if (!patient) return (
    <div className="dui-container dui-page">
      <section className="dui-card">Paciente no encontrado. <Link className="dui-link" to="/">Volver</Link></section>
    </div>
  );

  return (
    <div className="dui-container dui-page">
      {/* Header Paciente */}
      <section className="dui-card">
        <div className="derma-patient-header" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, alignItems:'center' }}>
          <div className="derma-avatar lg" aria-hidden>{getInitials(patient.name)}</div>

          <div className="derma-ph-meta" style={{ minWidth:0 }}>
            {!editing ? (
              <>
                <h1 className="derma-title" style={{margin:0}}>{patient.name}</h1>
                <div className="derma-subtitle">{maskDPI(patient.dpi)} • {formatPhone(patient.phone)}</div>
              </>
            ) : (
              <div className="derma-grid" style={{gridTemplateColumns:'2fr 1fr 1fr'}}>
                <div>
                  <label className="derma-label">Nombre</label>
                  <input ref={firstFieldRef} className={`derma-input ${pform.name.trim()?'':'-invalid'}`} value={pform.name} onChange={e=>setPform({...pform,name:e.target.value})}/>
                  {!pform.name.trim() && <div className="form-hint">Requerido</div>}
                </div>
                <div>
                  <label className="derma-label">DPI (13 dígitos)</label>
                  <input className={`derma-input ${pf_dpi.length===13?'':'-invalid'}`} value={pf_dpi} inputMode="numeric" maxLength={13} onChange={e=>setPform({...pform,dpi:e.target.value})}/>
                  {pf_dpi.length!==13 && <div className="form-hint">Debe contener 13 dígitos.</div>}
                </div>
                <div>
                  <label className="derma-label">Teléfono (8 dígitos)</label>
                  <input className={`derma-input ${pf_phone.length===8?'':'-invalid'}`} value={pf_phone} inputMode="numeric" maxLength={8} onChange={e=>setPform({...pform,phone:e.target.value})}/>
                  {pf_phone.length!==8 && <div className="form-hint">Debe contener 8 dígitos.</div>}
                </div>
              </div>
            )}
          </div>

          <div className="derma-ph-actions" style={{ display:'flex', gap:8 }}>
            {!editing ? (
              <>
                <button className="btn" onClick={()=>{ setEditing(true); setTimeout(()=>firstFieldRef.current?.focus(),0); }}>Editar</button>
                <Link className="btn ghost" to="/">← Volver</Link>
                <button className="btn" onClick={printHistory}>Imprimir historial</button>
              </>
            ) : (
              <>
                <button className="btn primary" onClick={savePatient} disabled={!pf_valid}>Guardar</button>
                <button className="btn ghost" onClick={()=>{ setEditing(false); setPform({ name:patient.name||'', dpi:patient.dpi||'', phone:patient.phone||'' }); }}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="dui-card">
        <div className="dui-tabs" role="tablist" aria-label="Secciones de paciente" ref={barRef}>
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view===t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              ref={el => (tabRefs.current[t.id] = el)}
              className={`dui-tab ${view===t.id ? '-active':''}`}
              onClick={()=>setView(t.id)}
              onKeyDown={(e)=>{
                if(e.key==='ArrowRight' || e.key==='ArrowLeft'){
                  e.preventDefault();
                  const idx = TABS.findIndex(x=>x.id===view);
                  const dir = e.key==='ArrowRight'?1:-1;
                  const next = (idx + dir + TABS.length) % TABS.length;
                  setView(TABS[next].id);
                  tabRefs.current[TABS[next].id]?.focus();
                }
              }}
            >{t.label}</button>
          ))}
          <span className="dui-tabs__indicator" style={{ transform:`translateX(${indicator.left}px)`, width:indicator.width }} aria-hidden="true" />
        </div>
      </section>

      {/* Panel: Nueva consulta */}
      {view==='visit' && (
        <section id="panel-visit" role="tabpanel" aria-labelledby="tab-visit" className="derma-card">
          <h2 className="derma-section-title">Nueva consulta</h2>
          <div className="derma-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div>
              <label className="derma-label">Motivo <span className="req">*</span></label>
              <input className="derma-input" placeholder="Ej. Acné inflamatorio" value={visit.reason} onChange={e=>setVisit({...visit,reason:e.target.value})}/>
            </div>
            <div>
              <label className="derma-label">Diagnóstico</label>
              <input className="derma-input" placeholder="Ej. Acné noduloquístico" value={visit.diagnosis} onChange={e=>setVisit({...visit,diagnosis:e.target.value})}/>
            </div>
            <div>
              <label className="derma-label">Notas clínicas</label>
              <textarea className="derma-input" rows={3} placeholder="Observaciones, evolución, lesiones, fototipo" value={visit.notes} onChange={e=>setVisit({...visit,notes:e.target.value})}/>
            </div>
            <div>
              <label className="derma-label">Recomendaciones</label>
              <textarea className="derma-input" rows={3} placeholder="Rutina, fotoprotección, cuidados" value={visit.recommendations} onChange={e=>setVisit({...visit,recommendations:e.target.value})}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <button disabled={savingVisit || !visit.reason.trim()} className="btn primary" onClick={addVisit}>
              {savingVisit ? 'Guardando…' : 'Guardar consulta'}
            </button>
          </div>
        </section>
      )}

      {/* Panel: Nueva receta */}
      {view==='rx' && (
        <section id="panel-rx" role="tabpanel" aria-labelledby="tab-rx" className="derma-card">
          <h2 className="derma-section-title">Nueva indicación / receta</h2>
          <div className="derma-grid" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr'}}>
            <div>
              <label className="derma-label">Visita</label>
              <select className="derma-input" value={rxVisitId} onChange={e=>setRxVisitId(e.target.value)}>
                <option value="">Selecciona fecha de consulta</option>
                {visits.map(v => (
                  <option value={v.id} key={v.id}>{formatDate(v.date || v.createdAt)} — {v.reason}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="derma-label">Tipo</label>
              <select className="derma-input" value={item.tipo} onChange={e=>setItem({...item,tipo:e.target.value})}>
                <option value="medicamento">Medicamento</option>
                <option value="indicacion">Indicaciones</option>
              </select>
            </div>
            <div>
              <label className="derma-label">Nombre</label>
              <input className="derma-input" placeholder={item.tipo==='medicamento' ? 'Ej. Adapaleno 0.1%' : 'Ej. Fotoprotección SPF50+'} value={item.med} onChange={e=>setItem({...item,med:e.target.value})}/>
            </div>
            <div>
              <label className="derma-label">Dosis / detalle</label>
              <input className="derma-input" placeholder={item.tipo==='medicamento' ? 'Ej. capa fina nocturna' : 'Ej. reaplicar cada 3-4h'} value={item.dosis} onChange={e=>setItem({...item,dosis:e.target.value})}/>
            </div>
            <div>
              <label className="derma-label">Frecuencia</label>
              <input className="derma-input" placeholder="Ej. 1 vez/día" value={item.frecuencia} onChange={e=>setItem({...item,frecuencia:e.target.value})}/>
            </div>
          </div>

          <div style={{marginTop:10, display:'flex', gap:8, alignItems:'center'}}>
            <button className="btn" onClick={addItem}>Agregar item</button>
            <button disabled={savingRx || !rxVisitId || items.length===0} className="btn primary" onClick={saveRx}>
              {savingRx ? 'Guardando…' : 'Guardar receta'}
            </button>
            {items.length>0 && <span className="derma-chip">{items.length} item(s)</span>}
          </div>

          {items.length>0 && (
            <ul className="derma-list tight" style={{marginTop:10}}>
              {items.map((x,i)=> (
                <li key={i} className="derma-list-item" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
                  <div className="derma-patient-meta">• <b>{x.med}</b> — {x.dosis} — {x.frecuencia} <i>({x.tipo})</i></div>
                  <button className="btn ghost" onClick={()=>removeItem(i)}>Quitar</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Panel: Historial + filtros / export */}
      {view==='history' && (
        <section id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="derma-card">
          <h2 className="derma-section-title">Historial clínico</h2>

          {/* Filtros */}
          <div className="dui-toolbar" style={{marginBottom:10}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
              <input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
            </div>
            <div className="dui-actions">
              {(dateFrom || dateTo) && <button className="btn ghost" onClick={()=>{ setDateFrom(''); setDateTo(''); }}>Limpiar</button>}
              <button className="btn" onClick={downloadCSV}>Exportar CSV</button>
              <button className="btn" onClick={printHistory}>Imprimir historial</button>
            </div>
          </div>

          {filteredVisits.length===0 ? (
            <div className="derma-subtitle">No hay consultas en el rango seleccionado.</div>
          ) : (
            <div className="derma-timeline">
              {filteredVisits.map(v => {
                const rxList = (byVisit.get(v.id) || []);
                const meds = [], indic = [];
                rxList.forEach(rx => {
                  rx.items.forEach(it => {
                    if ((it.tipo||'medicamento') === 'medicamento') meds.push(it);
                    else indic.push(it);
                  })
                });
                return (
                  <article key={v.id} className="derma-timeline-item">
                    <div className="derma-timeline-date">{formatDate(v.date || v.createdAt)}</div>
                    <div className="derma-timeline-card">
                      <div style={{display:'flex', justifyContent:'space-between', gap:8, alignItems:'center'}}>
                        <h3 className="derma-visit-title" style={{margin:0}}>
                          {v.reason} <span className="derma-visit-dx">{v.diagnosis}</span>
                        </h3>
                        <button className="btn ghost" onClick={()=>printSingleVisit(v)}>PDF</button>
                      </div>

                      {/* (Ocultos en impresión por CSS) */}
                      {v.notes && <p className="derma-visit-notes"><b>Notas:</b> {v.notes}</p>}
                      {v.recommendations && <p className="derma-visit-reco"><b>Recomendaciones:</b> {v.recommendations}</p>}

                      <div className="derma-visit-rx">
                        <h4 className="derma-section-subtitle">Recetado</h4>
                        {meds.length === 0 ? (
                          <div className="derma-subtitle">Sin medicamentos recetados.</div>
                        ) : (
                          <ul className="derma-list tight">
                            {meds.map((it,i)=> (
                              <li key={i} className="derma-list-item"><div className="derma-patient-meta">• {it.med} — {it.dosis} — {it.frecuencia}</div></li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="derma-visit-rx" style={{marginTop:10}}>
                        <h4 className="derma-section-subtitle">Prescrito</h4>
                        {indic.length === 0 ? (
                          <div className="derma-subtitle">Sin indicaciones registradas.</div>
                        ) : (
                          <ul className="derma-list tight">
                            {indic.map((it,i)=> (
                              <li key={i} className="derma-list-item"><div className="derma-patient-meta">• {it.med} — {it.dosis} — {it.frecuencia}</div></li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Recetas huérfanas (no se filtran por rango) */}
          {orphans.length > 0 && (
            <section className="derma-card" style={{marginTop:16}}>
              <h2 className="derma-section-title">Recetas sin visita</h2>
              <ul className="derma-list tight">
                {orphans.map(orx => (
                  <li key={orx.id} className="derma-list-item">
                    <div>
                      <div className="derma-patient-meta"><b>Creada:</b> {formatDateTime(orx.createdAt)}</div>
                      <div style={{marginTop:6}}>
                        {orx.items.map((it,i)=> (
                          <div key={i} className="derma-patient-meta">• {it.med} — {it.dosis} — {it.frecuencia} <i>({it.tipo||'medicamento'})</i></div>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="derma-subtitle" style={{ marginTop: 8 }}>
                Sugerencia: añade <code>visitId</code> en backend si corresponde.
              </div>
            </section>
          )}
        </section>
      )}

      {/* Acciones base */}
      <div style={{display:'flex', gap:8}}>
        <Link className="btn ghost" to="..">← Volver a pacientes</Link>
        <button className="btn" onClick={()=>navigate(0)}>Refrescar</button>
      </div>

      {/* TOASTS */}
      {toasts.length>0 && (
        <div className="dui-toasts" role="status" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={`dui-toast --${t.tone}`}>
              <div className="dui-toast__row">
                <p className="dui-toast__title">{t.title}</p>
                <button className="dui-toast__close" onClick={()=>dismissToast(t.id)}>✕</button>
              </div>
              {t.msg && <p className="dui-toast__msg">{t.msg}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Chatbot médico */}
      <MedChat patient={patient} visits={visits} />
    </div>
  );
}

/* ——— helpers para PDF individual ——— */
function buildVisitHTML({ patient, fecha, meds, indic }) {
  const li = (arr) =>
    arr.length === 0
      ? `<div class="muted">Sin datos.</div>`
      : `<ul>${arr
          .map(
            it =>
              `<li>${escapeHtml(it.med)} — ${escapeHtml(it.dosis)} — ${escapeHtml(
                it.frecuencia
              )}</li>`
          )
          .join('')}</ul>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Visita - ${escapeHtml(fecha)}</title>
  <style>
    body{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111; margin:24px; }
    h1,h2,h3{ margin:0 0 8px; }
    .muted{ color:#555 }
    .sec{ margin-top:14px; }
    ul{ margin:8px 0 0; padding-left:18px; }
    li{ margin:4px 0; }
    .hr{ height:1px; background:#ddd; margin:12px 0; }
    @media print{ @page{ margin: 16mm } }
  </style>
</head>
<body>
  <h1>${escapeHtml(patient?.name || 'Paciente')}</h1>
  <div class="muted">${escapeHtml(maskDPI(patient?.dpi))} • ${escapeHtml(formatPhone(patient?.phone))}</div>
  <div class="hr"></div>

  <h2>Visita del ${escapeHtml(fecha)}</h2>

  <div class="sec">
    <h3>Recetado</h3>
    ${li(meds)}
  </div>

  <div class="sec">
    <h3>Prescrito</h3>
    ${li(indic)}
  </div>

  <script>
    window.onload = () => setTimeout(() => window.print(), 50);
  </script>
</body>
</html>`;
}

function openPrintableHTML(html, filename = 'visita.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Intento 1: abrir nueva pestaña (la propia página ejecuta window.print())
  const w = window.open(url, '_blank');
  if (w && typeof w === 'object') {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }

  // Fallback: iframe oculto si bloquean popups
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-9999px';
  iframe.style.bottom = '-9999px';
  iframe.width = '1';
  iframe.height = '1';
  document.body.appendChild(iframe);
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        iframe.remove();
      }, 2000);
    }
  };
}

/* ——— utils ——— */
function formatDate(iso){ try{ const d=new Date(iso); return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'}) }catch{ return iso } }
function formatDateTime(iso){ try{ const d=new Date(iso); return d.toLocaleString() }catch{ return iso } }
function maskDPI(dpi){ if(!dpi) return '—'; const s=String(dpi).replace(/\D/g,''); if(s.length!==13) return s; return s.slice(0,4)+' •••• •'+s.slice(9) }
function formatPhone(phone){ if(!phone) return '—'; const s=String(phone).replace(/\D/g,''); if(s.length===11 && s.startsWith('502')) return '+502 '+s.slice(3,7)+'-'+s.slice(7); if(s.length===8) return s.slice(0,4)+'-'+s.slice(4); return phone }
function getInitials(name){ if(!name) return 'P'; const parts=name.trim().split(/\s+/); const first=parts[0]?.[0]||''; const last=parts.length>1?parts[parts.length-1][0]:''; return (first+last).toUpperCase() }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) }
