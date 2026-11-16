// ─── CATÁLOGO B2B — ÚNICA FUENTE DE VERDAD ────────────────────────────────
// Precios, campos del formulario, plantillas y plazos de cada entregable.
// Para cambiar un precio o agregar un entregable, editar SOLO este archivo.
//
// Nota: el resto del codebase es JavaScript (.js/.jsx), por eso este archivo
// es .js (el prompt pedía .ts; es trivial renombrarlo si prefieres TS).

export const CATALOGO = [
  {
    id: 'pack-ley-karin',
    nombre: 'Pack Ley Karin',
    emoji: '🛡️',
    descripcion:
      'Protocolo de prevención del acoso laboral y sexual + procedimiento interno de investigación, listos para tu empresa. Cumples la Ley 21.643 y proteges a tu equipo.',
    precio: 49990, // CLP — PROVISORIO
    plazo: '48 horas hábiles',
    plantilla: 'pack-ley-karin',
    campos: [
      { id: 'empresa', label: 'Nombre de la empresa', tipo: 'text', requerido: true },
      { id: 'rut_empresa', label: 'RUT de la empresa', tipo: 'text', requerido: true },
      { id: 'numero_trabajadores', label: '¿Cuántos trabajadores tienes?', tipo: 'number', requerido: true },
      { id: 'tiene_reglamento', label: '¿Ya tienes reglamento interno?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
      { id: 'nombre_contacto', label: 'Nombre de quien responde el reclamo', tipo: 'text', requerido: true },
      { id: 'cargo_contacto', label: 'Cargo de quien responde el reclamo', tipo: 'text', requerido: true },
    ],
  },
  {
    id: 'contrato-trabajo',
    nombre: 'Contrato de trabajo',
    emoji: '📝',
    descripcion:
      'Contrato de trabajo por escrito, claro y a la medida de tu negocio. Evita multas y deja todo amarrado desde el primer día.',
    precio: 29990, // CLP — PROVISORIO
    plazo: '24 horas hábiles',
    plantilla: 'contrato-trabajo',
    campos: [
      { id: 'razon_social', label: 'Razón social del empleador', tipo: 'text', requerido: true },
      { id: 'rut_empleador', label: 'RUT del empleador', tipo: 'text', requerido: true },
      { id: 'nombre_trabajador', label: 'Nombre del trabajador', tipo: 'text', requerido: true },
      { id: 'rut_trabajador', label: 'RUT del trabajador', tipo: 'text', requerido: true },
      { id: 'cargo', label: 'Cargo o función', tipo: 'text', requerido: true },
      { id: 'sueldo', label: 'Sueldo líquido mensual (CLP)', tipo: 'number', requerido: true },
      { id: 'jornada', label: 'Tipo de jornada', tipo: 'select', opciones: ['Completa', 'Parcial'], requerido: true },
      { id: 'fecha_inicio', label: 'Fecha de inicio', tipo: 'date', requerido: true },
      { id: 'tipo_contrato', label: 'Tipo de contrato', tipo: 'select', opciones: ['Indefinido', 'Plazo fijo', 'Por obra o faena'], requerido: true },
    ],
  },
  {
    id: 'despido-finiquito',
    nombre: 'Carta de despido + finiquito',
    emoji: '✉️',
    descripcion:
      'Carta de aviso de término y finiquito correctamente redactados, para que el despido quede bien hecho y sin riesgo de demanda.',
    precio: 24990, // CLP — PROVISORIO
    plazo: '24 horas hábiles',
    plantilla: 'despido-finiquito',
    campos: [
      { id: 'nombre_trabajador', label: 'Nombre del trabajador', tipo: 'text', requerido: true },
      { id: 'rut_trabajador', label: 'RUT del trabajador', tipo: 'text', requerido: true },
      { id: 'cargo', label: 'Cargo', tipo: 'text', requerido: true },
      { id: 'fecha_inicio', label: 'Fecha de inicio del contrato', tipo: 'date', requerido: true },
      { id: 'fecha_termino', label: 'Fecha de término', tipo: 'date', requerido: true },
      { id: 'causal', label: 'Causal de despido', tipo: 'select', opciones: ['Necesidades de la empresa', 'Falta grave', 'Mutuo acuerdo', 'Otra'], requerido: true },
      { id: 'sueldo_base', label: 'Sueldo base mensual (CLP)', tipo: 'number', requerido: true },
      { id: 'deudas_pendientes', label: '¿El trabajador tiene deudas pendientes con la empresa?', tipo: 'select', opciones: ['No', 'Sí'], requerido: true },
    ],
  },
  {
    id: 'carta-cobranza',
    nombre: 'Carta de cobranza',
    emoji: '💸',
    descripcion:
      'Carta formal de cobro a un cliente moroso, con tono firme y correcto, para recuperar lo que te deben sin quemar la relación.',
    precio: 19990, // CLP — PROVISORIO
    plazo: '24 horas hábiles',
    plantilla: 'carta-cobranza',
    campos: [
      { id: 'nombre_empresa', label: 'Nombre de tu empresa', tipo: 'text', requerido: true },
      { id: 'rut_empresa', label: 'RUT de tu empresa', tipo: 'text', requerido: true },
      { id: 'nombre_deudor', label: 'Nombre del cliente que debe', tipo: 'text', requerido: true },
      { id: 'rut_deudor', label: 'RUT del cliente que debe', tipo: 'text', requerido: false },
      { id: 'monto_deuda', label: 'Monto de la deuda (CLP)', tipo: 'number', requerido: true },
      { id: 'concepto', label: '¿Por qué te debe? (concepto)', tipo: 'text', requerido: true },
      { id: 'fecha_vencimiento', label: 'Fecha en que debió pagar', tipo: 'date', requerido: true },
      { id: 'intentos_previos', label: '¿Ya le cobraste antes? Cuéntanos cómo (opcional)', tipo: 'textarea', requerido: false },
    ],
  },
];

export const B2B_COPY = {
  heroTitulo: 'Documentos legales para tu pyme, listos y revisados por abogado',
  heroSubtitulo:
    'La IA redacta, un abogado revisa y firma. Tú te preocupas de tu negocio, nosotros de los papeles.',
  propuestaValor: 'Documento listo en 24–48 horas hábiles · Precio fijo · Revisado por abogado',
  cta: 'Quiero este documento',
  notaPrecios: 'Los precios son de referencia y pueden cambiar.',
};
