'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
export default function LaunchDiscountModal({ onApply, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(420px, 92vw)", background: "#fffdf8", borderRadius: 22, zIndex: 401,
        padding: "26px 24px 22px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        border: "1.5px solid #f0de8a", animation: "fadeUp 0.25s ease", textAlign: "center",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 14, background: "none", border: "none",
          fontSize: 22, color: "#b0a690", cursor: "pointer", lineHeight: 1,
        }}>×</button>

        <div style={{ fontSize: 40, marginBottom: 6 }}>🎉</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>
          Oferta de lanzamiento
        </div>
        <div style={{ fontSize: 23, fontWeight: 800, color: "#1a3a2a", fontFamily: "serif", lineHeight: 1.2, marginBottom: 8 }}>
          50% de descuento<br />en tu consulta completa
        </div>
        <div style={{ fontSize: 14, color: "#6a5e50", lineHeight: 1.5, marginBottom: 16 }}>
          Resuelve tu caso ahora por <strong style={{ color: "#1a3a2a" }}>$4.995</strong> en vez de $9.990. Solo por lanzamiento.
        </div>

        <div style={{
          background: "#1a3a2a", color: "#f5f0e8", borderRadius: 12, padding: "10px 14px",
          fontSize: 13, marginBottom: 16, letterSpacing: 1,
        }}>
          Código: <strong style={{ fontSize: 16, letterSpacing: 2 }}>LANZAMIENTO</strong>
        </div>

        <button onClick={onApply} style={{
          width: "100%", background: "#009ee3", color: "white", border: "none",
          borderRadius: 13, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,158,227,0.35)",
        }}>
          Aplicar 50% y pagar ahora
        </button>
        <button onClick={onClose} style={{
          width: "100%", background: "none", border: "none", color: "#a09080",
          fontSize: 13, cursor: "pointer", marginTop: 10,
        }}>
          No, gracias
        </button>
      </div>
    </>
  );
}

// ─── PAYMENT WALL ────────────────────────────────────────────────────────────

