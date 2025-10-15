import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listPatients, createPatient, deletePatient } from '../api';

export default function Patients() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name:'', dpi:'', phone:'' });
  const [loading, setLoading] = useState(false);

  // tabs
  const [view, setView] = useState('list'); // 'add' | 'list'
  const barRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // modal: guardado
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [created, setCreated] = useState(null); // {id, name}

  // modales de borrado
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name}
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);

  const TABS = [
    { id: 'add',  label: 'Agregar paciente' },
    { id: 'list', label: 'Ver pacientes'   },
  ];

  const toDigits = (s, max) => (s || '').replace(/\D/g, '').slice(0, max);

  // validaciones
  const dpiDigits   = toDigits(form.dpi, 13);
  const phoneDigits = toDigits(form.phone, 8);
  const isValid =
    form.name.trim().length > 0 &&
    dpiDigits.length === 13 &&
    phoneDigits.length === 8;

  const load = async () => {
    setLoading(true);
    const data = await listPatients(q);
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!isValid) return;
    const payload = {
      name: form.name.trim(),
      dpi: dpiDigits,
      phone: phoneDigits
    };
    const res = await createPatient(payload);
    setForm({ name:'', dpi:'', phone:'' });
    await load();

    let newId = res?.id;
    if (!newId) {
      const found = (Array.isArray(list) ? list : []).find(p => String(p.dpi) === payload.dpi);
      newId = found?.id || null;
    }

    setCreated({ id: newId, name: payload.name });
    setSaveModalOpen(true);
    setView('list');
  };

  const search = async () => { await load(); };

  // confirmar borrado (abre modal de confirmación)
  const askRemove = (p) => {
    setDeleteTarget({ id: p.id, name: p.name });
    setConfirmDeleteOpen(true);
  };

  // ejecutar borrado tras confirmar
  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    await deletePatient(deleteTarget.id);
    setConfirmDeleteOpen(false);
    setDeleteSuccessOpen(true);
    setDeleteTarget(null);
    await load();
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setDeleteTarget(null);
  };

  // Indicador tabs
  const updateIndicator = () => {
    const bar = barRef.current;
    const el  = tabRefs.current[view];
    if (!bar || !el) return;
    const barRect = bar.getBoundingClientRect();
    const elRect  = el.getBoundingClientRect();
    setIndicator({
      left: elRect.left - barRect.left,
      width: elRect.width
    });
  };
  useLayoutEffect(updateIndicator, [view]);
  useEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="dui-container dui-page">
      <header className="dui-page__header">
        <h2 className="dui-title">Gestión de Pacientes</h2>
      </header>

      {/* Tabs */}
      <section className="dui-card">
        <div
          className="dui-tabs"
          role="tablist"
          aria-label="Cambiar vista"
          ref={barRef}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              ref={el => (tabRefs.current[t.id] = el)}
              className={`dui-tab ${view === t.id ? '-active' : ''}`}
              onClick={() => setView(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const idx = TABS.findIndex(x => x.id === view);
                  const dir = e.key === 'ArrowRight' ? 1 : -1;
                  const next = (idx + dir + TABS.length) % TABS.length;
                  setView(TABS[next].id);
                  tabRefs.current[TABS[next].id]?.focus();
                }
              }}
            >
              {t.label}
            </button>
          ))}
          <span
            className="dui-tabs__indicator"
            style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Panel: Agregar */}
      {view === 'add' && (
        <section
          id="panel-add"
          role="tabpanel"
          aria-labelledby="tab-add"
          className="dui-card"
        >
          <div className="dui-grid -cols-3">
            <div>
              <input
                className={`input ${form.name.trim() ? '' : '-invalid'}`}
                placeholder="Nombre"
                value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})}
              />
              {!form.name.trim() && <div className="form-hint">Requerido</div>}
            </div>

            <div>
              <input
                className={`input ${dpiDigits.length===13 ? '' : '-invalid'}`}
                placeholder="DPI (13 dígitos)"
                inputMode="numeric"
                value={dpiDigits}
                onChange={e=>setForm({...form,dpi: e.target.value})}
                maxLength={13}
              />
              {dpiDigits.length!==13 && <div className="form-hint">Debe contener 13 dígitos.</div>}
            </div>

            <div>
              <input
                className={`input ${phoneDigits.length===8 ? '' : '-invalid'}`}
                placeholder="Teléfono (8 dígitos)"
                inputMode="numeric"
                value={phoneDigits}
                onChange={e=>setForm({...form,phone: e.target.value})}
                maxLength={8}
              />
              {phoneDigits.length!==8 && <div className="form-hint">Debe contener 8 dígitos.</div>}
            </div>
          </div>

          <div className="space"></div>
          <div className="dui-actions">
            <button className="btn primary" onClick={save} disabled={!isValid}>
              Guardar paciente
            </button>
            <button className="btn ghost" onClick={()=>setView('list')}>Cancelar</button>
          </div>
        </section>
      )}

      {/* Panel: Lista */}
      {view === 'list' && (
        <section
          id="panel-list"
          role="tabpanel"
          aria-labelledby="tab-list"
          className="dui-card"
        >
          <div className="dui-toolbar">
            <input
              className="input"
              placeholder="Buscar por nombre, DPI o teléfono"
              value={q}
              onChange={e=>setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') search(); }}
            />
            <div className="dui-actions">
              <button className="btn" onClick={search}>Buscar</button>
            </div>
          </div>

          <div className="space"></div>

          {loading ? (
            <div className="muted">Cargando...</div>
          ) : (
            <ul className="list">
              {list.map(p => (
                <li key={p.id} className="list-item">
                  <div className="list-item__meta">
                    <h4 className="list-item__title">{p.name}</h4>
                    <p className="list-item__sub">{p.phone} · {p.dpi}</p>
                  </div>
                  <div>
                    <Link className="btn ghost" to={`/patient/${p.id}`}>Abrir</Link>
                    <span style={{marginLeft:8}} />
                    <button className="btn danger" onClick={()=>askRemove(p)}>Borrar</button>
                  </div>
                </li>
              ))}
              {list.length===0 && <div className="muted">Sin pacientes aún.</div>}
            </ul>
          )}
        </section>
      )}

      {/* Modal: paciente guardado */}
      {saveModalOpen && (
        <div className="dui-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-save-title">
          <div className="dui-modal">
            <div className="dui-modal__header">
              <h3 id="modal-save-title" className="dui-modal__title">Paciente guardado</h3>
              <button className="btn ghost" onClick={()=>setSaveModalOpen(false)}>Cerrar</button>
            </div>
            <div className="dui-modal__body">
              {created?.name ? (
                <p>Se guardó <b>{created.name}</b> correctamente.</p>
              ) : (
                <p>El paciente se guardó correctamente.</p>
              )}
            </div>
            <div className="dui-modal__footer">
              {created?.id ? (
                <button
                  className="btn"
                  onClick={() => { setSaveModalOpen(false); navigate(`/patient/${created.id}`); }}
                >
                  Ver paciente
                </button>
              ) : null}
              <button
                className="btn primary"
                onClick={() => { setSaveModalOpen(false); setView('add'); }}
              >
                Agregar otro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar borrado */}
      {confirmDeleteOpen && (
        <div className="dui-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-del-title">
          <div className="dui-modal">
            <div className="dui-modal__header">
              <h3 id="modal-del-title" className="dui-modal__title">Confirmar eliminación</h3>
              <button className="btn ghost" onClick={cancelDelete}>Cerrar</button>
            </div>
            <div className="dui-modal__body">
              <p>¿Deseas borrar al paciente <b>{deleteTarget?.name || 'seleccionado'}</b>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="dui-modal__footer">
              <button className="btn ghost" onClick={cancelDelete}>Cancelar</button>
              <button className="btn danger" onClick={confirmDelete}>Borrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: borrado exitoso */}
      {deleteSuccessOpen && (
        <div className="dui-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-delok-title">
          <div className="dui-modal">
            <div className="dui-modal__header">
              <h3 id="modal-delok-title" className="dui-modal__title">Paciente eliminado</h3>
              <button className="btn ghost" onClick={()=>setDeleteSuccessOpen(false)}>Cerrar</button>
            </div>
            <div className="dui-modal__body">
              <p>Se eliminó correctamente.</p>
            </div>
            <div className="dui-modal__footer">
              <button className="btn primary" onClick={()=>setDeleteSuccessOpen(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
