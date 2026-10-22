// Keyword overlap stands in for hybrid search + rerank until the backend exists.
// \p{M} keeps Indic vowel signs inside words, so Telugu, Malayalam and Hindi tokenise correctly.
const STOP = new Set('the a an is are to of for and or in on what which how do i my me be can with by at it this that'.split(' '));
const tokens = (s) => s.toLowerCase().match(/[\p{L}\p{M}\p{N}₹]+/gu)?.filter((w) => !STOP.has(w) && w.length > 1) || [];

// Returns the top passages for a question, best first: [{ doc, chunk, score }].
export function retrieve(question, documents, chunks, { audience = 'public', topK = 4 } = {}) {
  const qt = tokens(question);
  const hits = [];
  documents
    .filter((d) => d.status === 'published' && (d.audience === 'public' || (audience === 'internal' && d.audience === 'internal')))
    .forEach((doc) => (chunks[doc.id] || []).forEach((chunk) => {
      const ct = tokens(`${chunk.text} ${chunk.section}`);
      const overlap = qt.filter((w) => ct.some((x) => x.startsWith(w.slice(0, 5)))).length;
      if (overlap) hits.push({ doc, chunk, score: Math.min(0.99, 0.42 + overlap / (qt.length + 1)) });
    }));
  return hits.sort((a, b) => b.score - a.score).slice(0, topK);
}

export const MIN_CONFIDENCE = 0.55;
