'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

function ErrorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get('reason') || 'system';
  const msg = params.get('msg') || '';

  // Disparar PaymentFailed en analytics cuando el pago es rechazado
  useEffect(() => {
    if (reason === 'rejected') {
      trackEvent('PaymentFailed', { reason, code: params.get('code') || '' });
    }
  }, [reason]);

  const reasonLabels = {
    timeout: 'La sesión de pago expiró',
    abort: 'Pago cancelado',
    rejected: 'El pago fue rechazado por el banco',
    token_expired: 'El token de WebPay expiró (demasiado lento en sandbox)',
    system: 'Hubo un problema con el pago',
  };

  const label = reasonLabels[reason] || reasonLabels.system;

  return (
    <div style={{ textAlign:'center', padding: 60, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
      <h2 style={{ color: '#c85a20', marginBottom: 8 }}>{label}</h2>
      <p style={{ color: '#6a5e50', marginBottom: 24 }}>
        No se realizó ningún cargo. Puedes intentarlo de nuevo.
      </p>
      {msg && (
        <p style={{ color: '#8a7a68', fontSize: 11, marginBottom: 24, wordBreak: 'break-all', maxWidth: 400, margin: '0 auto 24px' }}>
          {decodeURIComponent(msg)}
        </p>
      )}
      <button
        onClick={() => router.push('/')}
        style={{
          background: '#1a3a2a', color: 'white', border: 'none',
          borderRadius: 12, padding: '12px 24px', fontSize: 15,
          cursor: 'pointer'
        }}
      >
        Volver a intentar
      </button>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div style={{ textAlign:'center', padding: 60 }}>Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
