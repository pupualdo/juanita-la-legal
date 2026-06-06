'use client';
import { TOPIC_META } from '@/lib/constants';
export default function TopicBadge({ topic }) {
  if (!topic) return null;
  const m = TOPIC_META[topic];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: m.bg, border: `1px solid ${m.border}`,
      borderRadius: 20, padding: "4px 12px",
      fontSize: 13, fontWeight: 600, color: m.color,
    }}>
      {m.emoji} {TOPIC_LABELS[topic]}
    </div>
  );
}

// ─── FINAL ANSWER CARD ───────────────────────────────────────────────────────

