'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
export default function RatingModal({ sessionId, onClose }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, rating: selected, comment: comment.trim() || undefined }),
      });
    } catch {
      // no bloquear al usuario si falla
    }
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10, 26, 20, 0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      backdropFilter: "blur(3px)",
    }}>
      <div style={{
        background: "#faf8f4", borderRadius: 24,
        padding: "28px 24px", maxWidth: 380, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        animation: "fadeUp 0.2s ease",
      }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🙌</div>
            <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, fontWeight: 600, color: "#1a3a2a", marginBottom: 8 }}>
              ¡Gracias por tu evaluación!
            </div>
            <div style={{ fontSize: 14, color: "#6a5e50" }}>Nos ayuda a mejorar Juanita.</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚖️</div>
              <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, fontWeight: 600, color: "#1a3a2a", marginBottom: 6 }}>
                ¿Cómo te fue con Juanita?
              </div>
              <div style={{ fontSize: 13, color: "#8a7a68" }}>Tu opinión nos ayuda a mejorar</div>
            </div>

            {/* Estrellas */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setSelected(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px", lineHeight: 1,
                    transition: "transform 0.1s",
                    transform: hovered >= n || selected >= n ? "scale(1.15)" : "scale(1)",
                  }}
                  aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={STAR_COLOR(n, hovered, selected)} stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Textarea: aparece al seleccionar */}
            {selected > 0 && (
              <div style={{ marginBottom: 16, animation: "fadeUp 0.15s ease" }}>
                <textarea
                  placeholder="Cuéntanos tu experiencia... (opcional)"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", border: "1.5px solid #d8cfc0", borderRadius: 12,
                    padding: "10px 12px", fontSize: 13, color: "#2a2018",
                    background: "white", resize: "none", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5,
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                style={{
                  flex: 1, background: selected ? "#1a3a2a" : "#c0b8a8",
                  color: selected ? "#c8e6c0" : "#8a7a68",
                  border: "none", borderRadius: 12, padding: "12px",
                  fontSize: 14, fontWeight: 600,
                  cursor: selected && !submitting ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}
              >
                {submitting ? "Enviando..." : "Enviar evaluación"}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "1.5px solid #d8cfc0",
                  borderRadius: 12, padding: "12px 16px",
                  fontSize: 13, color: "#8a7a68", cursor: "pointer",
                }}
              >
                Saltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TOPIC DETAIL MODAL ──────────────────────────────────────────────────────

