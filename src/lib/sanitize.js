/**
 * Filtro post-proceso: reemplaza voseo argentino por formas chilenas.
 * Claude ocasionalmente (~3%) usa voseo a pesar de las instrucciones.
 */

const VOSEO_MAP = {
  'tenés': 'tienes',
  'podés': 'puedes',
  'probás': 'pruebas',
  'necesitás': 'necesitas',
  'querés': 'quieres',
  'sabés': 'sabes',
  'decís': 'dices',
  'hacés': 'haces',
  'ponés': 'pones',
  'salís': 'sales',
  'venís': 'vienes',
  'andás': 'andas',
  'pensás': 'piensas',
  'contás': 'cuentas',
  'recordás': 'recuerdas',
  'empezás': 'empiezas',
  'sentís': 'sientes',
  'pedís': 'pides',
  'seguís': 'sigues',
  'conseguís': 'consigues',
  'preferís': 'prefieres',
  'sos': 'eres',
  'vos': 'tú',
};

// Compilar regex global para reemplazar todas las apariciones
const VOSEO_REGEX = new RegExp(
  '\\b(' + Object.keys(VOSEO_MAP).join('|') + ')\\b',
  'gi'
);

/**
 * Reemplaza cualquier voseo argentino en el texto por su equivalente chileno.
 */
export function sanitizeVoseo(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(VOSEO_REGEX, (match) => {
    const replacement = VOSEO_MAP[match.toLowerCase()];
    // Preservar mayúscula inicial si el original la tenía
    if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}
