'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
export default function MessageActions({ text }) {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const APP_URL = 'https://juanitalalegal.cl';
  const footer = `\n\n— — —\n💬 Esta orientación te la comparte *Juanita La Legal* 👩‍⚖️\n¿Tienes tu propia duda legal? Consulta tu caso en ${APP_URL}`;
  const shareText = text + footer;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard no disponible */ }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch { /* cancelado */ }
    }
    setShowShare(s => !s);
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent('Orientación legal de Juanita La Legal')}&body=${encodeURIComponent(shareText)}`;

  const btn = {
    background: 'none', border: '1px solid #d8cfc0', cursor: 'pointer',
    padding: '5px 12px', borderRadius: 9, fontSize: 12.5, color: '#6a5e50', fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
    transition: 'border-color 0.15s, color 0.15s',
  };

  const ICON = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  const CopyIcon = () => (
    <svg {...ICON}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
  );
  const CheckIcon = () => (
    <svg {...ICON}><polyline points="20 6 9 17 4 12" /></svg>
  );
  const ShareIcon = () => (
    <svg {...ICON}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
  );

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleCopy} aria-label="Copiar" style={{ ...btn, color: copied ? '#2a7a2a' : '#6a5e50', borderColor: copied ? '#a8d5a0' : '#d8cfc0' }}>
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button onClick={handleShare} aria-label="Compartir" style={btn}>
          <ShareIcon /> Compartir
        </button>
      </div>
      {showShare && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', animation: 'fadeUp 0.15s ease' }}>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ ...btn, textDecoration: 'none', color: '#1a7a3a', borderColor: '#a8d5a0' }}>💬 WhatsApp</a>
          <a href={mailUrl} style={{ ...btn, textDecoration: 'none', color: '#3a6fd4', borderColor: '#b8ccf5' }}>✉️ Correo</a>
        </div>
      )}
    </div>
  );
}
