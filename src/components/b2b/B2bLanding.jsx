'use client';

import { useState } from 'react';
import { CATALOGO, B2B_COPY } from '@/config/catalogo';
import { trackEvent } from '@/lib/analytics';

const formatCLP = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

function EntregaCard({ item }) {
  const [pedido, setPedido] = useState(false);

  const handleCta = () => {
    trackEvent('StartConsultation', { entregable: item.id, precio: item.precio });
    setPedido(true);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e7e0d4',
        borderRadius: 16,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 1px 2px rgba(45,42,38,0.04)',
      }}
    >
      <div style={{ fontSize: 30, lineHeight: 1 }}>{item.emoji}</div>
      <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: '#2d2a26', margin: 0 }}>
        {item.nombre}
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#5c574e', margin: 0, flex: 1 }}>
        {item.descripcion}
      </p>
      <div style={{ borderTop: '1px solid #efe9de', paddingTop: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#2d2a26', fontFamily: 'var(--font-fraunces)' }}>
          {formatCLP(item.precio)}
        </div>
        <div style={{ fontSize: 13, color: '#8a8378', marginTop: 2 }}>
          ⏱️ Entrega en {item.plazo}
        </div>
      </div>
      {pedido ? (
        <div style={{ fontSize: 14, color: '#4a7a5a', background: '#eff7f1', borderRadius: 10, padding: '12px 14px', lineHeight: 1.5 }}>
          ✅ ¡Bien! El formulario de pedido estará disponible muy pronto. Mientras tanto, tu interés quedó registrado.
        </div>
      ) : (
        <button
          onClick={handleCta}
          style={{
            background: '#2d2a26',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 18px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {B2B_COPY.cta}
        </button>
      )}
    </div>
  );
}

export default function B2bLanding() {
  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', color: '#2d2a26' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Hero */}
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#4a7a5a', marginBottom: 16 }}>
            Para micro y pequeñas empresas
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 44, fontWeight: 600, lineHeight: 1.15, margin: '0 0 16px' }}>
            {B2B_COPY.heroTitulo}
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: '#5c574e', maxWidth: 620, margin: '0 auto 20px' }}>
            {B2B_COPY.heroSubtitulo}
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['✅ Precio fijo', '👨‍⚖️ Revisado por abogado', '⏱️ 24–48 horas hábiles'].map((chip) => (
              <span key={chip} style={{ background: '#ffffff', border: '1px solid #e7e0d4', borderRadius: 999, padding: '8px 16px', fontSize: 14, color: '#5c574e' }}>
                {chip}
              </span>
            ))}
          </div>
        </header>

        {/* Catálogo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {CATALOGO.map((item) => (
            <EntregaCard key={item.id} item={item} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8a8378', marginTop: 28 }}>
          {B2B_COPY.notaPrecios}
        </p>
      </div>
    </div>
  );
}
