'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
export default function ContactForm({ topic, sessionId }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name, phone, email, description, tema: topic, sessionId,
        }),
      });
    } catch {}
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{
        marginTop: 12, background: '#f0faf0', border: '1.5px solid #a8d5a0',
        borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#2a5a2a',
        fontWeight: 500,
      }}>
        ✅ ¡Datos enviados! Un profesional te contactará pronto.
      </div>
    );
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #d8cfc0', borderRadius: 9,
    padding: '9px 11px', fontSize: 13, color: '#2a2018', background: 'white',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        required type="text" placeholder="Nombre completo"
        value={name} onChange={e => setName(e.target.value)} style={inputStyle}
      />
      <input
        required type="tel" placeholder="Teléfono o WhatsApp"
        value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle}
      />
      <input
        required type="email" placeholder="Correo electrónico"
        value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
      />
      <textarea
        required placeholder="¿Qué necesitas? Describe brevemente tu caso"
        value={description} onChange={e => setDescription(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <button
        type="submit" disabled={submitting}
        style={{
          background: submitting ? '#a0b8a0' : '#2a7a2a', color: 'white',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Enviando...' : 'Enviar datos de contacto'}
      </button>
    </form>
  );
}

// ─── BUY SESSION BUTTON ──────────────────────────────────────────────────────

