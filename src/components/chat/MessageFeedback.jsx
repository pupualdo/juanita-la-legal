'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
export default function MessageFeedback({ msgId, sessionId, msgPreview }) {
  const [vote, setVote] = useState(null);       // null | 'up' | 'down'
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async (v, c) => {
    setSubmitted(true);
    try {
      await fetch('/api/message-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message_id: msgId,
          vote: v,
          comment: c?.trim() || undefined,
          message_preview: msgPreview,
        }),
      });
    } catch {
      // feedback is non-blocking
    }
  };

  if (submitted) {
    return (
      <div style={{ fontSize: 11, color: '#8a9a88', marginTop: 4, paddingLeft: 2 }}>
        ✓ Gracias — tu evaluación nos ayuda a mejorar
      </div>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* Thumbs up */}
        <button
          onClick={() => { setVote('up'); submit('up'); }}
          title="Buena respuesta"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 5px', borderRadius: 6, lineHeight: 1,
            opacity: vote === 'down' ? 0.3 : 1,
            transition: 'opacity 0.15s, background 0.15s',
            color: vote === 'up' ? '#2a7a2a' : '#a09888',
            fontSize: 14,
          }}
          aria-label="Buena respuesta"
        >👍</button>
        {/* Thumbs down */}
        <button
          onClick={() => { setVote('down'); setShowComment(true); }}
          title="Respuesta mejorable"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 5px', borderRadius: 6, lineHeight: 1,
            opacity: vote === 'up' ? 0.3 : 1,
            transition: 'opacity 0.15s, background 0.15s',
            color: vote === 'down' ? '#c03a1a' : '#a09888',
            fontSize: 14,
          }}
          aria-label="Respuesta mejorable"
        >👎</button>
      </div>

      {/* Comment box — solo si thumbs down */}
      {showComment && (
        <div style={{ marginTop: 6, animation: 'fadeUp 0.15s ease' }}>
          <div style={{ fontSize: 11, color: '#7a6e62', marginBottom: 4 }}>
            ¿Qué podría mejorar? (opcional)
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tu comentario nos ayuda a mejorar el servicio..."
            rows={2}
            autoFocus
            style={{
              width: '100%', border: '1px solid #d8cfc0', borderRadius: 8,
              padding: '6px 9px', fontSize: 12, color: '#2a2018',
              background: '#faf8f4', resize: 'none', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <button
              onClick={() => submit('down', comment)}
              style={{
                background: '#1a3a2a', color: 'white', border: 'none',
                borderRadius: 7, padding: '4px 12px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Enviar</button>
            <button
              onClick={() => { setShowComment(false); setVote(null); }}
              style={{
                background: 'none', color: '#8a7a68', border: '1px solid #d8cfc0',
                borderRadius: 7, padding: '4px 10px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MESSAGE ACTIONS (copy/share) ──────────────────────────────────────────

