'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';
import { track } from '@vercel/analytics';
import { TOPIC_LABELS, TOPIC_META, TOPIC_DETAILS, DISCLAIMER, SUGGESTIONS, QUESTION_SETS, CONTACT_FORM_TRIGGERS, WHATSAPP_TRIGGERS, createId, normalizeText, buildFinalAnswer, TYC_SECTIONS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import ConsultTimer from '@/components/ui/ConsultTimer';
import TopicBadge from '@/components/ui/TopicBadge';
import TypingDots from '@/components/ui/TypingDots';
import FinalAnswerCard from '@/components/ui/FinalAnswerCard';
import Section from '@/components/ui/Section';
import MessageBubble from './MessageBubble';
import RatingModal from './RatingModal';
import PreChatWall from './PreChatWall';
import PaymentWall from '@/components/payment/PaymentWall';
import DemoPaymentWall from '@/components/payment/DemoPaymentWall';
import PaymentMethodScreen from '@/components/payment/PaymentMethodScreen';
import LaunchDiscountModal from '@/components/payment/LaunchDiscountModal';
import TermsScreen from '@/components/landing/TermsScreen';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false, loading: () => null });

export default function ChatSection({ onRestart, initialPaid, initialSessionId }) {
  const [stage, setStage] = useState(initialPaid ? "resuming" : "input");
  const [messages, setMessages] = useState([{
    id: createId(), type: "juanita",
    text: "Hola, soy Juanita 👋 Cuéntame en buen chileno cuál es tu problema principal y te ayudo a ordenarlo.\n\n📌 **Cómo funciona:** cada sesión pagada es **por un solo tema legal**. Puedes preguntar todo lo que quieras sobre ese tema y recibir orientación clara. Si después necesitas orientación en otro tema, es una nueva sesión.\n\n*Esta orientación es de carácter general e informativo. No reemplaza a un abogado/a ni crea relación abogado-cliente.*",
  }]);
  const [input, setInput] = useState("");
  const [lockedTopic, setLockedTopic] = useState(null);
  const [pendingTopic, setPendingTopic] = useState(null);
  const [classifyResumen, setClassifyResumen] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState({});
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [devHistory, setDevHistory] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null); // { key, label, explanation } | null
  const [showTermHint, setShowTermHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [voiceState, setVoiceState] = useState('idle'); // idle | recording | transcribing | reviewing
  const [editableTranscript, setEditableTranscript] = useState('');
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [autoPromo, setAutoPromo] = useState(null);
  const [prechatExchanges, setPrechatExchanges] = useState(0);
  const [demoUsed, setDemoUsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    const ts = sessionStorage.getItem('juanita_demo_ts');
    if (!ts) return false;
    // Demo válido durante la sesión del navegador (sessionStorage se borra al cerrar)
    return true;
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('juanita_hintSeen')) setShowTermHint(true);
  }, []);

  // Al entrar al muro de pago, ofrece una sola vez el popup de 50% (LANZAMIENTO).
  useEffect(() => {
    if (stage === 'payment' && !sessionStorage.getItem('juanita_promo_seen')) {
      setShowDiscountModal(true);
      try { sessionStorage.setItem('juanita_promo_seen', '1'); } catch {}
    }
  }, [stage]);

  useEffect(() => {
    if (!userScrolledUp) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, stage, userScrolledUp]);

  useEffect(() => {
    document.querySelectorAll('[data-action="suggest"]').forEach(b => {
      b.onclick = () => handleInitialSubmit(b.dataset.text);
    });
  }, [stage, messages.length]);

  // El modal de evaluación solo se muestra al agotarse el timer (handleTimerExpire)

  // Post-pago: iniciar chat directamente
  useEffect(() => {
    if (!initialPaid || !initialSessionId) return;

    const savedQuery = sessionStorage.getItem('juanita_query');
    const savedTema = localStorage.getItem('juanita_topic');

    setSessionId(initialSessionId);
    if (savedTema) setLockedTopic(savedTema);
    setTimerActive(true);

    const topicLabel = savedTema ? (TOPIC_LABELS[savedTema] || savedTema) : null;
    const topicEmoji = savedTema ? (TOPIC_META[savedTema]?.emoji || '⚖️') : '⚖️';
    const welcomeText = topicLabel
      ? `¡Hola! Soy Juanita y ya está todo listo para tu sesión 🎉\n\n**Tema de esta sesión:** ${topicEmoji} ${topicLabel}\n\nPuedes preguntarme todo lo que quieras sobre **${topicLabel}**. Cuéntame con confianza — te oriento paso a paso.\n\n> ℹ️ Si después necesitas orientación sobre otro tema legal, será una nueva sesión (${'\$'}4.995 CLP).\n\n*Esta orientación es de carácter general e informativo. No reemplaza a un abogado/a ni crea relación abogado-cliente.*`
      : `¡Pago confirmado! 🎉 Cuéntame tu problema legal y te oriento paso a paso.\n\n*Esta orientación es de carácter general e informativo. No reemplaza a un abogado/a ni crea relación abogado-cliente.*`;

    if (savedQuery) {
      sessionStorage.removeItem('juanita_query');
      setStage("chat");
      setMessages([
        { id: createId(), type: "juanita", text: welcomeText },
        { id: createId(), type: "user", text: savedQuery },
      ]);
      streamChatResponse(savedQuery, [], initialSessionId);
    } else {
      setStage("chat");
      setMessages([{ id: createId(), type: "juanita", text: welcomeText }]);
    }
  }, [initialPaid, initialSessionId]);

  const addMsg = (msg) => setMessages(prev => [...prev, { id: createId(), ...msg }]);

  // ── Pre-chat: enviar mensaje durante chat pre-pago ─────────────────────────
  const handlePrechatSend = async (text) => {
    const trimmed = text || input.trim();
    if (!trimmed || isStreaming) return;
    const newCount = prechatExchanges + 1;
    setPrechatExchanges(newCount);
    setInput("");
    addMsg({ type: "user", text: trimmed });
    if (newCount >= 3) {
      // Límite alcanzado — último mensaje de Juanita y mostrar pago
      trackEvent('PreChatMessage3', { tema: lockedTopic });
      setStage("payment");
      addMsg({ type: "juanita", text: `Gracias por compartir tu caso conmigo 🙏\n\nCon lo que me has contado, ya tengo un muy buen panorama. Puedo orientarte paso a paso sobre tus derechos, lo que te conviene hacer y cómo prepararte.\n\n**Son $4.995 CLP por la consulta completa.** ¿Continuamos?` });
    } else {
      // Continuar el pre-chat
      streamChatResponse(
        `[PRE-CHAT — intercambio ${newCount}/3] El usuario responde: "${trimmed}". Responde con empatía. Haz preguntas para clarificar lo que no haya quedado claro. NO des orientación legal completa. Sugiere sutilmente que la consulta pagada ($4.995) le dará la orientación detallada paso a paso.`,
        [],
        sessionId,
        undefined,
        true
      );
    }
  };

  // ── Clasificar con backend real ────────────────────────────────────────────
  const handleInitialSubmit = async (text) => {
    const trimmed = text || input.trim();
    if (!trimmed) return;
    setInput("");
    addMsg({ type: "user", text: trimmed });
    setStage("classifying");

    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();

      if (data.tema) {
        setPendingTopic(data.tema);
        setClassifyResumen(data.resumen || `Consulta sobre ${TOPIC_LABELS[data.tema]}`);
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        localStorage.setItem('juanita_session', newSessionId);
        localStorage.setItem('juanita_topic', data.tema);
        sessionStorage.setItem('juanita_query', trimmed);
        track('classify_completed', { tema: data.tema });

        if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT === 'true') {
          // Dev bypass: crear sesión directamente sin pago
          await fetch('/api/dev-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: newSessionId }),
          });
          setLockedTopic(data.tema);
          setStage("chat");
          setTimerActive(true);
          addMsg({ type: "system", text: `[DEV] Sesión creada sin pago. Tema: ${TOPIC_LABELS[data.tema]}` });
          const initialHistory = [{ role: 'user', content: trimmed }];
          const fullText = await streamChatResponse(trimmed, [], newSessionId);
          if (fullText) {
            setDevHistory([...initialHistory, { role: 'assistant', content: fullText }]);
          }
        } else if (!demoUsed && !initialPaid) {
          // ── PRE-CHAT: chat real limitado a 3 intercambios ──
          sessionStorage.setItem('juanita_demo_ts', String(Date.now()));
          setDemoUsed(true);
          setLockedTopic(data.tema);
          setPendingTopic(data.tema);
          setClassifyResumen(data.resumen || `Consulta sobre ${TOPIC_LABELS[data.tema]}`);
          setPrechatExchanges(0);
          setStage("prechat");
          // Llamar a /api/chat para la primera respuesta de Juanita
          addMsg({ type: "system", text: `Tema: ${TOPIC_LABELS[data.tema]} ${TOPIC_META[data.tema]?.emoji}. Conversación de orientación gratuita (máx. 3 intercambios).` });
          streamChatResponse(
            `[PRE-CHAT] El usuario consulta: "${trimmed}". Tu objetivo es DARLE VALOR inmediato para que quiera pagar. Responde de forma concreta y útil — demuestra que sabes del tema legal, da UN dato práctico específico (un paso concreto que pueda hacer hoy, un artículo de ley aplicable, o un trámite preciso que le sirva). NO des la orientación completa ni el paso a paso detallado — eso es lo que obtiene con la consulta pagada. Luego haz 1 pregunta específica para profundizar su caso. Al final de tu respuesta, sugiere naturalmente que en la consulta completa ($4.995) le das el detalle completo, los pasos exactos y los riesgos.`,
            [],
            sessionId,
            undefined,
            true
          );
        } else {
          setStage("payment");
        }
      } else {
        addMsg({ type: "juanita", text: "No pude clasificar tu consulta. ¿Puedes describirla de otra forma?" });
        setStage("input");
      }
    } catch {
      addMsg({ type: "juanita", text: "Hubo un error al analizar tu consulta. Intenta de nuevo." });
      setStage("input");
    }
  };

  // ── Post pago: confirmar tema ──────────────────────────────────────────────
  const handleAfterPayment = () => {
    setLockedTopic(pendingTopic);
    setStage("chat");
    setTimerActive(true);
    addMsg({ type: "system", text: `Tema confirmado: ${TOPIC_LABELS[pendingTopic]} ${TOPIC_META[pendingTopic]?.emoji}.` });
  };

  // ── Streaming helper ──────────────────────────────────────────────────────
  const streamChatResponse = async (message, historyForApi, currentSessionId, imageBase64, isPrechat = false) => {
    setIsStreaming(true);
    const msgId = createId();
    setMessages(prev => [...prev, { id: msgId, type: 'juanita', text: '...' }]);
    let fullText = '';

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 2500;

    const isNetworkError = (err) =>
      !err.message || /failed to fetch|network error|load failed|networkerror/i.test(err.message);

    const attemptStream = async () => {
      const body = { sessionId: currentSessionId, message, prechat: isPrechat };
      if (imageBase64) body.imageBase64 = imageBase64;
      if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT === 'true') {
        body.history = historyForApi;
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: fullText } : m));
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected token') throw parseErr;
          }
        }
      }
    };

    let lastErr = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await attemptStream();
        lastErr = null;
        break; // success
      } catch (err) {
        lastErr = err;
        // Only retry on network/connectivity errors, not on API errors (4xx/5xx)
        if (!isNetworkError(err) || attempt === MAX_RETRIES) break;
        // Show reconnecting indicator and wait before next attempt
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, text: `Reconectando… (intento ${attempt + 2}/${MAX_RETRIES + 1})` } : m
        ));
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        fullText = ''; // reset so we don't double-append on retry
      }
    }

    if (lastErr) {
      // Network errors have different messages across browsers/platforms:
      // Chrome desktop: "Failed to fetch", Chrome Android: "network error",
      // Safari: "Load failed", Firefox: "NetworkError when attempting to fetch resource."
      const errMsg = isNetworkError(lastErr)
        ? 'Se cortó la conexión después de varios intentos. Revisa tu red e intenta de nuevo 🔄'
        : `Hubo un problema al responder. Intenta de nuevo. (${lastErr.message})`;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: errMsg } : m));
    }

    setIsStreaming(false);
    return fullText;
  };

  // ── Respuestas guiadas ─────────────────────────────────────────────────────
  const handleGuidedAnswer = async (text, imageBase64) => {
    addMsg({ type: "user", text });

    const newDevHistory = [...devHistory, { role: 'user', content: text }];
    const fullText = await streamChatResponse(text, newDevHistory, sessionId, imageBase64);
    if (fullText) {
      setDevHistory([...newDevHistory, { role: 'assistant', content: fullText }]);
    }
  };

  // ── Grabación de voz ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setVoiceState('transcribing');
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          alert('No se grabó audio. Intenta de nuevo y habla más cerca del micrófono.');
          setVoiceState('idle');
          return;
        }
        const fd = new FormData();
        fd.append('audio', blob, mimeType === 'audio/webm' ? 'recording.webm' : 'recording.mp4');
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const err = String(data.error || '').toLowerCase();
            const isQuota = err.includes('quota') || err.includes('billing') || err.includes('insufficient');
            const friendly = isQuota
              ? 'El servicio de voz no está disponible ahora. Por favor, escribe tu mensaje.'
              : 'No pudimos transcribir tu audio. Intenta de nuevo o escríbelo por texto.';
            alert(friendly);
            setVoiceState('idle');
            return;
          }
          if (data.text && data.text.trim()) {
            setEditableTranscript(data.text);
            setVoiceState('reviewing');
          } else {
            alert('La transcripción salió vacía. Intenta hablar más fuerte o más cerca del micrófono.');
            setVoiceState('idle');
          }
        } catch {
          alert('No se pudo conectar al servicio de transcripción. Revisa tu conexión e intenta de nuevo.');
          setVoiceState('idle');
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setVoiceState('recording');
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const handleMicClick = () => {
    if (voiceState === 'idle') startRecording();
    else if (voiceState === 'recording') mediaRecorderRef.current?.stop();
  };

  const handleConfirmTranscript = () => {
    const text = editableTranscript.trim();
    if (!text) return;
    setVoiceState('idle');
    setEditableTranscript('');
    if (stage === 'input') { handleInitialSubmit(text); return; }
    if (stage === 'chat') { handleGuidedAnswer(text); return; }
  };

  const resetVoice = () => {
    setVoiceState('idle');
    setEditableTranscript('');
  };

  const handleTimerExpire = () => {
    setTimerExpired(true);
    setTimerActive(false);
    addMsg({ type: "juanita", text: "⏰ ¡Se acabó el tiempo de esta sesión! Espero que la orientación te haya sido útil. Si necesitas seguir con tu caso, puedes renovar la consulta." });
    if (!ratingDone) {
      setTimeout(() => setShowRating(true), 1500);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachedFile) return;
    const fileNote = attachedFile ? `\n[Adjunto: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(0)} KB)]` : '';
    const fullText = (trimmed || '') + fileNote;
    const file = attachedFile;
    setInput("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    let imageBase64 = null;
    if (file && file.type.startsWith('image/')) {
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
    }

    if (stage === "input") { handleInitialSubmit(fullText); return; }
    if (stage === "chat") { handleGuidedAnswer(fullText, imageBase64); return; }
  };

  const inputPlaceholder = stage === "input" ? "Escribe tu problema principal..."
    : stage === "chat" ? "Escribe tu respuesta..."
    : "Consulta cerrada";

  const inputDisabled = timerExpired || isStreaming || stage === "closed" || stage === "classifying" || stage === "payment" || stage === "demo-ended" || stage === "topic-confirm" || stage === "resuming";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "row", background: "#faf8f4" }}>
      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "#1a3a2a", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#c8e6c0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f0e8", fontFamily: "serif" }}>Juanita La Legal</div>
            <div style={{ fontSize: 11, color: "#8fbc8f" }}>Orientación legal en buen chileno · $4.995</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <TopicBadge topic={lockedTopic} />
          <ConsultTimer active={timerActive} totalSeconds={10 * 60} onExpire={handleTimerExpire} />
          <button onClick={onRestart} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#c8e6c0", borderRadius: 10, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
            ← Inicio
          </button>
        </div>
      </div>

      {/* Payment wall */}
      {stage === "payment" && pendingTopic && (
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <PaymentWall
            topic={pendingTopic}
            resumen={classifyResumen}
            sessionId={sessionId}
            prevSessionId={typeof window !== 'undefined' ? localStorage.getItem('juanita_session') : null}
            prevTopic={typeof window !== 'undefined' ? localStorage.getItem('juanita_topic') : null}
            autoPromo={autoPromo}
            onBack={() => { setStage("input"); setMessages(prev => prev.slice(0, -1)); }}
          />
        </div>
      )}

      {/* Pre-chat — chat real limitado antes del pago */}
      {(stage === "prechat" || stage === "demo-ended") && pendingTopic && (
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {stage === "prechat" ? (
            <PreChatWall
              topic={pendingTopic}
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={handlePrechatSend}
              onPay={() => setStage("payment")}
              exchanges={prechatExchanges}
              isStreaming={isStreaming}
              maxExchanges={3}
              sessionId={sessionId}
            />
          ) : (
            <DemoPaymentWall
              topic={pendingTopic}
              resumen={classifyResumen}
              sessionId={sessionId}
              onBack={() => { setStage("input"); setMessages(prev => prev.slice(0, -2)); }}
            />
          )}
        </div>
      )}

      {/* Classifying spinner */}
      {stage === "classifying" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e0d8c8", borderTopColor: "#1a3a2a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 14, color: "#6a5e50" }}>Analizando tu consulta...</div>
        </div>
      )}

      {/* Resuming spinner */}
      {stage === "resuming" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e0d8c8", borderTopColor: "#1a3a2a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 14, color: "#6a5e50" }}>Cargando tu consulta...</div>
        </div>
      )}

      {/* Chat */}
      {(stage === "input" || stage === "topic-confirm" || stage === "chat" || stage === "closed") && (
        <>
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div
            ref={chatScrollRef}
            onScroll={() => {
              const el = chatScrollRef.current;
              if (!el) return;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
              setUserScrolledUp(!nearBottom);
            }}
            style={{ height: "100%", overflowY: "auto", padding: "18px 10px", display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Sugerencias solo al inicio */}
              {stage === "input" && messages.length === 1 && (
                <div>
                  <div style={{ fontSize: 12, color: "#8a7a68", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                    Consultas frecuentes
                  </div>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} data-action="suggest" data-text={s} onClick={() => handleInitialSubmit(s)} style={{
                      display: "block", width: "100%", background: "white", border: "1px solid #e0d8c8",
                      borderRadius: 10, padding: "11px 15px", fontSize: 15, color: "#3a3028",
                      textAlign: "left", cursor: "pointer", marginBottom: 7,
                      fontFamily: "inherit", lineHeight: 1.4,
                    }}>{s}</button>
                  ))}
                </div>
              )}

              {showTermHint && messages.length > 1 && (
                <div style={{
                  background: '#fef3c7', border: '1px solid #f6d860', borderRadius: 10,
                  padding: '8px 12px', fontSize: 12, color: '#7c5c00',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}>
                  <span>💡 Los términos con <strong>?</strong> los puedes tocar para ver qué significan.</span>
                  <button onClick={() => {
                    setShowTermHint(false);
                    try { localStorage.setItem('juanita_hintSeen', '1'); } catch(e) {}
                  }} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                    color: '#7c5c00', lineHeight: 1, padding: '0 2px', flexShrink: 0,
                  }}>×</button>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id} msg={msg} topic={lockedTopic || pendingTopic}
                  sessionId={sessionId}
                  onTermClick={setActiveTerm} activeTerm={activeTerm}
                />
              ))}

              <div ref={scrollRef} />
            </div>
          </div>
          {userScrolledUp && (
            <button
              onClick={() => { setUserScrolledUp(false); scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              style={{
                position: "absolute", bottom: 16, right: 16,
                background: "#1a3a2a", color: "#c8e6c0",
                border: "none", borderRadius: "50%", width: 40, height: 40,
                fontSize: 18, cursor: "pointer", zIndex: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Ir al final"
            >↓</button>
          )}
          </div>

          {/* Input */}
          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #e8e0d0", background: "#faf8f4" }}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>

              {/* Banner de tiempo expirado */}
              {timerExpired && (
                <div style={{
                  background: "#fff4ef", border: "1.5px solid #f5c9ae",
                  borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: 13, color: "#7a3818", fontWeight: 500 }}>
                    ⏰ Tiempo agotado
                  </span>
                  <button
                    onClick={() => window.location.href = '/?renew=1'}
                    style={{
                      background: "#c8a040", color: "white", border: "none",
                      borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    Renovar sesión ($4.995)
                  </button>
                </div>
              )}

              {/* Revisión de transcripción */}
              {voiceState === 'reviewing' && (
                <div style={{
                  background: "#eff3ff", border: "1.5px solid #b8ccf5",
                  borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                  animation: "fadeUp 0.2s ease",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#3a6fd4", marginBottom: 8 }}>
                    🎙️ Revisa que esté bien lo que dijiste:
                  </div>
                  <textarea
                    rows={2}
                    value={editableTranscript}
                    onChange={e => setEditableTranscript(e.target.value)}
                    style={{
                      width: "100%", border: "1.5px solid #b8ccf5", borderRadius: 10,
                      padding: "8px 10px", fontSize: 13, color: "#2a2018",
                      background: "white", resize: "none", outline: "none",
                      fontFamily: "inherit", lineHeight: 1.5, marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleConfirmTranscript}
                      disabled={!editableTranscript.trim()}
                      style={{
                        flex: 1, background: editableTranscript.trim() ? "#1a3a2a" : "#c0b8a8",
                        color: editableTranscript.trim() ? "#c8e6c0" : "#8a7a68",
                        border: "none", borderRadius: 10, padding: "9px 12px",
                        fontSize: 13, fontWeight: 600,
                        cursor: editableTranscript.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      ✓ Confirmar y enviar
                    </button>
                    <button
                      onClick={resetVoice}
                      style={{
                        background: "white", border: "1.5px solid #b8ccf5",
                        borderRadius: 10, padding: "9px 12px",
                        fontSize: 13, color: "#3a6fd4", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      🎙️ Grabar de nuevo
                    </button>
                  </div>
                </div>
              )}

              {/* Indicador de grabación */}
              {voiceState === 'recording' && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#fff0f0", border: "1.5px solid #f5b8b8",
                  borderRadius: 14, padding: "10px 14px", marginBottom: 8,
                  animation: "fadeUp 0.2s ease",
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: "#e04040",
                    animation: "pulse 1s ease-in-out infinite",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: "#a02020", fontWeight: 500 }}>
                    Grabando... (toca el micrófono para detener)
                  </span>
                </div>
              )}

              {/* Indicador de transcripción */}
              {voiceState === 'transcribing' && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#fffbef", border: "1.5px solid #f0de8a",
                  borderRadius: 14, padding: "10px 14px", marginBottom: 8,
                }}>
                  <div style={{ width: 14, height: 14, border: "2px solid #c8a040", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#7a5a10" }}>Transcribiendo audio...</span>
                </div>
              )}

              {/* Preview de archivo adjunto */}
              {attachedFile && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f0f8ff', border: '1.5px solid #b8d4f0',
                  borderRadius: 10, padding: '8px 12px', marginBottom: 6,
                }}>
                  {attachedFile.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(attachedFile)}
                      alt="preview"
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a6fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2a4a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {attachedFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#6a8ab0' }}>
                      {(attachedFile.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a8ab0', fontSize: 16, padding: 2, lineHeight: 1 }}
                  >×</button>
                </div>
              )}

              {/* Input oculto para archivos */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setAttachedFile(file);
                }}
              />

              <div style={{
                display: "flex", gap: 8, alignItems: "flex-end",
                background: inputDisabled ? "#f0ebe0" : "white",
                border: `1.5px solid ${inputDisabled ? "#d8cfc0" : "#1a3a2a"}`,
                borderRadius: 14, padding: "9px 11px", transition: "border-color 0.15s",
              }}>
                <textarea
                  rows={1}
                  disabled={inputDisabled || voiceState !== 'idle'}
                  placeholder={inputPlaceholder}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  style={{
                    flex: 1, border: "none", outline: "none", fontSize: 17, color: "#2a2018",
                    background: "transparent", resize: "none", maxHeight: 120, lineHeight: 1.5,
                    fontFamily: "inherit", minHeight: 44,
                  }}
                />
                {/* Botón adjuntar */}
                {!inputDisabled && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar documento o imagen"
                    style={{
                      width: 34, height: 34,
                      background: attachedFile ? '#e8f4ff' : 'transparent',
                      border: `1.5px solid ${attachedFile ? '#3a6fd4' : '#d8cfc0'}`,
                      borderRadius: 9,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke={attachedFile ? '#3a6fd4' : '#6a5e50'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                )}
                {/* Botón micrófono */}
                {!inputDisabled && (
                  <button
                    onClick={handleMicClick}
                    disabled={voiceState === 'transcribing' || voiceState === 'reviewing'}
                    title={voiceState === 'recording' ? "Detener grabación" : "Grabar mensaje de voz"}
                    style={{
                      width: 34, height: 34,
                      background: voiceState === 'recording' ? "#e04040" : "transparent",
                      border: voiceState === 'recording' ? "none" : "1.5px solid #d8cfc0",
                      borderRadius: 9,
                      cursor: voiceState === 'transcribing' || voiceState === 'reviewing' ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      transition: "background 0.2s",
                      animation: voiceState === 'recording' ? "pulse 1s ease-in-out infinite" : "none",
                      opacity: voiceState === 'transcribing' || voiceState === 'reviewing' ? 0.4 : 1,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke={voiceState === 'recording' ? "white" : "#6a5e50"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="11" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="8" y1="22" x2="16" y2="22" />
                    </svg>
                  </button>
                )}
                <button onClick={handleSend} disabled={inputDisabled || (!input.trim() && !attachedFile) || voiceState !== 'idle'} style={{
                  width: 34, height: 34, background: inputDisabled || (!input.trim() && !attachedFile) || voiceState !== 'idle' ? "#c0b8a8" : "#1a3a2a",
                  border: "none", borderRadius: 9, cursor: inputDisabled || (!input.trim() && !attachedFile) || voiceState !== 'idle' ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div style={{
                fontSize: 12, color: "#8a7a68", textAlign: "center", marginTop: 8,
                display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap",
              }}>
                <span>🎙️ Voz: toca el micrófono para hablar</span>
                <span style={{ color: "#c8a040" }}>·</span>
                <span>📎 Docs: adjunta imágenes o PDF</span>
              </div>
              <div style={{ fontSize: 12, color: "#a09080", textAlign: "center", marginTop: 8 }}>
                Orientación legal general e informativa · No reemplaza a un abogado/a · No constituye asesoría jurídica personalizada · No crea relación abogado-cliente
              </div>
              <div style={{ fontSize: 11, color: "#c0b8b0", textAlign: "center", marginTop: 2 }}>
                v2.2
              </div>
            </div>
          </div>
        </>
      )}
      {showRating && (
        <RatingModal
          sessionId={sessionId}
          onClose={() => { setShowRating(false); setRatingDone(true); }}
        />
      )}
      {showDiscountModal && (
        <LaunchDiscountModal
          onApply={() => { setAutoPromo('LANZAMIENTO'); setShowDiscountModal(false); track('discount_modal_apply', { tema: pendingTopic }); }}
          onClose={() => setShowDiscountModal(false)}
        />
      )}
      </div>{/* end main column */}

      {/* Desktop term panel */}
      {activeTerm && !isMobile && (
        <div style={{
          width: 300, flexShrink: 0,
          borderLeft: "1px solid #e8e0d0", background: "white",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}>
          <div style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid #e8e0d0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 11, color: "#8a7a68", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              ¿Qué significa?
            </span>
            <button
              onClick={() => setActiveTerm(null)}
              style={{
                background: "#f0ebe0", border: "none", borderRadius: "50%",
                width: 26, height: 26, cursor: "pointer", fontSize: 13, color: "#6a5e50",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a2a", marginBottom: 12, lineHeight: 1.3 }}>
              {activeTerm.label}
            </div>
            <div style={{ fontSize: 14, color: "#3a3028", lineHeight: 1.75 }}>
              {activeTerm.explanation}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {activeTerm && isMobile && (
        <>
          <div
            onClick={() => setActiveTerm(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300 }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: "42vh", background: "white",
            borderRadius: "20px 20px 0 0",
            padding: "20px 18px",
            zIndex: 301, overflowY: "auto",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
            animation: "fadeUp 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#8a7a68", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                ¿Qué significa?
              </span>
              <button
                onClick={() => setActiveTerm(null)}
                style={{
                  background: "#f0ebe0", border: "none", borderRadius: "50%",
                  width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#6a5e50",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a2a", marginBottom: 12, lineHeight: 1.3 }}>
              {activeTerm.label}
            </div>
            <div style={{ fontSize: 14, color: "#3a3028", lineHeight: 1.75 }}>
              {activeTerm.explanation}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
