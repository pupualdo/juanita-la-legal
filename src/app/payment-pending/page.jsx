'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function PendingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get('session');
  const [checking, setChecking] = useState(false);
  const [dots, setDots] = useState('');

  // Animar los puntos
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(id);
  }, []);

  // Polling: revisar cada 5s si el webhook ya procesó el pago
  useEffect(() => {
    if (!sessionId) return;
    setChecking(true);

    const poll = async () => {
      try {
        const res = await fetch(`/api/verify-payment?session=${sessionId}&status=check_session`);
        const data = await res.json();
        if (data.ok) {
          router.push(`/?session=${sessionId}&paid=1`);
        }
      } catch {
        // ignorar errores de red en polling
      }
    };

    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [sessionId, router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f0e8', fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '40px 32px',
        maxWidth: 420, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: '#1a3a2a', marginBottom: 10, fontSize: 22, fontWeight: 700 }}>
          Pago en proceso
        </h2>
        <p style={{ color: '#6a5e50', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Tu transferencia bancaria está siendo confirmada.
          Esto puede tomar unos minutos.{' '}
          <strong>No cierres esta página</strong> — te avisaremos automáticamente cuando esté lista.
        </p>

        <div style={{
          background: '#f0f7f0', borderRadius: 12, padding: '14px 18px',
          fontSize: 13, color: '#3a6a3a', marginBottom: 24,
        }}>
          Verificando pago{dots}
        </div>

        <p style={{ fontSize: 12, color: '#a09888' }}>
          Si el problema persiste, escríbenos a{' '}
          <a href="mailto:contacto@juanitalegal.cl" style={{ color: '#2a7a2a' }}>
            contacto@juanitalegal.cl
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense>
      <PendingContent />
    </Suspense>
  );
}
