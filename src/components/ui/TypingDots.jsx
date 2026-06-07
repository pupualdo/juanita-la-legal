'use client';
import { useState, useEffect } from 'react';
export default function TypingDots() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (elapsed >= 3) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4a7a5a' }}>
        <span>🔍</span>
        <span>Verificando información actualizada...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#8fbc8f',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: '#6a8a6a', fontStyle: 'italic' }}>Juanita está escribiendo...</span>
    </div>
  );
}

