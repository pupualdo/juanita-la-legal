'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Suspense } from 'react';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function maxUsesLabel(n) {
  if (!n || n >= 9999) return '∞';
  return String(n);
}

function PromosDashboard() {
  const [promos, setPromos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLoad, setLastLoad] = useState(null);
  const [prevCodes, setPrevCodes] = useState(new Set());
  const timerRef = useRef(null);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/promo-stats-internal');
      if (!res.ok) { setError('Error al cargar datos'); return; }
      const json = await res.json();
      setPromos(prev => {
        if (prev) setPrevCodes(new Set(prev.map(p => p.code)));
        return json.promos;
      });
      setLastLoad(new Date());
    } catch {
      setError('Error de red');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Auto-refresh cada 60 s
  useEffect(() => {
    load(true);
    timerRef.current = setInterval(() => load(false), 60_000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const s = {
    wrap:  { fontFamily: 'system-ui, sans-serif', maxWidth: 860, margin: '0 auto', padding: '24px 16px', color: '#1a1a1a' },
    hdr:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    h1:    { fontSize: 22, fontWeight: 700, margin: 0 },
    sub:   { fontSize: 12, color: '#999', marginTop: 4 },
    card:  { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    btn:   { padding: '7px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
    err:   { background: '#fdecea', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
    th:    { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 8px', textAlign: 'left' },
    td:    { fontSize: 13, padding: '10px 8px', verticalAlign: 'middle' },
    free:  { display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#e6f7ec', color: '#1e7e34' },
    part:  { display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#fff3e0', color: '#e67e22' },
    new:   { fontSize: 10, marginLeft: 4 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div>
          <h1 style={s.h1}>Códigos de descuento</h1>
          {lastLoad && <div style={s.sub}>Actualizado: {lastLoad.toLocaleTimeString('es-CL')} · auto-refresh cada 1 min</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/admin/feedback" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Feedback</a>
          <button style={s.btn} onClick={() => load(true)} disabled={loading}>
            {loading ? 'Cargando…' : '↻ Recargar'}
          </button>
        </div>
      </div>

      {error && <div style={s.err}>{error}</div>}

      <div style={s.card}>
        {promos === null ? (
          <div style={{ color: '#999', padding: 20, textAlign: 'center' }}>Cargando…</div>
        ) : promos.length === 0 ? (
          <div style={{ color: '#999', padding: 20 }}>No hay códigos en la base de datos.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={s.th}>Código</th>
                <th style={s.th}>Descuento</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Usos</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Máximo</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Restantes</th>
                <th style={s.th}>Sesión</th>
                <th style={s.th}>Creado</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const isNew = !prevCodes.has(p.code) && prevCodes.size > 0;
                const remaining = (p.max_uses >= 9999 || !p.max_uses) ? '∞' : Math.max(0, p.max_uses - (p.used_count ?? 0));
                const exhausted = typeof remaining === 'number' && remaining === 0;
                return (
                  <tr key={p.code} style={{ borderBottom: '1px solid #f5f5f5', opacity: exhausted ? 0.45 : 1 }}>
                    <td style={s.td}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{p.code}</span>
                      {isNew && <span style={s.new}>🆕</span>}
                      {exhausted && <span style={{ fontSize: 10, color: '#c0392b', marginLeft: 6 }}>agotado</span>}
                    </td>
                    <td style={s.td}>
                      <span style={p.discount === 100 ? s.free : s.part}>
                        {p.discount === 100 ? 'Gratis' : `${p.discount}%`}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{p.used_count ?? 0}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{maxUsesLabel(p.max_uses)}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, color: exhausted ? '#c0392b' : '#1a1a1a' }}>{typeof remaining === 'number' ? remaining : '∞'}</td>
                    <td style={s.td}>{p.session_minutes ? `${p.session_minutes} min` : '—'}</td>
                    <td style={{ ...s.td, color: '#999', fontSize: 11 }}>{fmt(p.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>
        Para agregar, modificar o eliminar códigos usar el SQL Editor de Supabase.
        Códigos con discount=100 saltan Mercado Pago y activan la sesión directo.
      </div>
    </div>
  );
}

export default function PromosPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontFamily: 'system-ui' }}>Cargando…</div>}>
      <PromosDashboard />
    </Suspense>
  );
}
