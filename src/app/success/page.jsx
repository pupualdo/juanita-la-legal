'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const verify = async () => {
      const paymentId = params.get('payment_id');
      const sessionId = params.get('session');
      const status    = params.get('status');

      const res  = await fetch(
        `/api/verify-payment?payment_id=${paymentId}&session=${sessionId}&status=${status}`
      );
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem('juanita_session', data.sessionId);
        router.push('/?paid=true');
      } else {
        router.push('/payment-error');
      }
    };
    verify();
  }, [params, router]);

  return (
    <div style={{ textAlign:'center', padding: 60, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
      <p style={{ fontSize: 16, color: '#6a5e50' }}>Verificando tu pago...</p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign:'center', padding: 60, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 16, color: '#6a5e50' }}>Cargando...</p>
      </div>
    }>
      <SuccessInner />
    </Suspense>
  );
}
