'use client';
import { useRouter } from 'next/navigation';

export default function PaymentErrorPage() {
  const router = useRouter();
  return (
    <div style={{ textAlign:'center', padding: 60, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
      <h2 style={{ color: '#c85a20', marginBottom: 8 }}>Hubo un problema con el pago</h2>
      <p style={{ color: '#6a5e50', marginBottom: 24 }}>
        No se realizó ningún cargo. Puedes intentarlo de nuevo.
      </p>
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
