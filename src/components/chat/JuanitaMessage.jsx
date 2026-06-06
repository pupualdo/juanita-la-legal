'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';
import { LEGAL_TERMS } from '@/lib/constants';
import TypingDots from '@/components/ui/TypingDots';
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false, loading: () => null });
export default function JuanitaMessage({ text, onTermClick, activeTerm }) {
  if (text === '...') return <TypingDots />;

  const LegalStrong = ({ children }) => {
    const term = String(children);
    const key = term.toLowerCase().replace(/[().,]/g, '').trim();
    const explanation = LEGAL_TERMS[key];
    const isActive = activeTerm?.key === key;
    return (
      <>
        <strong>{term}</strong>
        {explanation && onTermClick && (
          <button
            onClick={e => {
              e.stopPropagation();
              onTermClick(isActive ? null : { key, label: term, explanation });
            }}
            title={`¿Qué es ${term}?`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: '50%',
              background: isActive ? '#3a6fd4' : '#e8e4dc',
              color: isActive ? 'white' : '#6a5e50',
              border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, lineHeight: 1,
              marginLeft: 3, verticalAlign: 'middle',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
          >?</button>
        )}
      </>
    );
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{children}</p>,
        h2: ({ children }) => <h2 style={{ color: '#1a3a2a', fontSize: 19, fontWeight: 700, margin: '14px 0 8px', lineHeight: 1.3 }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: '#1a3a2a', fontSize: 17, fontWeight: 600, margin: '12px 0 6px', lineHeight: 1.3 }}>{children}</h3>,
        ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0 10px' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0 10px' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.6 }}>{children}</li>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e0d8c8', margin: '12px 0' }} />,
        strong: LegalStrong,
        table: ({ children }) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 16 }}>{children}</table></div>,
        th: ({ children }) => <th style={{ background: '#1a3a2a', color: '#fff', padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{children}</th>,
        td: ({ children }) => <td style={{ borderBottom: '1px solid #e0d8c8', padding: '8px 12px' }}>{children}</td>,
        tr: ({ children }) => <tr style={{ borderBottom: '1px solid #e0d8c8' }}>{children}</tr>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ─── CONTACT FORM ────────────────────────────────────────────────────────────

