'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const TOPIC_LABELS = {
  familia: "Derecho de Familia",
  laboral: "Derecho Laboral",
  arriendo: "Arriendo y Vivienda",
  herencia: "Herencia y Sucesión",
  migracion: "Migración",
  terrenos: "Terrenos y Propiedad",
  deudas: "Deudas y Cobranzas",
  empresas: "Empresas y Emprendimiento",
  contratos: "Contratos y Consumidor",
  otros: "Consulta Legal General",
};

const TOPIC_META = {
  familia:   { emoji: "🏠", color: "#d4845a", bg: "#fff4ef", border: "#f5c9ae" },
  laboral:   { emoji: "💼", color: "#3a6fd4", bg: "#eff3ff", border: "#b8ccf5" },
  arriendo:  { emoji: "🔑", color: "#c49a12", bg: "#fffbef", border: "#f0de8a" },
  herencia:  { emoji: "📜", color: "#7a4ad4", bg: "#f5efff", border: "#cdb8f0" },
  migracion: { emoji: "🌍", color: "#2a9a5a", bg: "#effff4", border: "#9adfc0" },
  terrenos:  { emoji: "🌿", color: "#4a7a20", bg: "#f0f5e8", border: "#b8d98a" },
  deudas:    { emoji: "💰", color: "#c44a12", bg: "#fff2ee", border: "#f5b8a0" },
  empresas:  { emoji: "🏢", color: "#1a6fa0", bg: "#eef6fb", border: "#9acce8" },
  contratos: { emoji: "📋", color: "#6a3a8a", bg: "#f5eeff", border: "#cbaee8" },
  otros:     { emoji: "⚖️", color: "#4a5568", bg: "#f7fafc", border: "#cbd5e0" },
};

const TOPIC_KEYWORDS = {
  familia:   ["pension","alimentos","visitas","hijo","hija","tuicion","custodia","divorcio","pareja","violencia intrafamiliar","vif","cuidado personal"],
  laboral:   ["despido","finiquito","sueldo","trabajo","empleador","cotizaciones","renuncia","liquidacion","horas extra","contrato de trabajo"],
  arriendo:  ["arriendo","arrendador","arrendatario","garantia","renta","departamento","casa","inmueble","desalojo","contrato arriendo"],
  herencia:  ["herencia","posesion efectiva","testamento","heredero","herederos","sucesion","causante","fallecio","murio"],
  migracion: ["visa","residencia","migracion","extranjero","permanencia","permiso","regularizacion","venezolano","colombiano","inmigrante"],
  terrenos:  ["terreno","dominio","deslinde","sitio","ocupante","servidumbre","rol","conservador","regularizacion terreno","titulo de dominio","escritura"],
  deudas:    ["dicom","deuda","cobranza","renegociar","incobrable","insolvencia","embargo","remate","moroso","credito","acreedor"],
  empresas:  ["sociedad","empresa","pyme","sii","patente","tributario","factura","boleta","inicio actividades","emprendedor","spa","eirl"],
  contratos: ["contrato","incumplimiento","proveedor","consumidor","sernac","garantia producto","reclamo","pagare","letra","cobro"],
};

const QUESTION_SETS = {
  familia: [
    "¿Cuál es el problema principal? (pensión, visitas, divorcio, VIF u otro)",
    "¿Quiénes están involucrados y hay niños de por medio?",
    "¿Existe alguna resolución judicial o acuerdo previo firmado?",
    "¿Qué documentos tienes hoy? (partidas de nacimiento, acuerdos, mensajes)",
    "¿Qué es lo que más te urge resolver ahora?",
  ],
  laboral: [
    "¿Cuál es el problema: despido, deuda de sueldo, cotizaciones u otro?",
    "¿Cuánto tiempo trabajaste ahí y tenías contrato por escrito?",
    "¿Te entregaron carta de despido o finiquito?",
    "¿Qué pruebas tienes hoy? (contratos, liquidaciones, mensajes)",
    "¿Cuánto tiempo lleva esto sin resolverse?",
  ],
  arriendo: [
    "¿Eres arrendador o arrendatario?",
    "¿Existe contrato de arriendo por escrito?",
    "¿Cuál es el problema principal? (garantía, deuda, desalojo, daños)",
    "¿Desde cuándo viene este conflicto?",
    "¿Tienes mensajes, transferencias, fotos o inventario como respaldo?",
  ],
  herencia: [
    "¿Cuál es el conflicto principal de la herencia?",
    "¿Existe testamento? ¿Ya se hizo la posesión efectiva?",
    "¿Quiénes son los herederos y están todos de acuerdo?",
    "¿Qué bienes están en disputa? (inmuebles, cuentas, vehículos)",
    "¿Qué documentos tienes reunidos hoy?",
  ],
  migracion: [
    "¿Cuál es tu situación migratoria actual? (visa temporal, permanencia definitiva, irregular)",
    "¿Qué trámite necesitas resolver?",
    "¿Tienes plazos vencidos o rechazos previos?",
    "¿Qué documentos tienes reunidos?",
    "¿Qué es lo más urgente en este momento?",
  ],
  terrenos: [
    "¿Cuál es el problema principal con el terreno?",
    "¿Tienes escritura o título inscrito en el Conservador de Bienes Raíces?",
    "¿Hay disputa de deslindes, ocupación ilegal o necesitas regularizar?",
    "¿Existe plano, rol SII o antecedentes del Conservador?",
    "¿Qué necesitas resolver primero?",
  ],
  deudas: [
    "¿Cuál es el problema principal? (Dicom, cobranza, renegociación u otro)",
    "¿Sabes cuánto debes en total y a quiénes?",
    "¿Estás recibiendo llamadas o presiones de cobradores?",
    "¿Tienes ingresos actualmente o estás sin trabajo?",
    "¿Qué es lo más urgente que necesitas resolver?",
  ],
  empresas: [
    "¿Qué necesitas hacer? (constituir empresa, inicio de actividades, facturación u otro)",
    "¿Vas a trabajar solo/a o con socios?",
    "¿Tienes idea del tipo de negocio o giro que vas a tener?",
    "¿Ya tienes RUT de empresa o estás partiendo desde cero?",
    "¿Qué es lo que más te confunde del proceso?",
  ],
  contratos: [
    "¿Cuál es el problema principal? (incumplimiento de contrato, garantía, producto malo u otro)",
    "¿Tienes el contrato o comprobante de compra por escrito?",
    "¿Ya reclamaste con la empresa o tienda? ¿Qué te respondieron?",
    "¿Cuánto dinero está en juego aproximadamente?",
    "¿Qué es lo que necesitas resolver?",
  ],
};

const DISCLAIMER = "Esta es orientación legal de carácter general e informativo. No constituye asesoría jurídica personalizada, no reemplaza a un abogado/a y no crea relación abogado-cliente. Cada situación tiene particularidades propias — la información entregada es referencial y la decisión final debe evaluarse con un profesional según tu caso concreto.";

const SUGGESTIONS = [
  "¿Cómo pido pensión de alimentos para mis hijos?",
  "Me despidieron sin causa justa, ¿qué hago?",
  "Mi arrendador no me devuelve la garantía",
  "Falleció un familiar y no sé cómo hacer la herencia",
  "Necesito regularizar mi situación migratoria",
  "Tengo un terreno sin escritura, ¿cómo lo regularizo?",
  "Estoy en Dicom y quiero salir, ¿qué opciones tengo?",
  "Quiero crear una empresa o pyme en Chile",
  "Me vendieron un producto malo y la empresa no responde",
  "Tengo otra consulta legal",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const createId = () => Math.random().toString(36).slice(2, 10);

const normalizeText = (v) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const buildFinalAnswer = (topic) => ({
  summary: `Con lo que me contaste, esto es un problema de **${TOPIC_LABELS[topic]}** que vale la pena ordenar bien antes de actuar.`,
  facts: [
    "Los hechos concretos con fechas son clave para orientarte bien.",
    "Los documentos que tienes pueden cambiar bastante la evaluación del caso.",
  ],
  risks: [
    "Si dejas pasar tiempo, puede complicarse reclamar tus derechos.",
    "Sin respaldos escritos, la orientación legal es más limitada.",
  ],
  options: [
    "Ordenar todos los antecedentes y definir qué corresponde primero.",
    "Evaluar si se necesita acción formal según el nivel del conflicto.",
    "Consultar en la clínica jurídica de alguna universidad cercana si no tienes recursos.",
  ],
  nextSteps: [
    "Anota qué pasó y en qué fechas exactas.",
    "Reúne contratos, mensajes, comprobantes y cualquier documento relevante.",
    "No firmes nada nuevo sin entenderlo completamente.",
    "Si necesitas un abogado y no puedes pagar uno, consulta en la clínica jurídica de alguna universidad cercana.",
  ],
  lawyerNeeded: "Necesitas abogado sí o sí si hay montos altos, plazos corriendo, conflicto formal o documentos complejos que firmar.",
  disclaimer: DISCLAIMER,
  canGenerateDocument: ["laboral", "arriendo"].includes(topic),
});

// ─── TIMER ───────────────────────────────────────────────────────────────────

function ConsultTimer({ active, totalSeconds, onExpire }) {
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

function TopicBadge({ topic }) {
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

function FinalAnswerCard({ data, topic }) {
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

function Section({ title, items, color, bg }) {
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

// ─── LEGAL TERMS DICTIONARY ──────────────────────────────────────────────────

const LEGAL_TERMS = {
  "posesión efectiva": "Es el trámite que reconoce oficialmente quiénes son los herederos de alguien que falleció. Sin esto, no puedes disponer de los bienes del fallecido.",
  "finiquito": "Es el documento que se firma cuando termina tu trabajo. Ahí se detalla todo lo que te deben pagar: sueldo pendiente, vacaciones, indemnización, etc.",
  "testamento": "Es un documento donde una persona deja escrito cómo quiere que se repartan sus bienes cuando fallezca. Si no hay testamento, la ley decide quién hereda.",
  "mediación": "Es una reunión gratuita con un mediador (una persona neutral) donde tú y la otra parte intentan llegar a un acuerdo sin ir a juicio. En temas de familia es obligatoria antes de demandar.",
  "fuero laboral": "Es una protección legal que impide que te despidan en ciertas situaciones, como cuando estás con licencia médica, embarazada, o eres dirigente sindical.",
  "prescripción adquisitiva": "Es cuando puedes convertirte en dueño legal de un terreno por haberlo usado y cuidado durante muchos años, aunque no tengas escritura.",
  "indemnización por años de servicio": "Es la plata que tu empleador te debe pagar cuando te despide: 1 mes de sueldo por cada año que trabajaste ahí.",
  "aviso previo": "Cuando te despiden, el empleador debe avisarte con 30 días de anticipación. Si no lo hace, te debe pagar 1 mes de sueldo extra.",
  "desahucio": "En arriendo, es el aviso formal de que el contrato va a terminar. Tiene plazos legales que el arrendador debe respetar.",
  "lanzamiento": "Es cuando te sacan de una propiedad arrendada, pero solo un juez puede ordenarlo. Si el arrendador lo hace por su cuenta (cambiar cerraduras, etc.) es ilegal.",
  "pensión alimenticia": "Es la plata que un padre o madre debe pasar mensualmente para mantener a sus hijos: comida, salud, educación, ropa, etc.",
  "tuición": "Hoy se llama 'cuidado personal'. Es el derecho de decidir con cuál de los padres viven los hijos día a día.",
  "régimen de visitas": "Es el calendario que define cuándo y cómo el padre/madre que no vive con los hijos puede verlos y compartir con ellos.",
  "vif": "Violencia Intrafamiliar. Es cualquier tipo de maltrato (físico, psicológico, económico) dentro de la familia. Es delito en Chile.",
  "inspección del trabajo": "Es una oficina del gobierno donde puedes denunciar gratis a tu empleador si no respeta tus derechos laborales. Ellos investigan y pueden multarlo.",
  "clínica jurídica": "Es un servicio gratuito que ofrecen muchas universidades. Estudiantes de derecho supervisados por profesores te ayudan con orientación y representación legal sin costo.",
  "conservador de bienes raíces": "Es la oficina donde se registran todos los terrenos, casas y departamentos del país. Si un bien raíz no está inscrito ahí, legalmente no existe a tu nombre.",
  "dem": "Departamento de Extranjería y Migración. Es la oficina del gobierno que tramita visas, residencias y todo lo relacionado con migración.",
  "arraigo nacional": "Es una medida que impide a una persona salir del país. Se usa por ejemplo cuando alguien debe pensión alimenticia y no paga.",
  "beneficio de inventario": "Es un derecho que te permite aceptar una herencia pero solo hasta el valor de los bienes que dejó el fallecido, sin tener que pagar sus deudas con tu propia plata.",

  "previred": "Es el sitio web (previred.com) donde puedes ver tus cotizaciones de AFP, salud y tu historial laboral. Sirve para comprobar si tu empleador te está pagando las imposiciones.",
  "afp": "Administradora de Fondos de Pensiones. Es la empresa que administra tu plata para la jubilación. En Chile cada trabajador debe cotizar un 10% de su sueldo en una AFP.",
  "sii": "Servicio de Impuestos Internos. Es el organismo que cobra impuestos y maneja trámites como el inicio de actividades, facturas y el impuesto a la herencia.",
  "sernac": "Servicio Nacional del Consumidor. Protege a los consumidores ante abusos de empresas (garantías no cumplidas, cláusulas abusivas, publicidad engañosa). Denuncias en sernac.cl o 800 700 100.",
  "dicom": "Es el registro de deudores morosos. Si no pagas una deuda, quedas en Dicom y afecta tu acceso a créditos. Después de 5 años, la deuda prescribe y debes salir automáticamente.",
  "prescripción": "Es cuando pasa tanto tiempo sin que alguien te cobre una deuda o sin que actúen en tu contra, que legalmente ya no te pueden exigir nada. En Chile: 5 años para deudas civiles, 1 año para cheques.",
  "finiquito notarial": "Finiquito firmado ante notario. Vale más que uno firmado sin testigos porque hace plena fe. Siempre firma el finiquito ante notario o inspector del trabajo.",
  "medida cautelar": "Es una orden del tribunal para protegerte mientras se resuelve un juicio. Ejemplo: prohibición de acercamiento en caso de violencia, embargo de bienes para asegurar una deuda.",
  "apremio": "Es una medida legal para obligar a alguien a pagar lo que debe. Incluye arresto nocturno, retención del sueldo, suspensión de licencia de conducir. Se usa mucho en pensiones alimenticias impagas.",
  "causal de despido": "Es la razón legal por la que te despidieron. Las más comunes: necesidades de la empresa (art. 161), falta grave (art. 160), mutuo acuerdo (art. 159). La causal determina tus derechos.",
  "spa": "Sociedad por Acciones. Es el tipo de sociedad más flexible para emprendedores en Chile. Se constituye en 1 día por internet, permite 1 o más accionistas, y las acciones se pueden vender sin acuerdo de todos.",
  "tribunal de familia": "Tribunal especializado en temas de familia: divorcio, pensión alimenticia, tuición, visitas, violencia intrafamiliar. Se ubica en casi todas las comunas.",
  "juzgado de policía local": "Tribunal que ve infracciones municipales y temas de arriendo como cobro de rentas impagas, restitución de inmueble, ruidos molestos.",
  "ley karin": "Ley 21.643 que regula el acoso laboral y sexual en el trabajo. Obliga a las empresas a tener protocolos y permite al trabajador denunciar.",
  "patente municipal": "Es un permiso que da la municipalidad para que una empresa o persona natural pueda realizar una actividad comercial o profesional en ese lugar.",
  "usufructo": "Es el derecho a usar y disfrutar de un bien (casa, terreno) que pertenece a otra persona. Por ejemplo, un viudo puede tener usufructo sobre la casa familiar.",
  "registro civil": "Es la oficina que maneja certificados de nacimiento, matrimonio, defunción, y también tramita la posesión efectiva sin testamento cuando los bienes son menores a 5.000 UTM.",
  "visa sujeta a contrato": "Visa de trabajo que depende de tener un contrato laboral vigente. Si te despiden, tienes 30 días para encontrar nuevo empleador o pierdes la visa.",
  "residencia definitiva": "Permiso para vivir permanentemente en Chile. Se solicita después de 1-2 años con visa temporal. Se revoca si sales del país por más de 2 años seguidos.",
  "notario": "Es un funcionario público que autoriza y da fe de documentos importantes (contratos, poderes, escrituras, finiquitos). Los documentos ante notario tienen más valor legal.",
};

// ─── EXPLAINABLE MESSAGE ─────────────────────────────────────────────────────

function TypingDots() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (elapsed >= 3) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4a7a5a' }}>
        <span>🔍</span>
        <span>Verificando información actualizada...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#8fbc8f',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: '#6a8a6a', fontStyle: 'italic' }}>Juanita está escribiendo...</span>
    </div>
  );
}

function JuanitaMessage({ text, onTermClick, activeTerm }) {
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
        p: ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.65 }}>{children}</p>,
        h2: ({ children }) => <h2 style={{ color: '#1a3a2a', fontSize: 15, fontWeight: 700, margin: '12px 0 6px', lineHeight: 1.3 }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: '#1a3a2a', fontSize: 14, fontWeight: 600, margin: '10px 0 4px', lineHeight: 1.3 }}>{children}</h3>,
        ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '4px 0 8px' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '4px 0 8px' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: 3, lineHeight: 1.6 }}>{children}</li>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e0d8c8', margin: '10px 0' }} />,
        strong: LegalStrong,
        table: ({ children }) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>{children}</table></div>,
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

function ContactForm({ topic, sessionId }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name, phone, email, description, tema: topic, sessionId,
        }),
      });
    } catch {}
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{
        marginTop: 12, background: '#f0faf0', border: '1.5px solid #a8d5a0',
        borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#2a5a2a',
        fontWeight: 500,
      }}>
        ✅ ¡Datos enviados! Un profesional te contactará pronto.
      </div>
    );
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #d8cfc0', borderRadius: 9,
    padding: '9px 11px', fontSize: 13, color: '#2a2018', background: 'white',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        required type="text" placeholder="Nombre completo"
        value={name} onChange={e => setName(e.target.value)} style={inputStyle}
      />
      <input
        required type="tel" placeholder="Teléfono o WhatsApp"
        value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle}
      />
      <input
        required type="email" placeholder="Correo electrónico"
        value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
      />
      <textarea
        required placeholder="¿Qué necesitas? Describe brevemente tu caso"
        value={description} onChange={e => setDescription(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <button
        type="submit" disabled={submitting}
        style={{
          background: submitting ? '#a0b8a0' : '#2a7a2a', color: 'white',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Enviando...' : 'Enviar datos de contacto'}
      </button>
    </form>
  );
}

// ─── BUY SESSION BUTTON ──────────────────────────────────────────────────────

function BuySessionButton({ sessionId }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: 'documento', resumen: 'Sesión de elaboración de documento', sessionId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setLoading(false);
        alert('Error al crear el pago. Intenta de nuevo.');
      }
    } catch {
      setLoading(false);
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      style={{
        marginTop: 10, background: loading ? '#a0b8a0' : '#2a7a2a', color: 'white',
        border: 'none', borderRadius: 10, padding: '10px 16px',
        fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {loading ? '⏳ Redirigiendo...' : '📄 Comprar sesión de documento ($9.990)'}
    </button>
  );
}

// ─── WHATSAPP CTA ─────────────────────────────────────────────────────────────
// Shows when Juanita's response suggests the user needs a real lawyer.
// The phone number is read from NEXT_PUBLIC_WHATSAPP_NUMBER env var.

const WHATSAPP_TRIGGERS = [
  'necesitas un abogado',
  'necesitarás un abogado',
  'necesitas asesoría presencial',
  'te recomiendo consultar con un abogado',
  'deberías consultar con un abogado',
  'habla con un abogado',
  'busca un abogado',
  'acude a un abogado',
  'visita una clínica jurídica',
  'clínica jurídica',
  'corporación de asistencia judicial',
];

function WhatsAppCTA({ text }) {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!phone) return null;

  const lower = text.toLowerCase();
  const triggered = WHATSAPP_TRIGGERS.some(t => lower.includes(t));
  if (!triggered) return null;

  const waUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, vengo de Juanita La Legal y necesito asesoría en mi caso.')}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        marginTop: 10, padding: '9px 16px', borderRadius: 12,
        background: '#25D366', color: 'white', textDecoration: 'none',
        fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Continuar por WhatsApp
    </a>
  );
}

// ─── MESSAGE FEEDBACK (thumbs) ───────────────────────────────────────────────

function MessageFeedback({ msgId, sessionId, msgPreview }) {
  const [vote, setVote] = useState(null);       // null | 'up' | 'down'
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async (v, c) => {
    setSubmitted(true);
    try {
      await fetch('/api/message-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message_id: msgId,
          vote: v,
          comment: c?.trim() || undefined,
          message_preview: msgPreview,
        }),
      });
    } catch {
      // feedback is non-blocking
    }
  };

  if (submitted) {
    return (
      <div style={{ fontSize: 11, color: '#8a9a88', marginTop: 4, paddingLeft: 2 }}>
        ✓ Gracias — tu evaluación nos ayuda a mejorar
      </div>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* Thumbs up */}
        <button
          onClick={() => { setVote('up'); submit('up'); }}
          title="Buena respuesta"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 5px', borderRadius: 6, lineHeight: 1,
            opacity: vote === 'down' ? 0.3 : 1,
            transition: 'opacity 0.15s, background 0.15s',
            color: vote === 'up' ? '#2a7a2a' : '#a09888',
            fontSize: 14,
          }}
          aria-label="Buena respuesta"
        >👍</button>
        {/* Thumbs down */}
        <button
          onClick={() => { setVote('down'); setShowComment(true); }}
          title="Respuesta mejorable"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 5px', borderRadius: 6, lineHeight: 1,
            opacity: vote === 'up' ? 0.3 : 1,
            transition: 'opacity 0.15s, background 0.15s',
            color: vote === 'down' ? '#c03a1a' : '#a09888',
            fontSize: 14,
          }}
          aria-label="Respuesta mejorable"
        >👎</button>
      </div>

      {/* Comment box — solo si thumbs down */}
      {showComment && (
        <div style={{ marginTop: 6, animation: 'fadeUp 0.15s ease' }}>
          <div style={{ fontSize: 11, color: '#7a6e62', marginBottom: 4 }}>
            ¿Qué podría mejorar? (opcional)
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tu comentario nos ayuda a mejorar el servicio..."
            rows={2}
            autoFocus
            style={{
              width: '100%', border: '1px solid #d8cfc0', borderRadius: 8,
              padding: '6px 9px', fontSize: 12, color: '#2a2018',
              background: '#faf8f4', resize: 'none', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <button
              onClick={() => submit('down', comment)}
              style={{
                background: '#1a3a2a', color: 'white', border: 'none',
                borderRadius: 7, padding: '4px 12px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Enviar</button>
            <button
              onClick={() => { setShowComment(false); setVote(null); }}
              style={{
                background: 'none', color: '#8a7a68', border: '1px solid #d8cfc0',
                borderRadius: 7, padding: '4px 10px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────

function MessageBubble({ msg, topic, sessionId, onTermClick, activeTerm }) {
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
    WHATSAPP_TRIGGERS.some(t => lower.includes(t));

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isJuanita ? "row" : "row-reverse" }}>
      {isJuanita && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#c8e6c0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginTop: 2,
        }}>⚖️</div>
      )}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "10px 14px",
          background: isJuanita ? "white" : "#1a3a2a",
          color: isJuanita ? "#2a2018" : "#e8f5e2",
          borderRadius: isJuanita ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          fontSize: 14, lineHeight: 1.65,
          boxShadow: isJuanita ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
        }}>
          {isJuanita
            ? <JuanitaMessage text={msg.text} onTermClick={onTermClick} activeTerm={activeTerm} />
            : msg.text}
        </div>
        {showContactForm && <ContactForm topic={topic} sessionId={sessionId} />}
        {hasSessionOffer && <BuySessionButton sessionId={sessionId} />}
        {isJuanita && msg.text !== '...' && <WhatsAppCTA text={msg.text} />}
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

// ─── RATING MODAL ────────────────────────────────────────────────────────────

const STAR_COLOR = (n, hovered, selected) => {
  const active = hovered >= n || selected >= n;
  if (!active) return "#d8cfc0";
  if (n <= 2) return "#e05a3a";
  if (n === 3) return "#c8a040";
  return "#4a7a20";
};

function RatingModal({ sessionId, onClose }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, rating: selected, comment: comment.trim() || undefined }),
      });
    } catch {
      // no bloquear al usuario si falla
    }
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10, 26, 20, 0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      backdropFilter: "blur(3px)",
    }}>
      <div style={{
        background: "#faf8f4", borderRadius: 24,
        padding: "28px 24px", maxWidth: 380, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        animation: "fadeUp 0.2s ease",
      }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🙌</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: "#1a3a2a", marginBottom: 8 }}>
              ¡Gracias por tu evaluación!
            </div>
            <div style={{ fontSize: 14, color: "#6a5e50" }}>Nos ayuda a mejorar Juanita.</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚖️</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: "#1a3a2a", marginBottom: 6 }}>
                ¿Cómo te fue con Juanita?
              </div>
              <div style={{ fontSize: 13, color: "#8a7a68" }}>Tu opinión nos ayuda a mejorar</div>
            </div>

            {/* Estrellas */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setSelected(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px", lineHeight: 1,
                    transition: "transform 0.1s",
                    transform: hovered >= n || selected >= n ? "scale(1.15)" : "scale(1)",
                  }}
                  aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={STAR_COLOR(n, hovered, selected)} stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Textarea: aparece al seleccionar */}
            {selected > 0 && (
              <div style={{ marginBottom: 16, animation: "fadeUp 0.15s ease" }}>
                <textarea
                  placeholder="Cuéntanos tu experiencia... (opcional)"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", border: "1.5px solid #d8cfc0", borderRadius: 12,
                    padding: "10px 12px", fontSize: 13, color: "#2a2018",
                    background: "white", resize: "none", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5,
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                style={{
                  flex: 1, background: selected ? "#1a3a2a" : "#c0b8a8",
                  color: selected ? "#c8e6c0" : "#8a7a68",
                  border: "none", borderRadius: 12, padding: "12px",
                  fontSize: 14, fontWeight: 600,
                  cursor: selected && !submitting ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}
              >
                {submitting ? "Enviando..." : "Enviar evaluación"}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "1.5px solid #d8cfc0",
                  borderRadius: 12, padding: "12px 16px",
                  fontSize: 13, color: "#8a7a68", cursor: "pointer",
                }}
              >
                Saltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroSection({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1a3a2a 0%, #0a1a14 60%, #1a2a18 100%)",
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: "linear-gradient(135deg, #c8e6c0, #8fbc8f)",
          margin: "0 auto 28px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}>⚖️</div>

        <h1 style={{
          fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 600,
          color: "#f5f0e8", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.2,
        }}>Juanita La Legal</h1>

        <p style={{ fontSize: 18, color: "#8fbc8f", marginBottom: 6 }}>
          Te orientamos en buen chileno.
        </p>
        <p style={{ fontSize: 14, color: "rgba(245,240,232,0.5)", marginBottom: 40 }}>
          Primera orientación legal clara, rápida y pagable. $9.990 por consulta.
        </p>

        <button data-action="start" onClick={onStart} style={{
          background: "#c8a040", color: "white", border: "none",
          borderRadius: 16, padding: "14px 36px", fontSize: 16, fontWeight: 600,
          cursor: "pointer", boxShadow: "0 8px 24px rgba(200,160,64,0.35)",
          transition: "transform 0.15s",
        }}
          onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
          onMouseLeave={e => e.target.style.transform = "scale(1)"}
        >
          Iniciar consulta
        </button>

        <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(TOPIC_META).map(([k, m]) => (
            <span key={k} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "rgba(245,240,232,0.6)",
            }}>{m.emoji} {TOPIC_LABELS[k]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT WALL ────────────────────────────────────────────────────────────

function PaymentWall({ topic, resumen, sessionId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null); // { discount, label } | null
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const m = TOPIC_META[topic] || {};

  const BASE_PRICE = 9990;
  const finalPrice = promoApplied
    ? Math.round(BASE_PRICE * (1 - promoApplied.discount / 100))
    : BASE_PRICE;
  const isFree = finalPrice === 0;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);
    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ discount: data.discount, label: data.label });
      } else {
        setPromoError('Código no válido. Intenta con otro.');
      }
    } catch {
      setPromoError('Error al validar el código.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      if (isFree) {
        const grantRes = await fetch('/api/grant-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, promoCode: promoCode.trim().toUpperCase() }),
        });
        const grantData = await grantRes.json();
        if (!grantData.ok) {
          setLoading(false);
          alert('Error al activar el acceso. Intenta de nuevo.');
          return;
        }
        localStorage.setItem('juanita_session', sessionId);
        window.location.href = '/?paid=true';
        return;
      }
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: topic, resumen, sessionId, promoCode: promoCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setLoading(false);
        alert('Error al crear el pago. Intenta de nuevo.');
      }
    } catch {
      setLoading(false);
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  return (
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 16, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ fontSize: 36 }}>{m.emoji}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Tema detectado
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#2a2018", marginBottom: 3 }}>
            {TOPIC_LABELS[topic]}
          </div>
          <div style={{ fontSize: 13, color: "#6a5e50" }}>{resumen}</div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 18, padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a3a2a", marginBottom: 12 }}>
          🔓 Desbloquea tu consulta guiada
        </div>
        {["Orientación detallada sobre tus derechos", "Preguntas guiadas para ordenar tu caso", "Riesgos, opciones y próximos pasos concretos", "Derivación a instituciones y recursos de ayuda"].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "#4a7a20", fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: 13, color: "#3a3028" }}>{item}</span>
          </div>
        ))}

        <div style={{ background: "#f5f0e8", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0" }}>
          <span style={{ fontSize: 13, color: "#6a5e50" }}>Consulta completa · pago único</span>
          <div style={{ textAlign: "right" }}>
            {promoApplied && (
              <div style={{ fontSize: 12, color: "#a09080", textDecoration: "line-through" }}>
                ${BASE_PRICE.toLocaleString('es-CL')}
              </div>
            )}
            <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 700, color: isFree ? "#4a7a20" : "#1a3a2a" }}>
              {isFree ? "¡Gratis!" : `$${finalPrice.toLocaleString('es-CL')}`}
            </span>
            {promoApplied && (
              <div style={{ fontSize: 11, color: "#4a7a20", fontWeight: 600 }}>
                {promoApplied.label} aplicado ✓
              </div>
            )}
          </div>
        </div>

        {/* Promo code field */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              placeholder="¿Tienes un código de descuento?"
              disabled={!!promoApplied}
              style={{
                flex: 1, padding: "10px 12px", fontSize: 13, border: "1.5px solid #e0d8cc",
                borderRadius: 10, outline: "none", background: promoApplied ? "#f0f5e8" : "white",
                color: "#3a3028",
              }}
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !!promoApplied || !promoCode.trim()}
              style={{
                padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "none",
                borderRadius: 10, cursor: promoApplied || !promoCode.trim() ? "default" : "pointer",
                background: promoApplied ? "#4a7a20" : "#1a3a2a", color: "white",
                opacity: promoLoading ? 0.7 : 1,
              }}
            >
              {promoApplied ? "✓" : promoLoading ? "..." : "Aplicar"}
            </button>
          </div>
          {promoError && (
            <div style={{ fontSize: 12, color: "#c0392b", marginTop: 5 }}>{promoError}</div>
          )}
        </div>

        {!loading ? (
          <button onClick={handlePay} style={{
            width: "100%", background: isFree ? "#4a7a20" : "#009ee3", color: "white", border: "none",
            borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {isFree ? "🎉 Acceder gratis" : "💳 Pagar con Mercado Pago"}
          </button>
        ) : (
          <div style={{ textAlign: "center", color: "#009ee3", fontSize: 13, padding: "13px" }}>
            ⏳ {isFree ? "Activando acceso..." : "Redirigiendo a Mercado Pago..."}
          </div>
        )}

        <div style={{ fontSize: 11, color: "#a09080", textAlign: "center", marginTop: 8 }}>
          🔒 Pago seguro · Mercado Pago Chile · No guardamos datos de tarjeta
        </div>
      </div>

      <button onClick={onBack} style={{ background: "none", border: "none", color: "#8a7a68", fontSize: 13, cursor: "pointer" }}>
        ← Reescribir mi consulta
      </button>
    </div>
  );
}

// ─── CHAT SECTION ────────────────────────────────────────────────────────────

function ChatSection({ onRestart, initialPaid, initialSessionId }) {
  const [stage, setStage] = useState(initialPaid ? "resuming" : "input");
  const [messages, setMessages] = useState([{
    id: createId(), type: "juanita",
    text: "Hola, soy Juanita 👋 Cuéntame en buen chileno cuál es tu problema principal y te ayudo a ordenarlo. En esta consulta veremos un solo tema.\n\n*Esta orientación es de carácter general e informativo. No reemplaza a un abogado/a ni crea relación abogado-cliente.*",
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('juanita_hintSeen')) setShowTermHint(true);
  }, []);

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

    if (savedQuery) {
      sessionStorage.removeItem('juanita_query');
      setStage("chat");
      setMessages([{ id: createId(), type: "user", text: savedQuery }]);
      streamChatResponse(savedQuery, [], initialSessionId);
    } else {
      setStage("chat");
      setMessages([{
        id: createId(), type: "juanita",
        text: "¡Pago confirmado! 🎉 Cuéntame tu problema legal y te oriento paso a paso.",
      }]);
    }
  }, [initialPaid, initialSessionId]);

  const addMsg = (msg) => setMessages(prev => [...prev, { id: createId(), ...msg }]);

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
  const streamChatResponse = async (message, historyForApi, currentSessionId, imageBase64) => {
    setIsStreaming(true);
    const msgId = createId();
    setMessages(prev => [...prev, { id: msgId, type: 'juanita', text: '...' }]);
    let fullText = '';

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 2500;

    const isNetworkError = (err) =>
      !err.message || /failed to fetch|network error|load failed|networkerror/i.test(err.message);

    const attemptStream = async () => {
      const body = { sessionId: currentSessionId, message };
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
        const fd = new FormData();
        fd.append('audio', blob, mimeType === 'audio/webm' ? 'recording.webm' : 'recording.mp4');
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.text) {
            setEditableTranscript(data.text);
            setVoiceState('reviewing');
          } else {
            setVoiceState('idle');
          }
        } catch {
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

  const inputDisabled = timerExpired || isStreaming || stage === "closed" || stage === "classifying" || stage === "payment" || stage === "topic-confirm" || stage === "resuming";

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
            <div style={{ fontSize: 11, color: "#8fbc8f" }}>Orientación legal en buen chileno · $9.990</div>
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
        <div style={{ flex: 1, overflowY: "auto" }}>
          <PaymentWall
            topic={pendingTopic}
            resumen={classifyResumen}
            sessionId={sessionId}
            onBack={() => { setStage("input"); setMessages(prev => prev.slice(0, -1)); }}
          />
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
            style={{ height: "100%", overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Sugerencias solo al inicio */}
              {stage === "input" && messages.length === 1 && (
                <div>
                  <div style={{ fontSize: 11, color: "#8a7a68", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    Consultas frecuentes
                  </div>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} data-action="suggest" data-text={s} onClick={() => handleInitialSubmit(s)} style={{
                      display: "block", width: "100%", background: "white", border: "1px solid #e0d8c8",
                      borderRadius: 10, padding: "9px 13px", fontSize: 13, color: "#3a3028",
                      textAlign: "left", cursor: "pointer", marginBottom: 6,
                      fontFamily: "inherit",
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
                    Renovar sesión ($9.990)
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
                    flex: 1, border: "none", outline: "none", fontSize: 16, color: "#2a2018",
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
              <div style={{ fontSize: 11, color: "#a09080", textAlign: "center", marginTop: 6 }}>
                Orientación legal general e informativa · No reemplaza a un abogado/a · No constituye asesoría jurídica personalizada · No crea relación abogado-cliente
              </div>
              <div style={{ fontSize: 10, color: "#c0b8b0", textAlign: "center", marginTop: 2 }}>
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

// ─── TERMS SCREEN ────────────────────────────────────────────────────────────

const TYC_SECTIONS = [
  {
    heading: "⚠️ ADVERTENCIA IMPORTANTE — LEA ANTES DE CONTINUAR",
    warning: true,
    items: [
      "Este servicio NO constituye asesoría jurídica formal ni establece relación abogado-cliente.",
      "Las respuestas de Juanita La Legal son orientación general de carácter informativo.",
      "El usuario no debe actuar exclusivamente en base a la información recibida sin consultar a un abogado.",
      "Ante situaciones urgentes (violencia, plazos judiciales inminentes), consulte a un profesional de inmediato.",
    ],
  },
  {
    heading: "1. Identificación de las Partes",
    body: 'Los presentes Términos y Condiciones regulan el uso de la plataforma digital denominada Juanita La Legal (en adelante, "la Plataforma"). Al hacer clic en el botón "He leído y acepto los Términos y Condiciones" el usuario declara haber leído, entendido y aceptado íntegramente las condiciones aquí establecidas.',
  },
  {
    heading: "2. Naturaleza del Servicio",
    body: "Juanita La Legal es un servicio de orientación legal de carácter exclusivamente informativo y general, basado en inteligencia artificial. Su propósito es proporcionar al usuario una primera aproximación a su situación jurídica. Este servicio NO constituye: asesoría jurídica formal (art. 520 COT), patrocinio judicial, opinión jurídica vinculante, relación abogado-cliente, ni garantía de resultado legal. Las respuestas son producidas por un sistema de inteligencia artificial y no constituyen el ejercicio de la abogacía.",
  },
  {
    heading: "3. Limitaciones de la Información",
    body: "Toda orientación es de carácter general y no considera la totalidad de los antecedentes del caso concreto. La legislación chilena está sujeta a cambios frecuentes. El operador no garantiza exactitud, completitud ni aplicabilidad al caso específico del usuario. Se debe consultar a un abogado obligatoriamente ante: plazos judiciales próximos, violencia intrafamiliar, notificaciones judiciales recibidas, montos significativos, procesos penales, decisiones irreversibles y plazos migratorios.",
  },
  {
    heading: "4. Precio y Condiciones",
    body: "El valor es de $9.990 (pesos chilenos) por sesión, pagaderos a través de los medios habilitados. El pago es previo al acceso. Una vez utilizado el servicio, no procede devolución salvo falla técnica imputable al operador. Incluye una sesión sobre un único tema legal. Consultas sobre temas adicionales requieren nuevo pago.",
  },
  {
    heading: "5. Tratamiento de Datos Personales",
    body: "El tratamiento se rige por la Ley N° 19.628. Se recopilan: contenido de consultas, datos de uso y sesión. Los datos se usan para prestar el servicio y mejorar su calidad. Las consultas se almacenan por máximo 24 horas. Los pagos son procesados por Mercado Pago S.A. y no son almacenados por el operador. Los datos no se comparten con terceros salvo Anthropic Inc. (procesamiento de IA) y Mercado Pago S.A. El usuario puede solicitar acceso, rectificación o cancelación de sus datos.",
  },
  {
    heading: "6. Conducta del Usuario",
    body: "El usuario se compromete a: proporcionar información veraz; no usar el servicio para fines ilegales; no intentar vulnerar el funcionamiento técnico de la Plataforma; no reproducir ni comercializar las respuestas obtenidas sin autorización; y entender que la orientación es general y no puede ser invocada como opinión jurídica profesional.",
  },
  {
    heading: "7. Exención y Limitación de Responsabilidad",
    body: "El operador no será responsable por: daños derivados del uso de la Plataforma; decisiones adoptadas por el usuario; inexactitud de la información; interrupciones del servicio por causas técnicas ajenas al operador; ni acceso no autorizado a los datos del usuario por terceros, salvo negligencia grave del operador. La responsabilidad máxima no excederá el monto pagado por el servicio.",
  },
  {
    heading: "8. Propiedad Intelectual",
    body: "El nombre Juanita La Legal, el diseño, textos y logotipos son de propiedad del operador y están protegidos por la Ley N° 17.336. Las respuestas generadas son de uso exclusivo del usuario para orientación personal y no pueden ser reproducidas ni comercializadas sin autorización.",
  },
  {
    heading: "9. Modificaciones",
    body: "El operador se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones serán publicadas en la Plataforma. El uso continuado del servicio constituirá aceptación de los nuevos términos.",
  },
  {
    heading: "10. Ley Aplicable y Jurisdicción",
    body: "Los presentes Términos se rigen por las leyes de la República de Chile. Para cualquier controversia, las partes se someten a los Tribunales Ordinarios de Justicia de la ciudad de Santiago.",
  },
];

function TermsScreen({ onAccept }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToBottom(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf8f4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
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
        maxHeight: '90vh',
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

        {/* Scroll hint */}
        {!scrolledToBottom && (
          <div style={{
            background: '#fffbef',
            borderBottom: '1px solid #f0e8b0',
            padding: '8px 28px',
            fontSize: 12,
            color: '#8a6a10',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>👇</span>
            <span>Lee hasta el final para habilitar el botón de aceptación</span>
          </div>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}
        >
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
          {/* End marker */}
          <div style={{ textAlign: 'center', padding: '12px 0 4px', fontSize: 12, color: '#b0a090' }}>
            — Fin de los Términos y Condiciones —
          </div>
        </div>

        {/* Footer with accept button */}
        <div style={{
          padding: '16px 28px 20px',
          borderTop: '1px solid #f0ebe3',
          background: scrolledToBottom ? '#faf8f4' : '#f5f3ef',
          transition: 'background 0.3s',
        }}>
          {!scrolledToBottom && (
            <p style={{ fontSize: 12, color: '#9a8a78', textAlign: 'center', marginBottom: 10 }}>
              Desplázate hasta el final del documento para continuar
            </p>
          )}
          <button
            onClick={() => {
              if (!scrolledToBottom) return;
              localStorage.setItem('juanita_terms_accepted', '1');
              onAccept();
            }}
            disabled={!scrolledToBottom}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 10,
              border: 'none',
              background: scrolledToBottom ? '#c44a12' : '#d8cfc0',
              color: scrolledToBottom ? '#fff' : '#9a8a78',
              fontSize: 14,
              fontWeight: 600,
              cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
              transition: 'background 0.3s, color 0.3s',
              fontFamily: 'inherit',
            }}
          >
            He leído y acepto los Términos y Condiciones
          </button>
          <p style={{ fontSize: 11, color: '#b0a090', textAlign: 'center', marginTop: 8 }}>
            Al aceptar, declaras haber leído y comprendido íntegramente estos términos.
          </p>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const b = document.querySelector('[data-action="start"]');
    if (b) b.onclick = () => setScreen('chat');
  }, [screen]);

  const handlePaid = () => {
    const alreadyAccepted = typeof window !== 'undefined' && localStorage.getItem('juanita_terms_accepted') === '1';
    setScreen(alreadyAccepted ? "chat-paid" : "terms");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@300;600&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Instrument Sans', system-ui, sans-serif; background: #faf8f4; }
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

      {screen === "hero" && <HeroSection onStart={() => setScreen("chat")} />}
      {screen === "chat" && <ChatSection onRestart={() => setScreen("hero")} initialPaid={false} />}
      {screen === "terms" && <TermsScreen onAccept={() => setScreen("chat-paid")} />}
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
