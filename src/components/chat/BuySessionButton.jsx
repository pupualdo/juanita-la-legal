'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { track } from '@vercel/analytics';
export default function BuySessionButton({ sessionId }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: 'documento', resumen: 'Sesión de elaboración de documento', sessionId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setLoading(false);
        alert('Error al crear el pago. Intenta de nuevo.');
      }
    } catch {
      setLoading(false);
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      style={{
        marginTop: 10, background: loading ? '#a0b8a0' : '#2a7a2a', color: 'white',
        border: 'none', borderRadius: 10, padding: '10px 16px',
        fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {loading ? '⏳ Redirigiendo...' : '📄 Comprar sesión de documento ($4.995)'}
    </button>
  );
}
