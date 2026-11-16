// ─── DIAGNÓSTICO DE CUMPLIMIENTO LABORAL (B2B) ──────────────────────────────
// Preguntas y reglas de evaluación. 100% determinista: no usa IA, es lógica
// de negocio (qué le falta según lo que responde). Rápido y sin costo.

export const DIAGNOSTICO_PREGUNTAS = [
  { id: 'num_trabajadores', pregunta: '¿Cuántos trabajadores tiene tu empresa hoy?', tipo: 'number', requerido: true },
  { id: 'protocolo_karin', pregunta: '¿Tienes un protocolo de prevención del acoso laboral y sexual (Ley Karin)?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
  { id: 'reglamento_interno', pregunta: '¿Tienes reglamento interno de orden, higiene y seguridad?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
  { id: 'contratos_escritos', pregunta: '¿Todos tus trabajadores tienen contrato por escrito?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
  { id: 'registro_jornada', pregunta: '¿Llevas un registro de jornada o libro de asistencia?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
  { id: 'despido_sin_carta', pregunta: 'En el último año, ¿despediste a alguien sin entregar carta formal?', tipo: 'select', opciones: ['No', 'Sí'], requerido: true },
  { id: 'clientes_morosos', pregunta: '¿Tienes clientes que te deben plata hace más de 30 días?', tipo: 'select', opciones: ['No', 'Sí'], requerido: true },
];

// Cada carencia: qué le falta, por qué importa, y qué entregable lo resuelve (si hay).
export function evaluarDiagnostico(respuestas = {}) {
  const num = parseInt(respuestas.num_trabajadores, 10) || 0;
  const carencias = [];
  const entregables = []; // ids del catálogo, sin duplicados

  const pushEntregable = (id) => {
    if (!entregables.includes(id)) entregables.push(id);
  };

  if (respuestas.protocolo_karin === 'No') {
    carencias.push({
      titulo: 'No tienes protocolo Ley Karin',
      detalle:
        'Desde la Ley 21.643, toda empresa con trabajadores debe contar con un protocolo de prevención del acoso laboral y sexual, y un procedimiento interno de investigación. Sin esto te expones a multas y demandas.',
      entregable: 'pack-ley-karin',
    });
    pushEntregable('pack-ley-karin');
  }

  if (respuestas.contratos_escritos === 'No') {
    carencias.push({
      titulo: 'Trabajadores sin contrato por escrito',
      detalle:
        'El contrato debe escriturarse dentro de los primeros 15 días (5 si es por obra o plazo fijo). Sin contrato escrito, la ley presume que las condiciones son las que declara el trabajador, y arriesgas multas de la Inspección del Trabajo.',
      entregable: 'contrato-trabajo',
    });
    pushEntregable('contrato-trabajo');
  }

  if (respuestas.despido_sin_carta === 'Sí') {
    carencias.push({
      titulo: 'Despidos sin carta formal',
      detalle:
        'El despido exige una carta con la causal legal y el aviso previo correspondiente. Si no se entrega, el despido se presume injustificado y puedes terminar pagando indemnizaciones mayores.',
      entregable: 'despido-finiquito',
    });
    pushEntregable('despido-finiquito');
  }

  if (respuestas.clientes_morosos === 'Sí') {
    carencias.push({
      titulo: 'Clientes morosos sin cobro formal',
      detalle:
        'Una carta de cobranza formal es el primer paso para recuperar lo que te deben y dejar constancia antes de cualquier acción legal. Mientras más esperas, más difícil es cobrar.',
      entregable: 'carta-cobranza',
    });
    pushEntregable('carta-cobranza');
  }

  // Carencias que hoy no tienen un entregable específico en el catálogo
  if (num >= 10 && respuestas.reglamento_interno === 'No') {
    carencias.push({
      titulo: 'Falta reglamento interno',
      detalle:
        'Con 10 o más trabajadores, el reglamento interno de orden, higiene y seguridad es obligatorio. Hoy el catálogo no lo incluye, pero podemos ayudarte con una consulta.',
      entregable: null,
    });
  }

  if (respuestas.registro_jornada === 'No') {
    carencias.push({
      titulo: 'Sin registro de jornada',
      detalle:
        'Llevar registro de asistencia y jornada es obligatorio y te protege ante reclamos por horas extra. Es una medida simple que evita problemas mayores.',
      entregable: null,
    });
  }

  const cumplido =
    carencias.length === 0
      ? 'Tu empresa está al día en lo básico. Igual te recomendamos revisar periódicamente tus documentos laborales.'
      : null;

  return { carencias, entregables, cumplido, num_trabajadores: num };
}
