'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function Countdown({ iso }) {
  const [display, setDisplay] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function tick() {
      const diff = new Date(iso) - Date.now();
      if (diff <= 0) { setDisplay('Vencida'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setDisplay(`${h}h ${m}m ${s}s`);
    }
    tick();
    ref.current = setInterval(tick, 1_000);
    return () => clearInterval(ref.current);
  }, [iso]);

  return <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1e7e34' }}>{display}</span>;
}

function Stars({ n }) {
  if (n == null) return <span style={{ color: '#bbb' }}>sin calificar</span>;
  return (
    <span title={`${n}/5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#f5a623' : '#ddd', fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

function Badge({ v }) {
  const up = v === 'up';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 12,
      background: up ? '#e6f7ec' : '#fdecea',
      color: up ? '#1e7e34' : '#c0392b',
    }}>
      {up ? '👍 útil' : '👎 error'}
    </span>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

function FeedbackDashboard() {
  const params = useSearchParams();
  const secret = params.get('secret') ?? '';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('sessions'); // 'sessions' | 'messages' | 'active'
  const [filter, setFilter] = useState('all'); // 'all' | 'up' | 'down'

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`/api/admin/feedback?secret=${encodeURIComponent(secret)}`);
      if (res.status === 401) { setError('Token incorrecto — agrega ?secret=TU_CLAVE a la URL'); return; }
      if (!res.ok) { setError('Error al cargar datos'); return; }
      setData(await res.json());
    } catch {
      setError('Error de red');
    }
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  // ── no secret ────────────────────────────────────────────────────────────────
  if (!secret) {
    return (
      <Shell>
        <p style={{ color: '#c0392b' }}>
          Accede con <code>?secret=TU_CLAVE</code> en la URL.<br />
          Configura la variable de entorno <code>ADMIN_SECRET</code> en Vercel.
        </p>
      </Shell>
    );
  }

  if (error) return <Shell><p style={{ color: '#c0392b' }}>{error}</p></Shell>;
  if (!data) return <Shell><p style={{ color: '#888' }}>Cargando…</p></Shell>;

  const { stats, sessions, messageFeedback, activeSessions = [] } = data;

  const filteredMF = filter === 'all' ? messageFeedback
    : messageFeedback.filter(f => f.vote === filter);

  return (
    <Shell>
      {/* ── stats ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        {[
          { label: 'Sesiones pagadas', value: stats.totalSessions },
          { label: '🟢 Activas ahora', value: stats.activeSessions ?? 0 },
          { label: 'Con calificación', value: stats.ratedSessions },
          { label: 'Rating promedio', value: stats.avgRating ? `${stats.avgRating} ★` : '—' },
          { label: '👍 útiles', value: stats.thumbsUp },
          { label: '👎 errores', value: stats.thumbsDown },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12, padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minWidth: 120, textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a3a2a' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
        <button onClick={load} style={{
          marginLeft: 'auto', alignSelf: 'center', padding: '8px 16px',
          background: '#2a7a2a', color: 'white', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontSize: 13,
        }}>↻ Actualizar</button>
      </div>

      {/* ── tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['sessions', 'Sesiones'], ['active', '🟢 Activas ahora'], ['messages', 'Evaluaciones por mensaje']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === id ? '#1a3a2a' : '#e8e0d4',
            color: tab === id ? 'white' : '#555', fontWeight: tab === id ? 600 : 400,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── sessions tab ── */}
      {tab === 'sessions' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0f0e8' }}>
                {['Fecha pago', 'Tema', 'Vence', 'Calificación', 'Comentario'].map(h => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>Sin datos</td></tr>
              )}
              {sessions.map((s, i) => (
                <tr key={s.session_id} style={{ background: i % 2 === 0 ? 'white' : '#fafaf6' }}>
                  <Td>{fmt(s.paid_at)}</Td>
                  <Td>{s.tema ?? '—'}</Td>
                  <Td>{fmt(s.expires_at)}</Td>
                  <Td><Stars n={s.rating} /></Td>
                  <Td style={{ maxWidth: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {s.feedback ?? <span style={{ color: '#bbb' }}>—</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── active sessions tab ── */}
      {tab === 'active' && (
        <div style={{ overflowX: 'auto' }}>
          {activeSessions.length === 0 ? (
            <p style={{ color: '#888', padding: '24px 0' }}>No hay sesiones activas en este momento.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0f0e8' }}>
                  {['ID sesión', 'Tema', 'Pagó el', 'Vence en'].map(h => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((s, i) => (
                  <tr key={s.session_id} style={{ background: i % 2 === 0 ? 'white' : '#fafaf6' }}>
                    <Td style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>
                      {s.session_id?.slice(0, 16)}…
                    </Td>
                    <Td>{s.tema ?? '—'}</Td>
                    <Td style={{ whiteSpace: 'nowrap' }}>{fmt(s.paid_at)}</Td>
                    <Td><Countdown iso={s.expires_at} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── message feedback tab ── */}
      {tab === 'messages' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[['all', 'Todos'], ['up', '👍 útiles'], ['down', '👎 errores']].map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                background: filter === v ? '#1a3a2a' : '#e8e0d4',
                color: filter === v ? 'white' : '#555',
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0f0e8' }}>
                  {['Fecha', 'Voto', 'Comentario', 'Fragmento respuesta'].map(h => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMF.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>Sin datos</td></tr>
                )}
                {filteredMF.map((f, i) => (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? 'white' : '#fafaf6' }}>
                    <Td style={{ whiteSpace: 'nowrap' }}>{fmt(f.created_at)}</Td>
                    <Td><Badge v={f.vote} /></Td>
                    <Td style={{ maxWidth: 220, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {f.comment ?? <span style={{ color: '#bbb' }}>—</span>}
                    </Td>
                    <Td style={{ maxWidth: 340, color: '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {f.message_preview ?? '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Shell>
  );
}

// ─── layout helpers ───────────────────────────────────────────────────────────

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f0e8',
      fontFamily: "'Inter', sans-serif", padding: '32px 24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ color: '#1a3a2a', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
          📊 Juanita La Legal — Panel de Feedback
        </h1>
        {children}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{
      padding: '10px 14px', textAlign: 'left', fontWeight: 600,
      color: '#444', borderBottom: '1px solid #ddd',
    }}>
      {children}
    </th>
  );
}

function Td({ children, style }) {
  return (
    <td style={{
      padding: '9px 14px', borderBottom: '1px solid #eee',
      verticalAlign: 'top', ...style,
    }}>
      {children}
    </td>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackDashboard />
    </Suspense>
  );
}
