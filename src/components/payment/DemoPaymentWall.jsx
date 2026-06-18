'use client';
import { useState } from 'react';
import { TOPIC_LABELS, TOPIC_META } from '@/lib/constants';
export default function DemoPaymentWall({ topic, resumen, sessionId, onBack }) {
  const m = TOPIC_META[topic] || { border: '#d8cfc0', bg: '#faf8f4', color: '#4a5568', emoji: '⚖️' };
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const BASE_PRICE = 9990;
  const DISCOUNT_PRICE = 4995;
  const appliedDiscount = promoApplied?.discount ?? 0;
  const finalPrice = promoApplied
    ? Math.round(DISCOUNT_PRICE * (1 - appliedDiscount / 100))
    : DISCOUNT_PRICE;
  const isFree = finalPrice === 0 || appliedDiscount >= 100;

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

  const handlePay = async () => {
    if (isFree) {
      handleMethodSelect('free');
      return;
    }
    handleMethodSelect('mercadopago');
  };

  const handleMethodSelect = async (method) => {
    setLoading(true);
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
        localStorage.removeItem('juanita_terms_accepted');
        window.location.href = '/?paid=true';
        return;
      }

      // Mercado Pago directo
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: topic, resumen, sessionId, promoCode: promoCode.trim().toUpperCase(), method }),
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

  return (
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 520, margin: "0 auto" }}>
      {/* Demo completado banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a2a 0%, #2a5a3a 100%)",
        borderRadius: 16, padding: "20px 22px", color: "white",
        boxShadow: "0 4px 20px rgba(26,58,42,0.2)",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
          ¡Buen caso! Esto es {TOPIC_LABELS[topic].toLowerCase()}
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
          Puedo orientarte paso a paso: qué dice la ley, qué te conviene hacer y qué no, y cómo ordenar tu caso para que no pierdas tiempo ni plata.
        </div>
      </div>

      {/* Qué incluiría la consulta */}
      <div style={{
        background: "white", borderRadius: 14, padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #ece4d4",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3a2a", marginBottom: 12 }}>
          En esta consulta obtienes:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Orientación clara y en buen chileno sobre tu caso concreto",
            "Qué dice la ley chilena y cómo se aplica a tu situación",
            "Riesgos si no actúas, opciones que tienes y próximos pasos",
            "Si necesitas abogado, te decimos claramente y te orientamos a dónde ir",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#4a7a20", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 13, color: "#3a3028", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topic badge */}
      <div style={{ background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 16, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ fontSize: 36 }}>{m.emoji}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Tema detectado
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#2a2018", marginBottom: 3 }}>
            {TOPIC_LABELS[topic]}
          </div>
          <div style={{ fontSize: 13, color: "#6a5e50" }}>{resumen}</div>
        </div>
      </div>

      {/* Promo code */}
      <div style={{ marginBottom: 4 }}>
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

      {/* Price */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #ece4d4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#6a5e50" }}>Precio normal</span>
          <span style={{ fontSize: 15, color: "#a09080", textDecoration: "line-through" }}>
            ${BASE_PRICE.toLocaleString('es-CL')}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6a5e50" }}>
            <strong style={{ color: "#1a3a2a" }}>Lanzamiento 50% off</strong>
          </span>
          <span style={{ fontFamily: "serif", fontSize: 26, fontWeight: 700, color: "#1a3a2a" }}>
            {isFree ? "¡Gratis!" : `$${finalPrice.toLocaleString('es-CL')}`}
          </span>
        </div>
        {promoApplied && (
          <div style={{ fontSize: 11, color: "#4a7a20", fontWeight: 600, marginTop: 4 }}>
            {promoApplied.label} aplicado ✓
          </div>
        )}
      </div>

      {/* Pay button */}
      {!loading ? (
        <button onClick={handlePay} style={{
          width: "100%", background: isFree ? "#4a7a20" : "#009ee3", color: "white", border: "none",
          borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 16px rgba(0,158,227,0.25)",
        }}>
          {isFree ? "🎉 Acceder gratis" : "Pagar con Mercado Pago"}
        </button>
      ) : (
        <div style={{ textAlign: "center", color: "#009ee3", fontSize: 13, padding: "13px" }}>
          ⏳ {isFree ? "Activando acceso..." : "Redirigiendo a Mercado Pago..."}
        </div>
      )}

      <div style={{ fontSize: 11, color: "#a09080", textAlign: "center" }}>
        🔒 Pago seguro · Mercado Pago Chile · No guardamos datos de tarjeta
      </div>

      <button onClick={onBack} style={{ background: "none", border: "none", color: "#8a7a68", fontSize: 13, cursor: "pointer" }}>
        ← Probar con otra consulta
      </button>
    </div>
  );
}
