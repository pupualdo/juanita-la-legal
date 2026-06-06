'use client';
import { TOPIC_META, TOPIC_LABELS } from '@/lib/constants';
export default function Section({ title, items, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <span style={{ color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>·</span>
          <span style={{ fontSize: 13, color: "#2a2018", lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}