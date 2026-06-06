'use client';
import { useState, useEffect } from 'react';
import { TYC_SECTIONS } from '@/lib/constants';
export default function TermsScreen({ onAccept }) {
  const [accepted, setAccepted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf8f4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 640,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile ? '90vh' : 'none',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f0ebe3' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚖️</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#2d2217', lineHeight: 1.2 }}>
            Términos y Condiciones de Uso
          </div>
          <div style={{ fontSize: 13, color: '#9a8a78', marginTop: 4 }}>
            Juanita La Legal · Versión 1.0 · Abril 2026
          </div>
        </div>

        {/* Scrollable content — siempre accesible, sin bloqueo */}
        <div
          style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}
        >
          <div style={{
            background: '#f0f5e8', border: '1px solid #b8d98a', borderRadius: 10,
            padding: '12px 14px', marginBottom: 18, fontSize: 13, color: '#3a5a20', lineHeight: 1.5,
          }}>
            <strong>⚡ Tómate tu tiempo para leer.</strong> Son las reglas del juego para que todo sea claro y transparente. Cuando termines, marca el checkbox al final para continuar.
          </div>
          {TYC_SECTIONS.map((section, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: section.warning ? '#c44a12' : '#5a3e2b',
                marginBottom: 6,
                background: section.warning ? '#fff2ee' : 'transparent',
                borderLeft: section.warning ? '3px solid #c44a12' : '3px solid #d8cfc0',
                paddingLeft: 10,
                paddingTop: section.warning ? 6 : 0,
                paddingBottom: section.warning ? 6 : 0,
                borderRadius: section.warning ? '0 4px 4px 0' : 0,
              }}>
                {section.heading}
              </div>
              {section.items ? (
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, color: '#5a4a3a', lineHeight: 1.6, marginBottom: 4 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: '#5a4a3a', lineHeight: 1.7, margin: 0 }}>
                  {section.body}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer with checkbox accept */}
        <div style={{
          padding: '16px 28px 20px',
          borderTop: '1px solid #f0ebe3',
          background: '#faf8f4',
        }}>
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
            marginBottom: 12,
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              style={{
                width: 20, height: 20, marginTop: 1, cursor: 'pointer',
                accentColor: '#1a3a2a', flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: '#3a3028', lineHeight: 1.5 }}>
              He leído y acepto los <strong>Términos y Condiciones</strong> de Juanita La Legal, incluyendo que este servicio es orientación informativa basada en IA y no constituye asesoría jurídica formal ni crea relación abogado-cliente.
            </span>
          </label>
          <button
            onClick={() => {
              if (!accepted) return;
              localStorage.setItem('juanita_terms_accepted', '1');
              onAccept();
            }}
            disabled={!accepted}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 10,
              border: 'none',
              background: accepted ? '#1a3a2a' : '#d8cfc0',
              color: accepted ? '#fff' : '#9a8a78',
              fontSize: 14,
              fontWeight: 600,
              cursor: accepted ? 'pointer' : 'not-allowed',
              transition: 'background 0.3s, color 0.3s',
              fontFamily: 'inherit',
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAID DETECTOR (requiere Suspense por useSearchParams) ───────────────────

