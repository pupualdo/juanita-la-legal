'use client';

import { useEffect, useState } from 'react';

const ESTADOS = ['pagado', 'borrador_generado', 'en_revision', 'aprobado', 'entregado', 'devuelto'];
const ESTADO_COLOR = {
  pagado: '#c49a12',
  borrador_generado: '#3a6fd4',
  en_revision: '#7a4ad4',
  aprobado: '#2a9a5a',
  entregado: '#4a7a5a',
  devuelto: '#b3452e',
};

export default function RevisionPanel() {
  const [secret, setSecret] = useState('');
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState('en_revision');
  const [seleccionada, setSeleccionada] = useState(null);
  const [borrador, setBorrador] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('secret') || '';
    setSecret(s);
  }, []);

  const cargar = async (estado) => {
    if (!secret) return;
    setLoading(true);
    const res = await fetch(`/api/orders/list?secret=${secret}&estado=${estado}`);
    const data = await res.json();
    if (res.ok) setOrdenes(data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    if (secret) cargar(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, filtro]);

  const seleccionar = (o) => {
    setSeleccionada(o);
    setBorrador(o.borrador || '');
    setNotas(o.notas_revisor || '');
  };

  const accion = async (endpoint, body) => {
    if (!secret) return;
    setLoading(true);
    setMsg('');
    const res = await fetch(`${endpoint}?secret=${secret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMsg(res.ok ? '✅ ' + (data.ok ? 'Listo' : data.error || 'OK') : '❌ ' + (data.error || 'Error'));
    setLoading(false);
    cargar(filtro);
  };

  const guardar = () =>
    accion('/api/orders/update', { orderId: seleccionada.id, borrador, notas_revisor: notas });

  const aprobar = () => accion('/api/orders/update', { orderId: seleccionada.id, estado: 'aprobado', borrador, notas_revisor: notas });

  const devolver = () => accion('/api/orders/update', { orderId: seleccionada.id, estado: 'devuelto', notas_revisor: notas });

  const entregar = () => accion('/api/orders/deliver', { orderId: seleccionada.id });

  const regenerar = () => accion('/api/orders/update', { orderId: seleccionada.id, estado: 'pagado' }).then(() =>
    accion('/api/orders/generate', { orderId: seleccionada.id })
  );

  if (!secret) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui' }}>
        <h1>Panel de revisión B2B</h1>
        <p>Accede con <code>/admin/revision?secret=ADMIN_SECRET</code></p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>🧾 Revisión de pedidos — Juanita B2B</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: filtro === e ? '2px solid #2d2a26' : '1px solid #ddd',
              background: filtro === e ? '#2d2a26' : '#fff',
              color: filtro === e ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            {e} {filtro === e ? `(${ordenes.length})` : ''}
          </button>
        ))}
        <button onClick={() => cargar(filtro)} style={{ marginLeft: 'auto', padding: '8px 14px', cursor: 'pointer' }}>↻ Actualizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Lista */}
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, maxHeight: '70vh', overflow: 'auto' }}>
          {ordenes.length === 0 && <div style={{ padding: 20, color: '#888' }}>Sin pedidos en "{filtro}"</div>}
          {ordenes.map((o) => (
            <div
              key={o.id}
              onClick={() => seleccionar(o)}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                background: seleccionada?.id === o.id ? '#f5f1e8' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.empresa}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{o.entregable_id}</div>
              <span style={{ fontSize: 11, color: ESTADO_COLOR[o.estado] || '#666', fontWeight: 600 }}>{o.estado}</span>
              <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>
                {o.created_at ? new Date(o.created_at).toLocaleDateString('es-CL') : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Detalle */}
        {seleccionada ? (
          <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{seleccionada.empresa}</h2>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
              RUT {seleccionada.rut} · {seleccionada.email} · Estado: <strong>{seleccionada.estado}</strong>
            </div>

            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: '#555' }}>Datos del formulario</summary>
              <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(seleccionada.form_data, null, 2)}
              </pre>
            </details>

            <label style={{ fontSize: 13, fontWeight: 600 }}>Borrador (editable)</label>
            <textarea
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              rows={18}
              style={{ width: '100%', padding: 12, fontSize: 13, fontFamily: 'monospace', borderRadius: 8, border: '1px solid #ddd', margin: '8px 0 16px' }}
            />

            <label style={{ fontSize: 13, fontWeight: 600 }}>Observaciones del revisor IA</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: 12, fontSize: 13, borderRadius: 8, border: '1px solid #ddd', margin: '8px 0 16px', background: '#fffbea' }}
            />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={guardar} disabled={loading} style={btn('#2d2a26', '#fff')}>💾 Guardar</button>
              <button onClick={regenerar} disabled={loading} style={btn('#3a6fd4', '#fff')}>🔄 Regenerar</button>
              <button onClick={devolver} disabled={loading} style={btn('#b3452e', '#fff')}>↩️ Devolver</button>
              <button onClick={aprobar} disabled={loading} style={btn('#2a9a5a', '#fff')}>✅ Aprobar</button>
              {seleccionada.estado === 'aprobado' && (
                <button onClick={entregar} disabled={loading} style={btn('#4a7a5a', '#fff')}>📧 Entregar (.docx + PDF)</button>
              )}
            </div>

            {msg && <div style={{ marginTop: 12, fontSize: 14 }}>{msg}</div>}
          </div>
        ) : (
          <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 40, color: '#888', textAlign: 'center' }}>
            Selecciona un pedido para revisar
          </div>
        )}
      </div>
    </div>
  );
}

const btn = (bg, color) => ({
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: bg,
  color,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});
