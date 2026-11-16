// ─── Carga de plantillas de documentos ───────────────────────────────────────
// Lee los .md de src/templates/ con fs. En Vercel serverless, estos archivos
// se incluyen vía outputFileTracingIncludes en next.config.ts.

import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = path.join(process.cwd(), 'src', 'templates');

export function getTemplate(id) {
  if (!id || !/^[a-z0-9-]+$/.test(id)) return null;
  try {
    const file = path.join(TEMPLATE_DIR, `${id}.md`);
    if (!fs.existsSync(file)) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

// Checklist de revisión por tipo de documento (para el revisor IA)
export const REVISION_CHECKLIST = {
  'pack-ley-karin': [
    'Incluye protocolo de prevención y procedimiento de investigación',
    'Todos los campos de la empresa están completos (nombre, RUT, responsable)',
    'No quedan placeholders {{...}} sin reemplazar',
  ],
  'contrato-trabajo': [
    'Identifica empleador y trabajador (RUT de ambos)',
    'Cargo, remuneración, jornada y fecha de inicio completos',
    'Tipo de contrato coherente con el plazo',
    'No quedan placeholders {{...}} sin reemplazar',
  ],
  'despido-finiquito': [
    'Carta de aviso con causal y fechas de inicio/término',
    'Finiquito con desglose de pagos',
    'No quedan placeholders {{...}} sin reemplazar',
  ],
  'carta-cobranza': [
    'Deudor identificado (nombre, RUT si aplica)',
    'Monto y concepto de la deuda completos',
    'Fecha de vencimiento presente',
    'No quedan placeholders {{...}} sin reemplazar',
  ],
};

export function getChecklist(id) {
  return REVISION_CHECKLIST[id] || ['No quedan placeholders {{...}} sin reemplazar'];
}
