/**
 * LeyChile client — consulta el corpus jurídico chileno.
 *
 * API: https://leyes.pisanvs.cl/llms.txt
 * Endpoints usados:
 *   /buscar?q={query}           → búsqueda HTML
 *   /api/idx/commits/{idNorma}   → metadatos + versiones (JSON)
 */

const BASE = 'https://leyes.pisanvs.cl';

/**
 * Busca leyes chilenas por query.
 */
async function searchLaws(query) {
  const url = `${BASE}/buscar?q=${encodeURIComponent(query.slice(0, 200))}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'text/html' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Extraer /norma/{id}/{slug}#art-art-{num}
    const matches = [...html.matchAll(/href="\/norma\/(\d+)\/([^"]+?)(?:#art-([^"]+))?"/g)];
    const seen = new Set();
    const results = [];
    for (const [, id, slug, artRef] of matches) {
      if (seen.has(id)) continue;
      seen.add(id);
      results.push({ idNorma: id, slug, articleRef: artRef || null });
    }
    return results.slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Obtiene metadatos JSON de una norma.
 */
async function getLawMeta(idNorma) {
  const url = `${BASE}/api/idx/commits/${idNorma}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Extrae el tipo y número de una ley para generar la URL canónica.
 */
function parseMeta(meta) {
  if (!meta?.norma) return null;
  const n = meta.norma;
  return {
    idNorma: n.id_norma,
    tipo: n.tipo,
    numero: n.numero,
    titulo: n.titulo,
    organismo: n.organismo,
    fechaPublicacion: n.fecha_publicacion,
    url: `${BASE}/norma/${n.id_norma}/${n.titulo?.toLowerCase().replace(/\s+/g, '-').slice(0, 100) || 'ley'}`,
    versiones: (meta.commits || []).map(c => ({
      fecha: c.date,
      descripcion: c.subject,
    })),
  };
}

/**
 * Función principal para Juanita:
 * Busca leyes relevantes y devuelve contexto estructurado.
 */
export async function getLegalContext(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return '';

  const msg = userMessage.trim();
  if (msg.length < 20) return '';

  try {
    const results = await searchLaws(msg);
    if (!results.length) return '';

    // Obtener metadatos de las 2 más relevantes
    const metas = [];
    for (const r of results.slice(0, 2)) {
      const meta = await getLawMeta(r.idNorma);
      if (meta) {
        const parsed = parseMeta(meta);
        if (parsed) metas.push(parsed);
      }
    }
    if (!metas.length) return '';

    // Construir contexto para Claude
    let ctx = '## 📜 Fuente legal vigente (LeyChile — leyes.pisanvs.cl)\n\n';
    for (const m of metas) {
      ctx += `### ${m.tipo.toUpperCase()} N°${m.numero}: ${m.titulo}\n`;
      ctx += `- Organismo: ${m.organismo}\n`;
      ctx += `- Publicación: ${m.fechaPublicacion}\n`;
      ctx += `- URL: ${m.url}\n`;
      if (m.versiones.length > 0) {
        ctx += `- Última modificación: ${m.versiones[0].fecha} — ${m.versiones[0].descripcion}\n`;
      }
      ctx += '\n';
    }
    ctx += 'Usa esta información para citar las leyes correctas en tu respuesta. ' +
          'Si necesitas el texto exacto de un artículo, indícaselo al usuario con el link.';
    return ctx;
  } catch {
    return '';
  }
}
