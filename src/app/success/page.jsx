'use client';
import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [esB2b, setEsB2b] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (orderId) {
      // ── B2B: disparar la generación del borrador (redactor + revisor) ──
      setEsB2b(true);
      fetch('/api/orders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
      return;
    }

    const sessionId = searchParams.get('session');
    if (!sessionId) {
      window.location.href = '/';
      return;
    }

    // Activar sesión en Supabase y redirigir al chat (flujo B2C)
    fetch('/api/activate-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          localStorage.setItem('juanita_session', data.sessionId || sessionId);
          window.location.href = '/?paid=true&sid=' + (data.sessionId || sessionId);
        } else {
          localStorage.setItem('juanita_session', sessionId);
          window.location.href = '/?paid=true&sid=' + sessionId;
        }
      })
      .catch(() => {
        localStorage.setItem('juanita_session', sessionId);
        window.location.href = '/?paid=true&sid=' + sessionId;
      });
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#faf8f4', fontFamily: 'system-ui, sans-serif', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2a', marginBottom: 8 }}>
          ¡Pago confirmado!
        </div>
        {esB2b ? (
          <div style={{ fontSize: 14, color: '#6a5e50', lineHeight: 1.6 }}>
            Tu documento se está preparando. Lo revisará un abogado y te lo enviaremos por correo en 24–48 horas hábiles.
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#6a5e50' }}>
            Activando tu consulta...
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf8f4' }} />}>
      <SuccessContent />
    </Suspense>
  );
}
