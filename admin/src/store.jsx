// App-wide state. Today it is seeded from mock data; later each slice loads from the orchestrator API.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createMock } from './data/mock.js';
import { stamp } from './lib/format.js';

const StoreContext = createContext(null);
const WARM_ENTRIES = 127; // FAQ questions + paraphrases pre-answered after a change

export function StoreProvider({ children }) {
  const [seed] = useState(createMock);
  const [kbVersion, setKbVersion] = useState(seed.kb.version);
  const [documents, setDocuments] = useState(seed.documents);
  const [chunks, setChunks] = useState(seed.chunks);
  const [providers, setProviders] = useState(seed.providers);
  const [settings, setSettings] = useState(seed.settings);
  const [cache, setCache] = useState(seed.cache);
  const [changeLog, setChangeLog] = useState(seed.changeLog);
  const [evalReport, setEvalReport] = useState(seed.evalReport);
  const current = useRef(null);
  current.current = { kbVersion, cache };

  const logChange = useCallback((entry) => setChangeLog((log) => [entry, ...log]), []);

  // Any change to what live calls can search (publish, unpublish, delete, re-index) creates a new
  // knowledge-base version. Cached answers are keyed by version, so all entries from the old one are cleared.
  const applyKbChange = useCallback((what) => {
    const { kbVersion: from, cache: c } = current.current;
    const to = from + 1;
    setKbVersion(to);
    setCache({ ...c, entries: 0, kbVersion: to, lastCleared: stamp() });
    logChange({ at: stamp(), who: seed.user.email, kind: 'Knowledge', from: `KB v${from}`, to: `KB v${to}`, note: `${what} · ${c.entries.toLocaleString('en-IN')} cached answers from v${from} cleared` });
    return { from, to, cleared: c.entries };
  }, [logChange, seed.user.email]);

  const clearCache = useCallback((why = 'Cleared manually') => {
    const c = current.current.cache;
    setCache({ ...c, entries: 0, lastCleared: stamp() });
    logChange({ at: stamp(), who: seed.user.email, kind: 'Cache', from: `${c.entries.toLocaleString('en-IN')} entries`, to: '0 entries', note: why });
    return c.entries;
  }, [logChange, seed.user.email]);

  const warmCache = useCallback(() => {
    const { cache: c, kbVersion: v } = current.current;
    setCache({ ...c, entries: c.entries + WARM_ENTRIES });
    logChange({ at: stamp(), who: seed.user.email, kind: 'Cache', from: `${c.entries.toLocaleString('en-IN')} entries`, to: `${(c.entries + WARM_ENTRIES).toLocaleString('en-IN')} entries`, note: `Pre-warmed from FAQs for KB v${v}` });
    return WARM_ENTRIES;
  }, [logChange, seed.user.email]);

  const value = useMemo(() => ({
    ...seed, kb: { ...seed.kb, version: kbVersion },
    documents, setDocuments, chunks, setChunks, applyKbChange,
    providers, setProviders, settings, setSettings, cache, setCache, clearCache, warmCache, changeLog, logChange,
    evalReport, setEvalReport,
  }), [seed, kbVersion, documents, chunks, applyKbChange, providers, settings, cache, clearCache, warmCache, changeLog, logChange, evalReport]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
