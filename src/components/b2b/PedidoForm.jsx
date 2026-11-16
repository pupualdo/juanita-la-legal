'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
  border: '1px solid #e7e0d4',
  borderRadius: 10,
  background: '#ffffff',
  color: '#2d2a26',
  fontFamily: 'inherit',
  marginBottom: 10,
  boxSizing: 'border-box',
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#5c574e', margin: '0 0 4px' };

function Campo({ campo, value, onChange }) {
  if (campo.tipo === 'select') {
    return (
      <div>
        <label style={labelStyle}>{campo.label}{campo.requerido ? ' *' : ''}</label>
        <select style={inputStyle} value={value || ''} onChange={(e) => onChange(e.target.value)} required={campo.requerido}>
          <option value="" disabled>Selecciona…</option>
          {campo.opciones.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </div>
    );
  }
  if (campo.tipo === 'textarea') {
    return (
      <div>
        <label style={labelStyle}>{campo.label}{campo.requerido ? ' *' : ''}</label>
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={value || ''} onChange={(e) => onChange(e.target.value)} required={campo.requerido} />
      </div>
    );
  }
  return (
    <div>
      <label style={labelStyle}>{campo.label}{campo.requerido ? ' *' : ''}</label>
      <input
        type={campo.tipo === 'number' ? 'number' : campo.tipo === 'date' ? 'date' : 'text'}
        style={inputStyle}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={campo.requerido}
      />
    </div>
  );
}

export default function PedidoForm({ item, onClose }) {
  const [formData, setFormData] = useState({});
  const [empresa, setEmpresa] = useState('');
  const [rut, setRut] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [giro, setGiro] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setCampo = (id, valor) => setFormData((prev) => ({ ...prev, [id]: valor }));

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entregable_id: item.id,
          form_data: formData,
          empresa,
          rut,
          razon_social: razonSocial || null,
          giro: giro || null,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el pedido');
      trackEvent('AddPaymentInfo', { entregable: item.id, precio: item.precio });
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,42,38,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#faf8f4', borderRadius: 20, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '28px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 600, color: '#2d2a26', margin: 0 }}>
              {item.emoji} {item.nombre}
            </h2>
            <div style={{ fontSize: 14, color: '#5c574e', marginTop: 4 }}>Revisado por abogado · {item.plazo}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#8a8378' }}>×</button>
        </div>

        <form onSubmit={enviar}>
          {/* Datos del documento */}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2a26', margin: '16px 0 8px' }}>Datos del documento</h3>
          {item.campos.map((campo) => (
            <Campo key={campo.id} campo={campo} value={formData[campo.id]} onChange={(v) => setCampo(campo.id, v)} />
          ))}

          {/* Datos de facturación */}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2a26', margin: '16px 0 8px' }}>Datos para facturar</h3>
          <div>
            <label style={labelStyle}>Nombre de la empresa *</label>
            <input style={inputStyle} value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>RUT de la empresa *</label>
            <input style={inputStyle} value={rut} onChange={(e) => setRut(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Razón social (opcional)</label>
            <input style={inputStyle} value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Giro (opcional)</label>
            <input style={inputStyle} value={giro} onChange={(e) => setGiro(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Correo para recibir el documento *</label>
            <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {error && <p style={{ color: '#b3452e', fontSize: 14 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderRadius: 12,
              background: '#2d2a26',
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: 16,
            }}
          >
            {loading ? 'Preparando pago…' : `Pagar y pedir el documento — ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.precio)}`}
          </button>
          <p style={{ fontSize: 12, color: '#8a8378', textAlign: 'center', marginTop: 10 }}>
            El pago se procesa por MercadoPago. Nada se entrega sin revisión de abogado.
          </p>
        </form>
      </div>
    </div>
  );
}
