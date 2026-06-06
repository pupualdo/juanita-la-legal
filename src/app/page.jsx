'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroSection from '@/components/landing/HeroSection';
import ChatSection from '@/components/chat/ChatSection';
import TermsScreen from '@/components/landing/TermsScreen';

// ─── PAID DETECTOR (requiere Suspense por useSearchParams) ───────────────────

function PaidDetector({ onPaid }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('paid') === 'true') {
      const savedSession = localStorage.getItem('juanita_session');
      if (savedSession) onPaid();
    }
  }, [searchParams]);
  return null;
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("hero");
  const [postTermsScreen, setPostTermsScreen] = useState("chat");

  const navigateWithTerms = (nextScreen) => {
    const accepted = typeof window !== 'undefined' && localStorage.getItem('juanita_terms_accepted') === '1';
    if (accepted) {
      setScreen(nextScreen);
    } else {
      setPostTermsScreen(nextScreen);
      setScreen('terms');
    }
  };

  useEffect(() => {
    const b = document.querySelector('[data-action="start"]');
    if (b) b.onclick = null; // cleanup any leftover DOM handler
  }, [screen]);

  const handlePaid = () => navigateWithTerms('chat-paid');

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf8f4; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.92); } }
        @keyframes dotPulse { 0%, 60%, 100% { opacity: 0.25; transform: scale(0.8); } 30% { opacity: 1; transform: scale(1); } }
        textarea { font-family: inherit; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d8cfc0; border-radius: 4px; }
      `}</style>

      <Suspense fallback={null}>
        <PaidDetector onPaid={handlePaid} />
      </Suspense>

      {screen === "hero" && <HeroSection onStart={() => navigateWithTerms("chat")} />}
      {screen === "chat" && <ChatSection onRestart={() => setScreen("hero")} initialPaid={false} />}
      {screen === "terms" && <TermsScreen onAccept={() => setScreen(postTermsScreen)} />}
      {screen === "chat-paid" && (
        <ChatSection
          onRestart={() => setScreen("hero")}
          initialPaid={true}
          initialSessionId={typeof window !== 'undefined' ? localStorage.getItem('juanita_session') : null}
        />
      )}
    </>
  );
}
