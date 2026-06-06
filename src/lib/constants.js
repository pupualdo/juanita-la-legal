// ─── CONSTANTES ──────────────────────────────────────────────────────────────

export const TOPIC_LABELS = {
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

export const TOPIC_META = {
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

export const TOPIC_KEYWORDS = {
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

export const TOPIC_DETAILS = {
  familia: {
    incluye: [
      "Pensión de alimentos: cómo pedirla, calcularla o defenderse de un cobro injusto",
      "Visitas, régimen comunicacional y cuidado personal de hijos",
      "Divorcio (de común acuerdo o unilateral) y compensación económica",
      "Violencia intrafamiliar (VIF) y medidas de protección",
    ],
    ejemplos: [
      "Mi ex no me pasa la pensión hace meses, ¿qué hago?",
      "Quiero divorciarme y tenemos hijos chicos",
      "Mi pareja me agredió, necesito una orden de alejamiento",
    ],
  },
  laboral: {
    incluye: [
      "Despidos: cuándo son injustificados y qué indemnización corresponde",
      "Finiquitos, sueldos impagos, cotizaciones y liquidaciones",
      "Renuncia, contrato de trabajo y horas extras",
      "Acoso laboral y autodespido",
    ],
    ejemplos: [
      "Me despidieron sin causa y no me pagan finiquito",
      "Mi jefe no paga cotizaciones hace meses",
      "Tengo dudas con mi contrato y mis derechos",
    ],
  },
  arriendo: {
    incluye: [
      "Garantía no devuelta, deudas de arriendo y cuentas",
      "Desalojo, término de contrato y plazos",
      "Daños al inmueble y responsabilidades",
      "Contratos verbales o sin escritura",
    ],
    ejemplos: [
      "Mi arrendador no me devuelve la garantía",
      "El arrendatario no paga y no quiere irse",
      "Quiero terminar mi contrato anticipadamente",
    ],
  },
  herencia: {
    incluye: [
      "Posesión efectiva: cómo iniciarla y qué se necesita",
      "Testamentos, herederos y reparto de bienes",
      "Conflictos entre herederos y bienes en disputa",
      "Deudas heredadas y aceptación con beneficio de inventario",
    ],
    ejemplos: [
      "Falleció un familiar, ¿cómo hacemos la posesión efectiva?",
      "Hay herencia y los herederos no se ponen de acuerdo",
      "Aparecieron deudas del fallecido, ¿las heredo?",
    ],
  },
  migracion: {
    incluye: [
      "Visas, permanencia definitiva y nacionalización",
      "Regularización migratoria y plazos vencidos",
      "Rechazos previos, recursos y reconsideraciones",
      "Trámites en Extranjería y SERMIG",
    ],
    ejemplos: [
      "Tengo visa vencida, ¿cómo regularizo mi situación?",
      "Me rechazaron la permanencia, ¿qué puedo hacer?",
      "Quiero traer a mi familia a Chile",
    ],
  },
  terrenos: {
    incluye: [
      "Regularización de títulos y posesión efectiva de inmuebles",
      "Deslindes, servidumbres y conflictos vecinales",
      "Ocupación ilegal y desalojo",
      "Inscripción en el Conservador de Bienes Raíces",
    ],
    ejemplos: [
      "Tengo un terreno sin escritura, ¿cómo lo regularizo?",
      "Hay alguien ocupando mi terreno",
      "Disputa de deslindes con el vecino",
    ],
  },
  deudas: {
    incluye: [
      "Salir de Dicom y boletín comercial",
      "Renegociación, insolvencia y Ley 20.720 (quiebra de personas)",
      "Embargos, remates y cobranzas judiciales",
      "Defensa frente a cobros injustos o prescritos",
    ],
    ejemplos: [
      "Estoy en Dicom y quiero salir, ¿qué opciones tengo?",
      "Me llegó una demanda de cobranza, ¿qué hago?",
      "Quiero renegociar mis deudas o ir a insolvencia",
    ],
  },
  empresas: {
    incluye: [
      "Constituir empresa: SpA, EIRL, Ltda. y sociedades en un día",
      "Inicio de actividades en SII y patente municipal",
      "Facturación, boletas y obligaciones tributarias básicas",
      "Pacto de socios y temas societarios",
    ],
    ejemplos: [
      "Quiero crear una empresa o pyme en Chile",
      "Necesito iniciar actividades en el SII",
      "Voy a abrir negocio con un socio, ¿qué firmamos?",
    ],
  },
  contratos: {
    incluye: [
      "Incumplimiento de contratos y reclamos",
      "Garantía de productos y derechos del consumidor (SERNAC)",
      "Pagarés, letras y documentos de cobro",
      "Contratos con proveedores y servicios",
    ],
    ejemplos: [
      "Me vendieron un producto malo y la empresa no responde",
      "Firmé un contrato y la otra parte no cumple",
      "Me cobran un pagaré que no reconozco",
    ],
  },
  otros: {
    incluye: [
      "Cualquier consulta legal que no encaje en los temas anteriores",
      "Orientación sobre derechos y trámites en general",
      "A qué institución dirigirte según tu caso",
    ],
    ejemplos: [
      "Tengo una duda legal y no sé en qué área cae",
      "¿A dónde voy con este problema?",
    ],
  },
};

export const TOPIC_NO_INCLUYE = "Juanita orienta — no representa en tribunales ni firma documentos por ti. Si tu caso necesita un abogado/a, te decimos claramente y te indicamos a dónde acudir (clínicas jurídicas universitarias, Corporación de Asistencia Judicial, etc.).";

export const QUESTION_SETS = {
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

export const DISCLAIMER = "Esta es orientación legal de carácter general e informativo. No constituye asesoría jurídica personalizada, no reemplaza a un abogado/a y no crea relación abogado-cliente. Cada situación tiene particularidades propias — la información entregada es referencial y la decisión final debe evaluarse con un profesional según tu caso concreto.";

export const SUGGESTIONS = [
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

export const createId = () => Math.random().toString(36).slice(2, 10);

export const normalizeText = (v) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const buildFinalAnswer = (topic) => ({
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
// ─── WHATSAPP CTA ─────────────────────────────────────────────────────────────
// Shows when Juanita's response suggests the user needs a real lawyer.
// The phone number is read from NEXT_PUBLIC_WHATSAPP_NUMBER env var.

export const WHATSAPP_TRIGGERS = [
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

// Triggers for the contact form — only fires for complex documents that require
// professional drafting. Uses the exact phrase from the system prompt for
// complex documents so it doesn't activate on routine "consult a lawyer" closings.
export const CONTACT_FORM_TRIGGERS = [
  'este tipo de documento requiere un trabajo más especializado',
];


// ─── TYC SECTIONS ────────────────────────────────────────────────────────────
export const TYC_SECTIONS = [
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

// ─── LEGAL TERMS DICTIONARY ──────────────────────────────────────────────────
export const LEGAL_TERMS = {
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
