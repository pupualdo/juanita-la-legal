'use client';
import { useRef, useEffect } from 'react';
import { TOPIC_LABELS, TOPIC_META } from '@/lib/constants';
import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false, loading: () => null });
import TypingDots from '@/components/ui/TypingDots';
export default function PreChatWall({ topic, messages, input, setInput, onSend, onPay, exchanges, isStreaming, maxExchanges, sessionId }) {
  const m = TOPIC_META[topic] || { border: '#d8cfc0', bg: '#faf8f4', color: '#4a5568', emoji: '⚖️' };
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const remaining = maxExchanges - exchanges;
  const progress = (exchanges / maxExchanges) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxWidth: 640, margin: "0 auto", padding: "10px 16px" }}>
      {/* Header con info del límite + barra de progreso */}
      <div style={{
        background: "#f0f5e8", borderRadius: 10, padding: "8px 14px 12px", marginBottom: 10,
        border: "1px solid #b8d98a",
      }}>
        <div style={{ fontSize: 12, color: "#3a5a20", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span>{m.emoji} <strong>{TOPIC_LABELS[topic]}</strong></span>
          <span style={{
            background: remaining <= 1 ? "#fff2ee" : "#e8f0d8",
            color: remaining <= 1 ? "#c44a12" : "#4a7a20",
            padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
          }}>
            {remaining} mensaje{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
          </span>
        </div>
        {/* Barra de progreso */}
        <div style={{
          height: 4, background: "#d8e0c8", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: remaining <= 1 ? "#c44a12" : "#4a7a20",
            borderRadius: 2, transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{ fontSize: 10, color: "#6a7a50", marginTop: 3, textAlign: "center" }}>
          Prueba gratuita — al terminar puedes comprar la consulta completa por $4.995
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 10px" }}>
        {messages.slice(1).filter(m => m.type !== "system" || m.text.includes("Tema:")).map((m, i) => (
          <div key={i} style={{
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: m.type === "user" ? "flex-end" : "flex-start",
          }}>
            {m.type === "system" && (
              <div style={{ fontSize: 11, color: "#8a7a60", fontStyle: "italic", margin: "6px 0", textAlign: "center", width: "100%" }}>
                  {m.text}
                </div>
            )}
            {m.type === "user" && (
              <div style={{
                background: "#1a3a2a", color: "#c8e6c0", borderRadius: "14px 14px 4px 14px",
                padding: "10px 14px", maxWidth: "80%", fontSize: 13, lineHeight: 1.5,
              }}>
                {m.text}
              </div>
            )}
            {m.type === "juanita" && (
              <div style={{
                background: "#f0ebe3", color: "#2d2217", borderRadius: "14px 14px 14px 4px",
                padding: "10px 14px", maxWidth: "88%", fontSize: 13, lineHeight: 1.6,
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '4px 0 8px' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '4px 0 8px' }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: 3, lineHeight: 1.5 }}>{children}</li>,
                    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                    em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div style={{ fontSize: 13, color: "#a09080", padding: "10px 0" }}>
            Juanita está escribiendo...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input o CTA de pago con persuasión */}
      {exchanges < maxExchanges ? (
        <div style={{
          display: "flex", gap: 8, padding: "10px 0 14px",
          borderTop: "1px solid #ece4d4",
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !isStreaming) onSend(); }}
            placeholder="Responde a Juanita..."
            disabled={isStreaming}
            style={{
              flex: 1, border: "1.5px solid #d8cfc0", borderRadius: 10,
              padding: "10px 14px", fontSize: 13, color: "#2a2018",
              background: "white", outline: "none",
            }}
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || isStreaming}
            style={{
              background: input.trim() && !isStreaming ? "#1a3a2a" : "#c0b8a8",
              color: input.trim() && !isStreaming ? "#c8e6c0" : "#8a7a68",
              border: "none", borderRadius: 10, padding: "10px 16px",
              fontSize: 13, fontWeight: 600, cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            Enviar
          </button>
        </div>
      ) : (
        <div style={{ padding: "16px 0 14px", borderTop: "2px solid #e0d8c8" }}>
          {/* Mensaje persuasivo */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3a2a", marginBottom: 4 }}>
              🎯 ¿Listo para la orientación completa?
            </div>
            <div style={{ fontSize: 12, color: "#6a5e50", lineHeight: 1.5 }}>
              Obtén el paso a paso detallado, qué dice la ley exactamente para tu caso,
              {" "}y los riesgos que debes evitar — orientación clara al toque.
            </div>
          </div>
          <button onClick={onPay} style={{
            width: "100%", background: "linear-gradient(135deg, #1a3a2a 0%, #2a5a3a 100%)",
            color: "white", border: "none",
            borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(26,58,42,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            💬 Comprar consulta completa — $4.995
          </button>
          <div style={{ fontSize: 11, color: "#a09080", textAlign: "center", marginTop: 8 }}>
            WebPay / Mercado Pago · Orientación legal personalizada
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DEMO PAYMENT WALL (post-demostración gratuita) ──────────────────────────

