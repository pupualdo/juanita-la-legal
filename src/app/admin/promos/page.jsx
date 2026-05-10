'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function PromosDashboard() {
  const params = useSearchParams();
  const secret = params.get('secret') ?? '';

  const [promos, setPromos] = useState(null);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`/api/admin/promos?secret=${encodeURIComponent(secret)}`);
      if (res.status === 401) { setError('Token incorrecto — agrega ?secret=TU_CLAVE a la URL'); return; }
      if (!res.ok) { setError('Error al cargar datos'); return; }
      const json = await res.json();
      setPromos(json.promos);
    } catch {
      setError('Error de red');
    }
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  async function addCode(e) {
    e.preventDefault();
    const discount = parseInt(newDiscount, 10);
    if (!newCode.trim() || isNaN(discount) || discount < 1 || discount > 100) {
      setMsg('Faltan datos o descuento inválido (1-100)');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/promos?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          discount,
          label: newLabel.trim() || `${discount}% descuento`,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg(json.error || 'Error al crear código'); }
      else { setMsg('Código creado ✓'); setNewCode(''); setNewDiscount(''); setNewLabel(''); load(); }
    } catch { setMsg('Error de red'); }
    setSaving(false);
  }

  async function toggleActive(id, active) {
    await fetch(`/api/admin/promos?secret=${encodeURIComponent(secret)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    load();
  }

  async function deleteCode(id, code) {
    if (!confirm(`¿Eliminar el código "${code}"?`)) return;
    await fetch(`/api/admin/promos?secret=${encodeURIComponent(secret)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const s = {
    wrap: { fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto', padding: '24px 16px', color: '#1a1a1a' },
    h1:   { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    sub:  { fontSize: 13, color: '#666', marginBottom: 24 },
    card: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    btn:  { padding: '9px 18px', background: '#1a7f4b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    row:  { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
    badge: (active) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: active ? '#e6f7ec' : '#f5f5f5', color: active ? '#1e7e34' : '#999',
    }),
    errBox: { background: '#fdecea', color: '#c0392b', padding: '12px 16px', borderRadius: 8, marginBottom: 16 },
    msgBox: { background: '#e6f7ec', color: '#1e7e34', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 },
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={s.h1}>Códigos de descuento</h1>
        <a href={`/admin/feedback?secret=${encodeURIComponent(secret)}`} style={{ fontSize: 13, color: '#666' }}>← Volver a feedback</a>
      </div>
      <p style={s.sub}>Los códigos se guardan en Supabase y se validan en tiempo real.</p>

      {error && <div style={s.errBox}>{error}</div>}

      {/* Create form */}
      <div style={s.card}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Agregar código</div>
        <form onSubmit={addCode}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Código</label>
              <input style={s.input} value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="EJEMPLO2026" />
            </div>
            <div>
              <label style={s.label}>% Descuento</label>
              <input style={s.input} type="number" min="1" max="100" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} placeholder="50" />
            </div>
            <div>
              <label style={s.label}>Etiqueta (opcional)</label>
              <input style={s.input} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="50% descuento" />
            </div>
          </div>
          {msg && <div style={msg.includes('✓') ? s.msgBox : s.errBox}>{msg}</div>}
          <button style={s.btn} type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear código'}</button>
        </form>
      </div>

      {/* List */}
      <div style={s.card}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
          Códigos existentes {promos ? `(${promos.length})` : ''}
        </div>

        {promos === null ? (
          <div style={{ color: '#666', fontSize: 14 }}>Cargando...</div>
        ) : promos.length === 0 ? (
          <div style={{ color: '#999', fontSize: 14 }}>No hay códigos todavía.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 90px 80px 80px', gap: 8, padding: '6px 0', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #eee' }}>
              <span>Código</span><span>Desc.</span><span>Etiqueta</span><span>Estado</span><span>Creado</span><span>Acciones</span>
            </div>
            {promos.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 90px 80px 80px', gap: 8, padding: '10px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'center', fontSize: 13 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{p.code}</span>
                <span>{p.discount}%</span>
                <span style={{ color: '#555' }}>{p.label}</span>
                <span><span style={s.badge(p.active)}>{p.active ? 'Activo' : 'Inactivo'}</span></span>
                <span style={{ color: '#999', fontSize: 11 }}>{fmt(p.created_at)}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggleActive(p.id, p.active)}
                    style={{ fontSize: 11, padding: '3px 8px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: p.active ? '#fff3e0' : '#e6f7ec', color: p.active ? '#e67e22' : '#1e7e34' }}
                  >
                    {p.active ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteCode(p.id, p.code)}
                    style={{ fontSize: 11, padding: '3px 8px', border: '1px solid #fdecea', borderRadius: 6, cursor: 'pointer', background: '#fdecea', color: '#c0392b' }}
                  >
                    Borrar
                  </button>
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
        Los códigos del 100% activan la sesión directamente sin Mercado Pago.
      </div>
    </div>
  );
}

export default function PromosPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontFamily: 'system-ui' }}>Cargando...</div>}>
      <PromosDashboard />
    </Suspense>
  );
}
