'use client';
import { TOPIC_META, CONTACT_FORM_TRIGGERS } from '@/lib/constants';
import JuanitaMessage from './JuanitaMessage';
import ContactForm from './ContactForm';
import BuySessionButton from './BuySessionButton';
import WhatsAppCTA from './WhatsAppCTA';
import MessageFeedback from './MessageFeedback';
import MessageActions from './MessageActions';
import FinalAnswerCard from '@/components/ui/FinalAnswerCard';
export default function MessageBubble({ msg, topic, sessionId, onTermClick, activeTerm }) {
  if (msg.type === "final") return <FinalAnswerCard data={msg.finalAnswer} topic={topic} />;

  if (msg.type === "system") {
    return (
      <div style={{ textAlign: "center" }}>
        <span style={{
          display: "inline-block", background: "#f0ebe0", border: "1px solid #d8cfc0",
          borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#6a5e50",
        }}>{msg.text}</span>
      </div>
    );
  }

  const isJuanita = msg.type === "juanita";
  const hasSessionOffer = isJuanita && msg.text.includes('sesión adicional');
  const lower = msg.text.toLowerCase();
  const showContactForm = isJuanita &&
    !hasSessionOffer &&
    msg.text !== '...' &&
    CONTACT_FORM_TRIGGERS.some(t => lower.includes(t));

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isJuanita ? "row" : "row-reverse" }}>
      {isJuanita && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#c8e6c0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginTop: 2,
        }}>⚖️</div>
      )}
      <div style={{ maxWidth: "94%", display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{
          padding: "13px 16px",
          background: isJuanita ? "white" : "#1a3a2a",
          color: isJuanita ? "#2a2018" : "#e8f5e2",
          borderRadius: isJuanita ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          fontSize: 17, lineHeight: 1.6,
          boxShadow: isJuanita ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
        }}>
          {isJuanita
            ? <JuanitaMessage text={msg.text} onTermClick={onTermClick} activeTerm={activeTerm} />
            : msg.text}
        </div>
        {showContactForm && <ContactForm topic={topic} sessionId={sessionId} />}
        {hasSessionOffer && <BuySessionButton sessionId={sessionId} />}
        {isJuanita && msg.text !== '...' && <WhatsAppCTA text={msg.text} />}
        {isJuanita && msg.text !== '...' && <MessageActions text={msg.text} />}
        {isJuanita && msg.text !== '...' && sessionId && (
          <MessageFeedback
            msgId={msg.id}
            sessionId={sessionId}
            msgPreview={msg.text.slice(0, 200)}
          />
        )}
      </div>
    </div>
  );
}
