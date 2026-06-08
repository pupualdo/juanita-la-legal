'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { TOPIC_LABELS, TOPIC_META, SUGGESTIONS } from '@/lib/constants';
import TopicDetailModal from './TopicDetailModal';
export default function HeroSection({ onStart }) {
  const [openTopic, setOpenTopic] = useState(null);
  const aboutRef = useRef(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTopicStart = () => { setOpenTopic(null); onStart(); };

  return (
    <>
      {/* HERO — diseño original mantenido */}
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", padding: "40px 20px",
      }}>
        {/* Fondo biblioteca difuso */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=60&fm=webp')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(8px) brightness(0.35) saturate(1.1)",
          transform: "scale(1.12)",
        }} />
        {/* Overlay oscuro cálido */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(15,30,22,0.45) 0%, rgba(10,20,15,0.75) 100%)",
        }} />

        {/* Contenido */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 520, textAlign: "center" }}>
          {/* Avatar circular */}
          <div style={{
            width: 160, height: 160, borderRadius: "50%",
            overflow: "hidden",
            border: "4px solid rgba(255,255,255,0.92)",
            margin: "0 auto 28px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 8px rgba(255,255,255,0.08)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/juanita-avatar.jpg"
              alt="Juanita La Legal"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
          </div>

          <h1 style={{
            fontFamily: "var(--font-fraunces), serif", fontSize: 44, fontWeight: 600,
            color: "#f5f0e8", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.2,
          }}>Juanita La Legal</h1>

          <p style={{ fontSize: 20, color: "#8fbc8f", marginBottom: 8, fontWeight: 500 }}>
            Te orientamos en buen chileno.
          </p>
          <p style={{ fontSize: 16, color: "rgba(245,240,232,0.85)", marginBottom: 18, lineHeight: 1.5 }}>
            Primera orientación legal clara, rápida y pagable. $9.990 por consulta.
          </p>

          {/* Banner de marcha blanca con código LANZAMIENTO */}
          <div style={{
            marginBottom: 28,
            background: "linear-gradient(135deg, rgba(200,160,64,0.20) 0%, rgba(200,160,64,0.10) 100%)",
            border: "1px solid rgba(200,160,64,0.50)",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 12,
            textAlign: "left",
            boxShadow: "0 4px 16px rgba(200,160,64,0.18)",
          }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>🎉</span>
            <div style={{ flex: 1, lineHeight: 1.5 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: "#f0d068",
                textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4,
              }}>
                Marcha blanca
              </div>
              <div style={{ fontSize: 15, color: "rgba(245,240,232,0.95)" }}>
                Estamos lanzando — usa el código{" "}
                <strong style={{
                  background: "rgba(200,160,64,0.35)",
                  color: "#fff5d9",
                  padding: "3px 9px",
                  borderRadius: 5,
                  fontFamily: "monospace",
                  letterSpacing: 0.8,
                  fontSize: 14,
                }}>LANZAMIENTO</strong>{" "}
                y obtén <strong style={{ color: "#f0d068" }}>50% de descuento</strong> en tu consulta.
              </div>
            </div>
          </div>

          <button data-action="start" onClick={onStart} style={{
            background: "#c8a040", color: "white", border: "none",
            borderRadius: 16, padding: "16px 40px", fontSize: 18, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 8px 24px rgba(200,160,64,0.35)",
            transition: "transform 0.15s",
          }}
            onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          >
            Iniciar consulta
          </button>

          {/* Label instructivo */}
          <div style={{
            marginTop: 32, marginBottom: 14,
            fontSize: 14, color: "rgba(245,240,232,0.92)",
            fontWeight: 500, letterSpacing: 0.3,
          }}>
            👇 Toca un tema para ver qué incluye y ejemplos de consultas
          </div>

          {/* Chips clickeables — visualmente obvios */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {Object.entries(TOPIC_META).map(([k, m]) => (
              <button
                key={k}
                onClick={() => setOpenTopic(k)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: 22, padding: "10px 16px 10px 14px", fontSize: 15,
                  color: "rgba(245,240,232,0.95)", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 500,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  transition: "background 0.15s, transform 0.15s, border-color 0.15s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.20)";
                  e.currentTarget.style.borderColor = "rgba(200,160,64,0.6)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span>{m.emoji}</span>
                <span>{TOPIC_LABELS[k]}</span>
                <span style={{
                  fontSize: 11, opacity: 0.7, marginLeft: 2,
                  fontWeight: 700,
                }}>›</span>
              </button>
            ))}
          </div>

          {/* Discreto: invita a saber más */}
          <button
            onClick={scrollToAbout}
            style={{
              marginTop: 28, background: "transparent", border: "none",
              color: "rgba(245,240,232,0.70)", fontSize: 13, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 0.5,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            ¿Qué es Juanita? <span style={{ fontSize: 14 }}>↓</span>
          </button>
        </div>
      </div>

      {/* ── CÓMO FUNCIONA — paso a paso (arriba, después del hero) ── */}
      <div style={{ background: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #ece4d4", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3a2a", marginBottom: 20, textAlign: "center" }}>
              ⚡ Cómo funciona en 3 pasos
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { step: "1", title: "Escribes tu caso", desc: "Cuentas tu problema legal en tus propias palabras, sin lenguaje técnico.", emoji: "✍️" },
                { step: "2", title: "Juanita te orienta", desc: "Te explicamos tus derechos, los pasos a seguir y qué NO hacer. Todo en buen chileno.", emoji: "🧭" },
                { step: "3", title: "Decides con info real", desc: "Sales con un panorama claro. Si necesitas abogado, te decimos honestamente.", emoji: "✅" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#1a3a2a", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1a3a2a", marginBottom: 3 }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#5a4a3a", lineHeight: 1.5 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ABOUT — qué es Juanita */}
      <div ref={aboutRef} style={{
        background: "linear-gradient(to bottom, #faf8f4 0%, #f0ece2 100%)",
        padding: "64px 20px",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "#c8a040", textTransform: "uppercase",
            letterSpacing: 1.5, marginBottom: 14, textAlign: "center",
          }}>
            ¿Qué es Juanita?
          </div>
          <h2 style={{
            fontFamily: "var(--font-fraunces), serif", fontSize: 30, fontWeight: 600,
            color: "#1a3a2a", textAlign: "center", marginBottom: 20, lineHeight: 1.25,
          }}>
            Tu primera puerta a la orientación legal en Chile
          </h2>
          <p style={{
            fontSize: 17, color: "#3a3028", lineHeight: 1.65, textAlign: "center",
            marginBottom: 36,
          }}>
            Te explicamos tus derechos en buen chileno, te ordenamos los pasos a seguir y te decimos cuándo necesitas un abogado de verdad.
          </p>

          <div style={{ display: "grid", gap: 14, marginBottom: 36 }}>
            {[
              { icon: "⚖️", title: "Basado en derecho chileno vigente", text: "Información actualizada de leyes y procedimientos en Chile." },
              { icon: "⚡", title: "Sesión rápida y enfocada", text: "Respuestas al toque, sin esperas ni vueltas." },
              { icon: "🤝", title: "Honestos contigo", text: "Si tu caso necesita un abogado/a, te lo decimos claramente." },
              { icon: "🔒", title: "Sin letra chica", text: "Pago único de $9.990. Sin suscripciones ni compromisos." },
            ].map((item, i) => (
              <div key={i} style={{
                background: "white", borderRadius: 14, padding: "16px 18px",
                display: "flex", gap: 14, alignItems: "flex-start",
                border: "1px solid #ece4d4",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  fontSize: 26, flexShrink: 0, width: 46, height: 46,
                  borderRadius: "50%", background: "#f5f1ea",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1a3a2a", marginBottom: 5 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 15, color: "#5a4a3a", lineHeight: 1.55 }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button onClick={onStart} style={{
              background: "#1a3a2a", color: "white", border: "none",
              borderRadius: 14, padding: "16px 36px", fontSize: 17, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 4px 12px rgba(26,58,42,0.2)",
              fontFamily: "inherit",
            }}>
              Iniciar mi consulta
            </button>
            <div style={{ marginTop: 14, fontSize: 14, color: "#8a7a68" }}>
              Toca cualquier tema arriba para ver qué incluye antes de pagar.
            </div>
          </div>
        </div>
      </div>

      {/* ── Social Proof / Confianza ── */}
      <div style={{ background: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c8a040", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, textAlign: "center" }}>
            Confían en Juanita
          </div>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 28, fontWeight: 600, color: "#1a3a2a", textAlign: "center", marginBottom: 28, lineHeight: 1.25 }}>
            Orientación legal clara, rápida y sin letra chica
          </h2>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
            {[
              { number: "3.000+", label: "Personas orientadas" },
              { number: "10", label: "Áreas legales" },
              { number: "$4.995", label: "50% descuento lanzamiento" },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center", background: "#faf8f4", borderRadius: 14, padding: "16px 10px", border: "1px solid #ece4d4" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1a3a2a", fontFamily: "var(--font-fraunces), serif" }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: 12, color: "#6a5e50", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Value comparison */}
          <div style={{ background: "#f0f5e8", borderRadius: 14, padding: "18px", border: "1px solid #b8d98a", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3a5a20", marginBottom: 6 }}>
              💡 ¿Por qué tiene sentido?
            </div>
            <div style={{ fontSize: 13, color: "#3a3028", lineHeight: 1.6 }}>
              Una consulta con un abogado parte en <strong>$25.000-$50.000</strong> por 30 minutos. Con Juanita obtienes orientación inmediata para ordenar tu caso y saber qué hacer, <strong>10x más barato</strong> que una consulta tradicional. Si luego necesitas abogado, te decimos claramente y te orientamos a dónde ir.
            </div>
          </div>

          {/* Testimonios anónimos */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3a2a", marginBottom: 14, textAlign: "center" }}>
              🗣️ Lo que dicen nuestros usuarios
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  initials: "J.P., Santiago",
                  text: "No sabía si mi despido era legal. Juanita me explicó mis derechos y los pasos a seguir. En 10 minutos tenía claro qué hacer.",
                  area: "Derecho Laboral",
                },
                {
                  initials: "M.C., Valparaíso",
                  text: "Tenía miedo de iniciar el juicio de alimentos. Juanita me ordenó todo: qué papeles necesito, cuánto se demora, qué esperar.",
                  area: "Derecho de Familia",
                },
                {
                  initials: "R.L., Concepción",
                  text: "Mi arrendador se negaba a devolverme la garantía. Juanita me explicó la ley y exactamente cómo reclamar. No necesité abogado.",
                  area: "Arriendo y Vivienda",
                },
                {
                  initials: "A.S., Temuco",
                  text: "Falleció mi papá y no sabía cómo hacer la posesión efectiva. Juanita me guió paso a paso y me ahorré lo de una consulta cara.",
                  area: "Herencia y Sucesión",
                },
              ].map((t, i) => (
                <div key={i} style={{
                  background: "white",
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: "1px solid #ece4d4",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                }}>
                  <div style={{ fontSize: 13, color: "#3a3028", lineHeight: 1.55, fontStyle: "italic", marginBottom: 8 }}>
                    "{t.text}"
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a3a2a" }}>
                      {t.initials}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8a7a60",
                      background: "#faf8f4",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}>
                      {t.area}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#a09080" }}>
              Testimonios anónimos de usuarios reales
            </div>
          </div>
      </div>

      {openTopic && (
        <TopicDetailModal
          topicKey={openTopic}
          onClose={() => setOpenTopic(null)}
          onStart={handleTopicStart}
        />
      )}
    </>
  );
}

// ─── PRE-CHAT WALL (chat real limitado antes del pago) ─────────────────────

