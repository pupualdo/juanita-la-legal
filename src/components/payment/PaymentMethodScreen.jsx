'use client';
import { TOPIC_META } from '@/lib/constants';
export default function PaymentMethodScreen({ topic, finalPrice, isFree, promoCode, onSelect, onBack }) {
  const m = TOPIC_META[topic] || { emoji: '⚖️', color: '#4a5568' };

  return (
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 520, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>{m.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a3a2a", marginBottom: 4 }}>
          Paga con Mercado Pago
        </div>
        <div style={{ fontSize: 13, color: "#6a5e50" }}>
          {isFree ? 'Acceso gratuito' : `$${finalPrice.toLocaleString('es-CL')} CLP`} · Consulta personalizada
        </div>
      </div>

      {/* Mercado Pago card */}
      <button
        onClick={() => onSelect('mercadopago')}
        style={{
          width: "100%", background: "#e8f8ef", border: "2px solid #e8f8ef",
          borderRadius: 14, padding: "20px", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit",
          transition: "border-color 0.15s, box-shadow 0.15s",
          display: "flex", gap: 16, alignItems: "center",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#00a650';
          e.currentTarget.style.boxShadow = '0 4px 16px #00a65020';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#e8f8ef';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          🛒
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a3a2a", display: "flex", gap: 8, alignItems: "center" }}>
            Mercado Pago
            <span style={{ fontSize: 12, fontWeight: 500, color: "#00a650", background: "white", padding: "2px 8px", borderRadius: 8 }}>
              Cuenta MP, efectivo o tarjeta
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#6a5e50", marginTop: 4, lineHeight: 1.5 }}>
            Usa tu saldo de Mercado Pago, paga en efectivo en Servipag/Sencillito, o con tarjeta.
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#00a650", flexShrink: 0 }}>→</div>
      </button>

      {/* Security badge */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11, color: "#8a7a68" }}>
          <span>🔒</span>
          <span>Pago seguro · Mercado Pago Chile · No guardamos datos de tarjeta</span>
        </div>
      </div>

      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#8a7a68", fontSize: 13, cursor: "pointer", alignSelf: "center" }}>
          ← Volver
        </button>
      )}
    </div>
  );
}
