'use client';

import { useState } from 'react';
import { DIAGNOSTICO_PREGUNTAS } from '@/config/diagnostico';
import { trackEvent } from '@/lib/analytics';

const formatCLP = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export default function Diagnostico() {
  const [etapa, setEtapa] = useState('preguntas'); // preguntas | parcial | completo
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [parcial, setParcial] = useState(null);
  const [completo, setCompleto] = useState(null);
  const [captura, setCaptura] = useState({ email: '', empresa: '', rut: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = DIAGNOSTICO_PREGUNTAS.length;
  const actual = DIAGNOSTICO_PREGUNTAS[paso];

  const responder = (valor) => {
    const next = { ...respuestas, [actual.id]: valor };
    setRespuestas(next);
    if (paso < total - 1) {
      setPaso(paso + 1);
    } else {
      enviar(next);
    }
  };

  const enviar = async (respuestasFinales, capturaExtra = null) => {
    setLoading(true);
    setError('');
    try {
      const body = capturaExtra ? { respuestas: respuestasFinales, ...capturaExtra } : { respuestas: respuestasFinales };
      const res = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      if (data.completo) {
        setCompleto(data);
        setEtapa('completo');
        trackEvent('PreChatMessage3', { entregables: data.entregables.map((e) => e.id) });
      } else {
        setParcial(data);
        setEtapa('parcial');
      }
    } catch (e) {
      setError(e.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const enviarCaptura = (e) => {
    e.preventDefault();
    if (!captura.email || !captura.empresa || !captura.rut) return;
    enviar(respuestas, { email: captura.email.trim(), empresa: captura.empresa.trim(), rut: captura.rut.trim() });
  };

  const reiniciar = () => {
    setEtapa('preguntas');
    setPaso(0);
    setRespuestas({});
    setParcial(null);
    setCompleto(null);
    setCaptura({ email: '', empresa: '', rut: '' });
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '1px solid #e7e0d4',
    borderRadius: 12,
    background: '#ffffff',
    color: '#2d2a26',
    fontFamily: 'inherit',
    marginBottom: 10,
  };

  return (
    <section style={{ background: '#f0ece3', borderRadius: 20, padding: '40px 28px', margin: '48px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#4a7a5a', marginBottom: 8 }}>
          Gratis · 2 minutos
        </div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 30, fontWeight: 600, color: '#2d2a26', margin: 0 }}>
          Descubre qué le falta a tu empresa
        </h2>
        <p style={{ fontSize: 16, color: '#5c574e', marginTop: 8 }}>
          Responde estas preguntas y te decimos qué documentos te faltan para estar al día.
        </p>
      </div>

      {etapa === 'preguntas' && actual && (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: '#8a8378', marginBottom: 8 }}>
            Pregunta {paso + 1} de {total}
          </div>
          <div style={{ height: 4, background: '#e7e0d4', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((paso + 1) / total) * 100}%`, background: '#4a7a5a', transition: 'width 0.2s' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#2d2a26', margin: '0 0 16px' }}>{actual.pregunta}</h3>

          {actual.tipo === 'number' ? (
            <div>
              <input
                type="number"
                min="0"
                autoFocus
                placeholder="Ej: 5"
                style={inputStyle}
                onChange={(e) => (respuestas[actual.id] = e.target.value)}
              />
              <button
                onClick={() => responder(String(respuestas[actual.id] ?? ''))}
                style={btnStyle}
              >
                Siguiente
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actual.opciones.map((op) => (
                <button
                  key={op}
                  onClick={() => responder(op)}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    fontSize: 16,
                    textAlign: 'left',
                    border: '1px solid #e7e0d4',
                    borderRadius: 12,
                    background: '#ffffff',
                    color: '#2d2a26',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {etapa === 'parcial' && parcial && (
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          {parcial.cumplido ? (
            <p style={{ fontSize: 17, color: '#4a7a5a', lineHeight: 1.6 }}>{parcial.cumplido}</p>
          ) : (
            <>
              <p style={{ fontSize: 17, color: '#2d2a26', margin: '0 0 16px' }}>
                Encontramos <strong>{parcial.total_carencias}</strong> {parcial.total_carencias === 1 ? 'punto' : 'puntos'} en los que tu empresa puede mejorar:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 24px', maxWidth: 420 }}>
                {parcial.titulos.map((t) => (
                  <li key={t} style={{ padding: '10px 0', borderBottom: '1px solid #e7e0d4', fontSize: 15, color: '#5c574e' }}>
                    ⚠️ {t}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p style={{ fontSize: 15, color: '#5c574e', margin: '0 0 20px' }}>
            Déjanos tu correo y te enviamos el detalle completo con lo que debes hacer y cuánto cuesta resolverlo.
          </p>
          <form onSubmit={enviarCaptura} style={{ textAlign: 'left' }}>
            <input
              type="email"
              required
              placeholder="Tu correo"
              style={inputStyle}
              value={captura.email}
              onChange={(e) => setCaptura({ ...captura, email: e.target.value })}
            />
            <input
              type="text"
              required
              placeholder="Nombre de la empresa"
              style={inputStyle}
              value={captura.empresa}
              onChange={(e) => setCaptura({ ...captura, empresa: e.target.value })}
            />
            <input
              type="text"
              required
              placeholder="RUT de la empresa"
              style={inputStyle}
              value={captura.rut}
              onChange={(e) => setCaptura({ ...captura, rut: e.target.value })}
            />
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Enviando…' : 'Ver mi resultado completo'}
            </button>
          </form>
        </div>
      )}

      {etapa === 'completo' && completo && (
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          {completo.cumplido ? (
            <p style={{ fontSize: 17, color: '#4a7a5a', textAlign: 'center', lineHeight: 1.6 }}>{completo.cumplido}</p>
          ) : (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2d2a26', margin: '0 0 16px' }}>
                Esto es lo que encontramos 👇
              </h3>
              {completo.carencias.map((c) => (
                <div key={c.titulo} style={{ background: '#ffffff', borderRadius: 12, padding: '18px 20px', marginBottom: 12, border: '1px solid #e7e0d4' }}>
                  <div style={{ fontWeight: 600, color: '#2d2a26', fontSize: 16, marginBottom: 6 }}>⚠️ {c.titulo}</div>
                  <div style={{ fontSize: 14, color: '#5c574e', lineHeight: 1.6 }}>{c.detalle}</div>
                </div>
              ))}

              {completo.entregables.length > 0 && (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2d2a26', margin: '24px 0 16px' }}>
                    Estos documentos lo resuelven
                  </h3>
                  {completo.entregables.map((e) => (
                    <div key={e.id} style={{ background: '#ffffff', borderRadius: 12, padding: '18px 20px', marginBottom: 12, border: '1px solid #e7e0d4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#2d2a26', fontSize: 16 }}>
                          {e.emoji} {e.nombre}
                        </div>
                        <div style={{ fontSize: 13, color: '#8a8378', marginTop: 2 }}>⏱️ {e.plazo}</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#2d2a26', fontFamily: 'var(--font-fraunces)', whiteSpace: 'nowrap' }}>
                        {formatCLP(e.precio)}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 14, color: '#5c574e', textAlign: 'center', margin: '16px 0 0' }}>
                    Te escribiremos con los próximos pasos para contratar el documento que necesitas.
                  </p>
                </>
              )}
            </>
          )}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={reiniciar} style={{ ...btnStyle, background: 'transparent', color: '#2d2a26', border: '1px solid #e7e0d4' }}>
              Hacer el diagnóstico de nuevo
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ textAlign: 'center', color: '#b3452e', fontSize: 14, marginTop: 12 }}>{error}</p>}
    </section>
  );
}

const btnStyle = {
  width: '100%',
  padding: '16px 20px',
  fontSize: 16,
  fontWeight: 600,
  border: 'none',
  borderRadius: 12,
  background: '#2d2a26',
  color: '#ffffff',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
