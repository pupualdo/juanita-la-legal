'use client';
import { TOPIC_LABELS, TOPIC_META, DISCLAIMER } from '@/lib/constants';
export default function FinalAnswerCard({ data, topic }) {
  const m = TOPIC_META[topic] || {};
  return (
    <div style={{
      background: "white", border: `2px solid ${m.border || "#d8cfc0"}`,
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    }}>
      <div style={{ background: m.bg, padding: "16px 20px", borderBottom: `1px solid ${m.border}` }}>
        <div style={{ fontSize: 12, color: m.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          {m.emoji} Orientación — {TOPIC_LABELS[topic]}
        </div>
        <div style={{ fontSize: 15, color: "#2a2018", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: data.summary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
        />
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Section title="⚠️ Riesgos si no actúas" items={data.risks} color="#d4845a" bg="#fff4ef" />
        <Section title="✅ Opciones que tienes" items={data.options} color="#4a7a20" bg="#f0f5e8" />
        <Section title="📋 Próximos pasos concretos" items={data.nextSteps} color="#3a6fd4" bg="#eff3ff" />

        <div style={{ background: "#f5efff", borderRadius: 12, padding: "12px 14px", border: "1px solid #cdb8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7a4ad4", marginBottom: 4 }}>
            ⚖️ ¿Necesitas abogado?
          </div>
          <div style={{ fontSize: 13, color: "#3a2860", lineHeight: 1.6 }}>{data.lawyerNeeded}</div>
        </div>

        <div style={{ fontSize: 11, color: "#a09080", lineHeight: 1.6, borderTop: "1px solid #e8e0d0", paddingTop: 12 }}>
          {data.disclaimer}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {data.canGenerateDocument && (
            <div style={{
              background: "#f0f5e8", border: "1px solid #b8d98a", borderRadius: 10,
              padding: "8px 14px", fontSize: 13, color: "#4a7a20",
            }}>
              📄 Podemos ayudarte a redactar un documento básico para este caso
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

