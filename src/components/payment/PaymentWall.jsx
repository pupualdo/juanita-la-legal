'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { TOPIC_LABELS, TOPIC_META, DISCLAIMER, SUGGESTIONS } from '@/lib/constants';
import PaymentMethodScreen from './PaymentMethodScreen';
import { trackEvent } from '@/lib/analytics';
export default function PaymentWall({ topic, resumen, sessionId, prevSessionId, prevTopic, autoPromo, onBack }) {
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null); // { discount, label } | null
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [showMethodScreen, setShowMethodScreen] = useState(false);
  const m = TOPIC_META[topic] || {};

  // Returning user changing topic gets $4.000 discount.
  // Requires: a previous paid session AND a stored topic AND the new topic is different AND not a document.
  const isTopicChange = !!(prevSessionId && prevTopic && prevTopic !== topic && topic !== 'documento');

  useEffect(() => {
    track('payment_wall_shown', { tema: topic });
    trackEvent('PaywallViewed', { tema: topic, sessionId });
  }, [topic]);

  const BASE_PRICE = isTopicChange ? 4000 : 9990;
  const finalPrice = promoApplied
    ? Math.round(BASE_PRICE * (1 - promoApplied.discount / 100))
    : BASE_PRICE;
  const isFree = finalPrice === 0;

  const handleApplyPromo = async (codeArg) => {
    const code = (typeof codeArg === 'string' ? codeArg : promoCode).trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);
    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ discount: data.discount, label: data.label });
      } else {
        setPromoError('Código no válido. Intenta con otro.');
      }
    } catch {
      setPromoError('Error al validar el código.');
    }
    setPromoLoading(false);
  };

  // Auto-aplicar código de descuento desde el popup de lanzamiento
  useEffect(() => {
    if (autoPromo) {
      setPromoCode(autoPromo);
      handleApplyPromo(autoPromo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPromo]);

  const handlePay = async () => {
    // Si es gratis, acceso directo sin seleccionar método
    if (isFree) {
      handleMethodSelect('free');
      return;
    }
    // Show payment method selection first
    setShowMethodScreen(true);
  };

  const handleMethodSelect = async (method) => {
    trackEvent('AddPaymentInfo', { tema: topic, method, price: finalPrice });
    setLoading(true);
    setShowMethodScreen(false);
    track('payment_started', { tema: topic, price: finalPrice, method });
    try {
      if (isFree) {
        const grantRes = await fetch('/api/grant-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, promoCode: promoCode.trim().toUpperCase() }),
        });
        const grantData = await grantRes.json();
        if (!grantData.ok) {
          setLoading(false);
          alert('Error al activar el acceso. Intenta de nuevo.');
          return;
        }
        localStorage.setItem('juanita_session', grantData.sessionId);
        localStorage.setItem('juanita_topic', topic);
        // Clear terms acceptance so the user explicitly re-accepts before
        // entering the paid session via a promo/friend code.
        localStorage.removeItem('juanita_terms_accepted');
        window.location.href = '/?paid=true';
        return;
      }

      // ── WebPay: API real de Transbank ──
      if (method === 'webpay') {
        const res = await fetch('/api/webpay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, amount: finalPrice, topic }),
        });
        const data = await res.json();
        if (data.url && data.token) {
          window.location.href = data.url + '?token_ws=' + data.token;
        } else {
          setLoading(false);
          alert(data.error || 'Error al iniciar WebPay. Intenta de nuevo.');
        }
        return;
      }

      // ── Mercado Pago ──
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: topic, resumen, sessionId, promoCode: promoCode.trim().toUpperCase(), isReturnUser: isTopicChange, method }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setLoading(false);
        alert('Error al crear el pago. Intenta de nuevo.');
      }
    } catch {
      setLoading(false);
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  if (showMethodScreen) {
    return (
      <PaymentMethodScreen
        topic={topic}
        finalPrice={finalPrice}
        isFree={isFree}
        promoCode={promoCode}
        onSelect={handleMethodSelect}
        onBack={() => setShowMethodScreen(false)}
      />
    );
  }

  return (
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 520, margin: "0 auto" }}>
      {/* Badge de garantía arriba de todo */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a2a 0%, #2a5a3a 100%)",
        borderRadius: 12, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 4px 12px rgba(26,58,42,0.25)",
      }}>
        <span style={{ fontSize: 22 }}>🛡️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f0d068" }}>
            100% garantizado
          </div>
          <div style={{ fontSize: 12, color: "rgba(245,240,232,0.90)", lineHeight: 1.4 }}>
            Si no te sirve la orientación, te devolvemos tu dinero. Sin preguntas.
          </div>
        </div>
      </div>

      {/* Resumen personalizado del caso */}
      <div style={{ background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 16, padding: "18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          {m.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Tu consulta sobre
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#2a2018", marginBottom: 6, lineHeight: 1.3 }}>
            {TOPIC_LABELS[topic]}
          </div>
          <div style={{ fontSize: 14, color: "#5a4a3a", lineHeight: 1.55, wordBreak: "break-word" }}>
            "{resumen}"
          </div>
        </div>
      </div>

      {/* Session scope notice */}
      <div style={{ background: "#f0f5e8", border: "1px solid #b8d98a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#3a5a20", lineHeight: 1.5 }}>
        <strong>📌 Esta sesión cubre solo tu consulta sobre {TOPIC_LABELS[topic]}</strong>. Puedes preguntar todo lo que quieras sobre este tema durante la sesión. Si después necesitas orientación en otro tema, será una nueva consulta.
      </div>

      {/* Returning user discount badge */}
      {isTopicChange && (
        <div style={{ background: "#fffbef", border: "1.5px solid #f0de8a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#7a5a00", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔄</span>
          <div>
            <div style={{ fontWeight: 700 }}>Descuento por cambio de tema</div>
            <div style={{ fontSize: 12, color: "#8a6a20", marginTop: 1 }}>Como ya tienes una sesión previa, esta consulta vale <strong>$4.000</strong> en vez de $9.990.</div>
          </div>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 18, padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a3a2a", marginBottom: 12 }}>
          🔓 Desbloquea tu consulta guiada
        </div>

        {/* Promo code field — arriba para que sea visible en móvil */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              placeholder="¿Tienes un código de descuento?"
              disabled={!!promoApplied}
              style={{
                flex: 1, padding: "10px 12px", fontSize: 13, border: "1.5px solid #e0d8cc",
                borderRadius: 10, outline: "none", background: promoApplied ? "#f0f5e8" : "white",
                color: "#3a3028",
              }}
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !!promoApplied || !promoCode.trim()}
              style={{
                padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "none",
                borderRadius: 10, cursor: promoApplied || !promoCode.trim() ? "default" : "pointer",
                background: promoApplied ? "#4a7a20" : "#1a3a2a", color: "white",
                opacity: promoLoading ? 0.7 : 1,
              }}
            >
              {promoApplied ? "✓" : promoLoading ? "..." : "Aplicar"}
            </button>
          </div>
          {promoError && (
            <div style={{ fontSize: 12, color: "#c0392b", marginTop: 5 }}>{promoError}</div>
          )}
        </div>

        <div style={{ background: "#f5f0e8", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "#6a5e50" }}>{isTopicChange ? 'Cambio de tema · pago único' : 'Consulta completa · pago único'}</span>
          <div style={{ textAlign: "right" }}>
            {promoApplied && (
              <div style={{ fontSize: 12, color: "#a09080", textDecoration: "line-through" }}>
                ${BASE_PRICE.toLocaleString('es-CL')}
              </div>
            )}
            <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 700, color: isFree ? "#4a7a20" : "#1a3a2a" }}>
              {isFree ? "¡Gratis!" : `$${finalPrice.toLocaleString('es-CL')}`}
            </span>
            {promoApplied && (
              <div style={{ fontSize: 11, color: "#4a7a20", fontWeight: 600 }}>
                {promoApplied.label} aplicado ✓
              </div>
            )}
          </div>
        </div>

        {["Orientación detallada sobre tus derechos", "Preguntas guiadas para ordenar tu caso", "Riesgos, opciones y próximos pasos concretos", "Derivación a instituciones y recursos de ayuda"].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "#4a7a20", fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: 13, color: "#3a3028" }}>{item}</span>
          </div>
        ))}

        {!loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Texto anti-miedo justo antes del botón */}
            <div style={{
              background: "#f0f8f0", borderRadius: 10, padding: "10px 12px",
              border: "1px solid #c8e6c9", fontSize: 12, color: "#3a5a20", lineHeight: 1.5,
            }}>
              Juanita no reemplaza a un abogado — te ayuda a llegar preparado. Si tu caso requiere representación legal, te lo diremos claramente y no perderás tu dinero.
            </div>
            <button onClick={handlePay} style={{
              width: "100%", background: isFree ? "#4a7a20" : "#009ee3", color: "white", border: "none",
              borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {isFree ? "🎉 Acceder gratis" : "💳 Pagar con WebPay / Tarjeta"}
            </button>

            {!isFree && (
              <div style={{
                background: "#faf8f4", borderRadius: 12, padding: "14px",
                border: "1px solid #ece4d4",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a3a2a", marginBottom: 8 }}>
                  🏦 Transferencia bancaria
                </div>
                <div style={{ fontSize: 12, color: "#6a5e50", lineHeight: 1.6, marginBottom: 8 }}>
                  Transfiere a la cuenta y escríbenos a <strong>contacto@juanitalalegal.cl</strong> con tu comprobante.
                </div>
                <div style={{
                  background: "white", borderRadius: 8, padding: "10px 12px",
                  border: "1px dashed #d8cfc0", fontSize: 12, color: "#3a3028", lineHeight: 1.8,
                }}>
                  <div><strong>Banco:</strong> Banco de Chile</div>
                  <div><strong>Titular:</strong> Asesorías del Meridiano Limitada</div>
                  <div><strong>RUT:</strong> 77.604.764-3</div>
                  <div><strong>Cuenta:</strong> Cuenta Corriente N° 3190709310</div>
                  <div><strong>Monto:</strong> ${finalPrice.toLocaleString('es-CL')} CLP</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#009ee3", fontSize: 13, padding: "13px" }}>
            ⏳ {isFree ? "Activando acceso..." : "Redirigiendo a Mercado Pago..."}
          </div>
        )}

        <div style={{ fontSize: 11, color: "#a09080", textAlign: "center", marginTop: 8 }}>
          🔒 Pago seguro · WebPay / Mercado Pago Chile · No guardamos datos de tarjeta
        </div>
      </div>

      <button onClick={onBack} style={{ background: "none", border: "none", color: "#8a7a68", fontSize: 13, cursor: "pointer" }}>
        ← Reescribir mi consulta
      </button>
    </div>
  );
}

// ─── CHAT SECTION ────────────────────────────────────────────────────────────

