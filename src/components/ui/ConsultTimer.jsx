'use client';
import { TOPIC_LABELS } from '@/lib/constants';
import { useState, useEffect, useRef, useMemo } from 'react';
export default function ConsultTimer({ active, totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setRemaining(r => {
        const next = Math.max(0, r - 1);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpire?.(), 0);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [active, onExpire]);

  if (!active) return null;

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const pct = (remaining / totalSeconds) * 100;
  const isRed = remaining < 120;
  const isYellow = !isRed && remaining < 300;
  const color = isRed ? "#d4845a" : isYellow ? "#c8a040" : "#4a7a20";
  const bg = isRed ? "#fff4ef" : isYellow ? "#fffbef" : "#f0f5e8";
  const border = isRed ? "#f5c9ae" : isYellow ? "#f0de8a" : "#b8d98a";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 20, padding: "5px 12px",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: `conic-gradient(${color} ${pct}%, #e8e0d0 0)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: bg }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "monospace" }}>
        {mins}:{secs}
      </span>
    </div>
  );
}

// ─── TOPIC BADGE ─────────────────────────────────────────────────────────────

