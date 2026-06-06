'use client';
import { TOPIC_LABELS, TOPIC_META, TOPIC_DETAILS, TOPIC_NO_INCLUYE } from '@/lib/constants';
import Section from '@/components/ui/Section';
export default function TopicDetailModal({ topicKey, onClose, onStart }) {
  const m = TOPIC_META[topicKey];
  const details = TOPIC_DETAILS[topicKey];
  if (!m || !details) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(10,20,15,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, animation: "fadeUp 0.18s ease-out",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20, maxWidth: 520, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{
          background: m.bg, borderBottom: `2px solid ${m.border}`,
          padding: "20px 24px", borderRadius: "20px 20px 0 0",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 42 }}>{m.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
              Tema
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#2a2018", lineHeight: 1.2 }}>
              {TOPIC_LABELS[topicKey]}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer",
              width: 32, height: 32, borderRadius: "50%", fontSize: 18, color: "#5a4a3a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 8px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            En qué te orienta Juanita
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
            {details.incluye.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ color: m.color, fontWeight: 700, fontSize: 17, flexShrink: 0, lineHeight: 1.5 }}>✓</span>
                <span style={{ fontSize: 16, color: "#2a2018", lineHeight: 1.55 }}>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ fontSize: 14, fontWeight: 700, color: "#5a4a3a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Ejemplos típicos
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
            {details.ejemplos.map((item, i) => (
              <li key={i} style={{
                background: "#faf6ee", border: "1px solid #ece4d4", borderRadius: 10,
                padding: "12px 14px", marginBottom: 9,
                fontSize: 15, color: "#3a3028", lineHeight: 1.5, fontStyle: "italic",
              }}>
                "{item}"
              </li>
            ))}
          </ul>

          <div style={{
            background: "#f5f1ea", border: "1px solid #e0d5c0", borderRadius: 10,
            padding: "13px 15px", marginBottom: 4,
            fontSize: 14, color: "#5a4a3a", lineHeight: 1.55,
          }}>
            <strong style={{ color: "#3a3028" }}>Importante:</strong> {TOPIC_NO_INCLUYE}
          </div>
        </div>

        {/* Footer / CTA */}
        <div style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid #f0eadf",
          display: "flex", gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: "0 0 auto", background: "transparent", border: "1.5px solid #d8cfc0",
              color: "#6a5e50", borderRadius: 12, padding: "13px 20px",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Volver
          </button>
          <button
            onClick={onStart}
            style={{
              flex: 1, background: "#1a3a2a", color: "white", border: "none",
              borderRadius: 12, padding: "13px 20px",
              fontSize: 16, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(26,58,42,0.25)",
            }}
          >
            Consultar sobre {TOPIC_LABELS[topicKey].toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

