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

function PromosDashboard() {
  const [codes, setCodes] = useState(null);
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
      const data = await res.json();
      const list = data.promos ?? data.codes ?? [];
      setCodes(prev => {
        if (prev) setPrevCodes(new Set(prev.map(c => c.code)));
        return list;
      });
      setLastLoad(new Date());
    } catch {
      setError('Error de red');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    timerRef.current = setInterval(() => load(false), 60_000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const now = new Date();
  const isExpired = c => c.expires_at && new Date(c.expires_at) < now;
  const isExhausted = c => c.max_uses && c.max_uses < 9999 && (c.max_uses - (c.used_count ?? 0)) <= 0;
  const isInactive = c => isExpired(c) || isExhausted(c);

  // Stats
  const total       = codes?.length ?? 0;
  const activos     = codes?.filter(c => !isInactive(c)).length ?? 0;
  const agotados    = codes?.filter(c => isExhausted(c) && !isExpired(c)).length ?? 0;
  const expirados   = codes?.filter(c => isExpired(c)).length ?? 0;
  const usosTotales = codes?.reduce((s, c) => s + (c.used_count ?? 0), 0) ?? 0;

  const S = {
    page:    { background: '#0f0f0f', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#e5e5e5' },
    wrap:    { maxWidth: 900, margin: '0 auto', padding: '32px 16px' },
    hdr:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    h1:      { fontSize: 22, fontWeight: 700, margin: 0, color: '#f5f5f5' },
    sub:     { fontSize: 12, color: '#666', marginTop: 4 },
    btn:     { padding: '7px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#ccc' },
    cards:   { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 },
    card:    { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 20px' },
    cLabel:  { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    cValue:  { fontSize: 28, fontWeight: 700, color: '#f5f5f5' },
    table:   { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden' },
    th:      { fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #2a2a2a' },
    td:      { fontSize: 13, padding: '12px 12px', verticalAlign: 'middle', color: '#ccc' },
    code:    { fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#7dd3fc' },
    free:    { display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#14532d', color: '#86efac' },
    part:    { display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#1e3a5f', color: '#93c5fd' },
    err:     { background: '#3b0a0a', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
    new:     { fontSize: 10, marginLeft: 5 },
    foot:    { fontSize: 11, color: '#444', marginTop: 14 },
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.hdr}>
          <div>
            <h1 style={S.h1}>Códigos de descuento</h1>
            {lastLoad && <div style={S.sub}>Actualizado: {lastLoad.toLocaleTimeString('es-CL')} · auto-refresh cada 1 min</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href="/admin/feedback" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Admin</a>
            <button style={S.btn} onClick={() => load(true)} disabled={loading}>
              {loading ? 'Cargando…' : '↻ Recargar'}
            </button>
          </div>
        </div>

        {error && <div style={S.err}>{error}</div>}

        {/* Summary cards */}
        <div style={S.cards}>
          {[
            { label: 'Total', value: total },
            { label: 'Activos', value: activos },
            { label: 'Agotados', value: agotados },
            { label: 'Expirados', value: expirados },
            { label: 'Usos totales', value: usosTotales },
          ].map(({ label, value }) => (
            <div key={label} style={S.card}>
              <div style={S.cLabel}>{label}</div>
              <div style={S.cValue}>{codes === null ? '…' : value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={S.table}>
          {codes === null ? (
            <div style={{ color: '#666', padding: 24, textAlign: 'center' }}>Cargando…</div>
          ) : codes.length === 0 ? (
            <div style={{ color: '#666', padding: 24 }}>No hay códigos en la base de datos.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Código</th>
                  <th style={S.th}>Descuento</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Quedan</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Usados / Máx</th>
                  <th style={S.th}>Sesión</th>
                  <th style={S.th}>Vence</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(c => {
                  const isNew = !prevCodes.has(c.code) && prevCodes.size > 0;
                  const unlimited = !c.max_uses || c.max_uses >= 9999;
                  const remaining = unlimited ? '∞' : Math.max(0, c.max_uses - (c.used_count ?? 0));
                  const exhausted = !unlimited && remaining === 0;
                  const expired = isExpired(c);
                  const inactive = exhausted || expired;
                  return (
                    <tr key={c.code} style={{ borderBottom: '1px solid #222', opacity: inactive ? 0.4 : 1 }}>
                      <td style={S.td}>
                        <span style={S.code}>{c.code}</span>
                        {isNew && <span style={S.new}>🆕</span>}
                        {exhausted && <span style={{ fontSize: 10, color: '#f87171', marginLeft: 6 }}>agotado</span>}
                        {expired && <span style={{ fontSize: 10, color: '#fb923c', marginLeft: 6 }}>expirado</span>}
                      </td>
                      <td style={S.td}>
                        <span style={c.discount === 100 ? S.free : S.part}>
                          {c.discount === 100 ? 'Gratis' : `${c.discount}%`}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 600, color: exhausted ? '#f87171' : '#e5e5e5' }}>
                        {remaining}
                      </td>
                      <td style={{ ...S.td, textAlign: 'right', color: '#666' }}>
                        {c.used_count ?? 0} / {unlimited ? '∞' : c.max_uses}
                      </td>
                      <td style={S.td}>{c.session_minutes ? `${c.session_minutes} min` : '—'}</td>
                      <td style={{ ...S.td, color: expired ? '#fb923c' : '#666', fontSize: 11 }}>
                        {c.expires_at ? fmt(c.expires_at) : '∞'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={S.foot}>
          Para agregar, modificar o eliminar códigos usar el SQL Editor de Supabase.
          Códigos con discount=100 saltan Mercado Pago y activan la sesión directo.
        </div>
      </div>
    </div>
  );
}

export default function PromosPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontFamily: 'system-ui', background: '#0f0f0f', minHeight: '100vh', color: '#666' }}>Cargando…</div>}>
      <PromosDashboard />
    </Suspense>
  );
}
