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

  const BASE_PRICE = isTopicChange ? 4000 : 4995;
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
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 520, margin: "0 auto" }}>

      {/* ── 1. YA ENTENDÍ TU CASO ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1a3a2a", fontFamily: "var(--font-fraunces), serif" }}>
            Ya entendí tu caso
          </span>
        </div>
        <div style={{ background: m.bg || "#faf8f4", border: `1.5px solid ${m.border || "#d8cfc0"}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 14, color: "#4a3a2a", lineHeight: 1.6, marginBottom: 8 }}>
            Según lo que me contaste, tu situación es un caso de <strong style={{ color: m.color || "#1a3a2a" }}>{TOPIC_LABELS[topic]}</strong> y hay cosas importantes que debes saber antes de actuar.
          </div>
          <div style={{ fontSize: 14, color: "#6a5e50", lineHeight: 1.55, fontStyle: "italic" }}>
            «{resumen}»
          </div>
        </div>
      </div>

      {/* ── 2. QUÉ RECIBIRÁS ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3a2a", marginBottom: 10 }}>
          Al continuar recibirás:
        </div>
        {[
          "Si tienes caso y qué tan fuerte es",
          "Qué documentos necesitas juntar",
          "Tus próximos pasos, en orden",
          "Si necesitas abogado, te lo decimos",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ color: "#4a7a20", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 14, color: "#3a3028", lineHeight: 1.4 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* ── 3. PRECIO + CTA ── */}
      <div style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Precio */}
        <div style={{ textAlign: "center" }}>
          {promoApplied && (
            <div style={{ fontSize: 13, color: "#a09080", textDecoration: "line-through", marginBottom: 2 }}>
              ${BASE_PRICE.toLocaleString('es-CL')}
            </div>
          )}
          <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 28, fontWeight: 700, color: isFree ? "#4a7a20" : "#1a3a2a" }}>
            {isFree ? "¡Gratis!" : `$${finalPrice.toLocaleString('es-CL')}`}
          </div>
          <div style={{ fontSize: 13, color: "#6a5e50" }}>
            Sesión completa · pago único
          </div>
          {promoApplied && (
            <div style={{ fontSize: 12, color: "#4a7a20", fontWeight: 600, marginTop: 4 }}>
              {promoApplied.label} aplicado ✓
            </div>
          )}
        </div>

        {/* CTA principal */}
        {!loading ? (
          <button onClick={handlePay} style={{
            width: "100%", background: "linear-gradient(135deg, #1a3a2a 0%, #2a5a3a 100%)",
            color: "white", border: "none", borderRadius: 14, padding: "16px",
            fontSize: 17, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 16px rgba(26,58,42,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {isFree ? "🎉 Acceder gratis" : "Recibir mi orientación completa"}
          </button>
        ) : (
          <div style={{ textAlign: "center", color: "#4a7a20", fontSize: 14, padding: "13px", fontWeight: 600 }}>
            ⏳ {isFree ? "Activando acceso..." : "Redirigiendo al pago..."}
          </div>
        )}

        {/* Promo code */}
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
              color: "#3a3028", fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleApplyPromo}
            disabled={promoLoading || !!promoApplied || !promoCode.trim()}
            style={{
              padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "none",
              borderRadius: 10, cursor: promoApplied || !promoCode.trim() ? "default" : "pointer",
              background: promoApplied ? "#4a7a20" : "#1a3a2a", color: "white",
              opacity: promoLoading ? 0.7 : 1, fontFamily: "inherit",
            }}
          >
            {promoApplied ? "✓" : promoLoading ? "..." : "Aplicar"}
          </button>
        </div>
        {promoError && (
          <div style={{ fontSize: 12, color: "#c0392b", marginTop: -8 }}>{promoError}</div>
        )}

        {/* Métodos de pago */}
        <div style={{ fontSize: 12, color: "#8a7a68", textAlign: "center", lineHeight: 1.6 }}>
          💳 WebPay · Mercado Pago · Transferencia
        </div>
      </div>

      {/* ── 4. GARANTÍA + RESPALDO LEGAL ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🛡️</span>
          <span style={{ fontSize: 13, color: "#5a4e40", lineHeight: 1.5 }}>
            Si no te sirve, te devolvemos el 100%. Sin preguntas.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚖️</span>
          <span style={{ fontSize: 13, color: "#5a4e40", lineHeight: 1.5 }}>
            Basado en legislación chilena vigente.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <span style={{ fontSize: 13, color: "#5a4e40", lineHeight: 1.5 }}>
            Pago seguro · No guardamos datos de tarjeta.
          </span>
        </div>
      </div>

      {/* ── 5. BANCO (Transferencia) ── */}
      {!isFree && (
        <div style={{
          background: "#faf8f4", borderRadius: 14, padding: "16px",
          border: "1px solid #ece4d4",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a3a2a", marginBottom: 8 }}>
            🏦 Transferencia bancaria
          </div>
          <div style={{ fontSize: 12, color: "#6a5e50", lineHeight: 1.6, marginBottom: 10 }}>
            Transfiere a la cuenta y escríbenos a <strong>contacto@juanitalalegal.cl</strong> con tu comprobante.
          </div>
          <div style={{
            background: "white", borderRadius: 10, padding: "12px 14px",
            border: "1px dashed #d8cfc0", fontSize: 12, color: "#3a3028", lineHeight: 2,
          }}>
            <div><strong>Banco:</strong> Banco de Chile</div>
            <div><strong>Titular:</strong> Asesorías del Meridiano Limitada</div>
            <div><strong>RUT:</strong> 77.604.764-3</div>
            <div><strong>Cuenta:</strong> Cuenta Corriente N° 3190709310</div>
            <div><strong>Monto:</strong> ${finalPrice.toLocaleString('es-CL')} CLP</div>
          </div>
        </div>
      )}

      {/* ── 6. VOLVER ── */}
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#8a7a68", fontSize: 13, cursor: "pointer", alignSelf: "center", fontFamily: "inherit" }}>
        ← Volver
      </button>
    </div>
  );
}
