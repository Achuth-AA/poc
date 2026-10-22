// Models & voice: an AI Studio-style playground on the left and "Run settings" on the right.
// Every setting is a dropdown or slider; Save applies them to new calls and records each change.
import { useEffect, useMemo, useRef, useState } from 'react';
import Badge from '../components/Badge.jsx';
import { Stack } from '../components/charts.jsx';
import { useToast } from '../components/Toast.jsx';
import { stamp } from '../lib/format.js';
import { MIN_CONFIDENCE, retrieve } from '../lib/retrieve.js';
import { useStore } from '../store.jsx';
import Icon from '../components/Icon.jsx';

const LANGS = [['auto', 'Auto-detect'], ['en', 'English'], ['hi', 'हिन्दी · Hindi'], ['te', 'తెలుగు · Telugu'], ['ml', 'മലയാളം · Malayalam']];
const SUGGESTIONS = ['Is a DigiLocker document valid as the original?', 'How do I check my EPF balance on UMANG?', 'UMANG లో EPF బ్యాలెన్స్ ఎలా చూడాలి?', 'DigiLocker PIN മറന്നു, എന്ത് ചെയ്യണം?'];
const STAGE_COLORS = { eos: 'var(--c-eos)', stt: 'var(--c-stt)', cache: 'var(--c-cache)', retrieval: 'var(--c-ret)', llm: 'var(--c-llm)', tts: 'var(--c-tts)' };

function snapshot(providers, settings, cache) {
  return {
    llm: providers.llm.active, llmBackup: providers.llm.fallback,
    stt: providers.stt.active, sttBackup: providers.stt.fallback,
    tts: providers.tts.active, ttsBackup: providers.tts.fallback,
    voice: settings.voice, defaultLang: settings.defaultLang, temperature: settings.temperature,
    maxTokens: settings.maxTokens, topK: settings.topK, autoFailover: settings.autoFailover,
    cacheOn: cache.enabled, threshold: Number(cache.threshold),
  };
}

const LABELS = {
  llm: 'Language model', llmBackup: 'Backup language model', stt: 'Speech to text', sttBackup: 'Backup speech to text',
  tts: 'Text to speech', ttsBackup: 'Backup text to speech', voice: 'Voice', defaultLang: 'Default language',
  temperature: 'Temperature', maxTokens: 'Max reply length', topK: 'Passages per answer', autoFailover: 'Auto failover',
  cacheOn: 'Semantic cache', threshold: 'Cache threshold',
};

export default function Models() {
  const { providers, setProviders, settings, setSettings, cache, setCache, changeLog, logChange, user } = useStore();
  const toast = useToast();
  const saved = useMemo(() => snapshot(providers, settings, cache), [providers, settings, cache]);
  const [draft, setDraft] = useState(saved);
  const changes = Object.keys(saved).filter((k) => saved[k] !== draft[k]);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const opt = (kind, id) => providers[kind].options.find((o) => o.id === id);

  // Keep the backup different from the primary, and the voice valid for the chosen TTS.
  function choosePrimary(kind, id) {
    setDraft((d) => {
      const backupKey = `${kind}Backup`;
      const next = { ...d, [kind]: id };
      if (d[backupKey] === id) next[backupKey] = providers[kind].options.find((o) => o.id !== id).id;
      if (kind === 'tts') next.voice = opt('tts', id).voices?.[0] || '';
      return next;
    });
  }

  function save() {
    const name = (kind, id) => opt(kind, id)?.name || id;
    setProviders((p) => ({
      ...p,
      llm: { ...p.llm, active: draft.llm, fallback: draft.llmBackup },
      stt: { ...p.stt, active: draft.stt, fallback: draft.sttBackup },
      tts: { ...p.tts, active: draft.tts, fallback: draft.ttsBackup },
    }));
    setSettings((s) => ({ ...s, voice: draft.voice, defaultLang: draft.defaultLang, temperature: draft.temperature, maxTokens: draft.maxTokens, topK: draft.topK, autoFailover: draft.autoFailover }));
    setCache((c) => ({ ...c, enabled: draft.cacheOn, threshold: draft.threshold.toFixed(2) }));
    const pretty = (k, v) => {
      if (['llm', 'llmBackup'].includes(k)) return name('llm', v);
      if (['stt', 'sttBackup'].includes(k)) return name('stt', v);
      if (['tts', 'ttsBackup'].includes(k)) return name('tts', v);
      if (typeof v === 'boolean') return v ? 'on' : 'off';
      return String(v);
    };
    changes.forEach((k) => logChange({ at: stamp(), who: user.email, kind: LABELS[k], from: pretty(k, saved[k]), to: pretty(k, draft[k]), note: 'Saved from Models & voice' }));
    toast(`Saved. New calls use ${name('llm', draft.llm)} · ${name('stt', draft.stt)} · ${name('tts', draft.tts)}.`);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Models &amp; voice</h1>
          <p>Choose the language model, speech-to-text and voice the assistant uses, then try it here. Saving applies to new calls and chats right away; live sessions keep their current setup.</p>
        </div>
      </div>

      <div className="studio">
        <div className="grid" style={{ alignContent: 'start' }}>
          <Playground draft={draft} opt={opt} />
          <section className="card">
            <div className="card__head"><div><h2>Change history</h2><p>Every saved change is recorded (model governance, Annexure 14)</p></div></div>
            <div className="card__body card__body--flush table-wrap">
              <table className="data">
                <thead><tr><th>When</th><th>What</th><th>From</th><th>To</th><th>Who</th></tr></thead>
                <tbody>
                  {changeLog.slice(0, 8).map((c, i) => (
                    <tr key={`${c.at}-${i}`}><td className="num" style={{ textAlign: 'left' }}>{c.at}</td><td><Badge tone="info">{c.kind}</Badge></td>
                      <td className="mono">{c.from}</td><td className="mono">{c.to}</td><td>{c.who}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="card run" aria-labelledby="runTitle">
          <div className="run__head"><h2 id="runTitle">Run settings</h2><Badge tone="ok">Live</Badge></div>
          <div className="run__body">
            <div className="run__group">
              <div className="run__group-title">Language model</div>
              <ProviderSelect label="Model" kind="llm" value={draft.llm} providers={providers} onChange={(v) => choosePrimary('llm', v)} />
              <ProviderSelect label="Backup if it fails" kind="llm" value={draft.llmBackup} providers={providers} exclude={draft.llm} onChange={(v) => set('llmBackup', v)} compact />
              <Slider label="Temperature" value={draft.temperature} min={0} max={1} step={0.05} onChange={(v) => set('temperature', v)}
                hint="Low keeps answers close to the documents." format={(v) => v.toFixed(2)} />
              <Slider label="Max reply length" value={draft.maxTokens} min={50} max={400} step={10} onChange={(v) => set('maxTokens', v)}
                hint="Voice replies stay short; about 150 tokens is two sentences." format={(v) => `${v} tokens`} />
            </div>

            <div className="run__group">
              <div className="run__group-title">Speech</div>
              <ProviderSelect label="Speech to text" kind="stt" value={draft.stt} providers={providers} onChange={(v) => choosePrimary('stt', v)} />
              <ProviderSelect label="Backup if it fails" kind="stt" value={draft.sttBackup} providers={providers} exclude={draft.stt} onChange={(v) => set('sttBackup', v)} compact />
              <ProviderSelect label="Text to speech" kind="tts" value={draft.tts} providers={providers} onChange={(v) => choosePrimary('tts', v)} />
              <label className="run__field"><span>Voice</span>
                <select value={draft.voice} onChange={(e) => set('voice', e.target.value)}>
                  {(opt('tts', draft.tts).voices || []).map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label className="run__field"><span>Default language</span>
                <select value={draft.defaultLang} onChange={(e) => set('defaultLang', e.target.value)}>
                  {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>

            <details className="run__adv">
              <summary>Advanced settings<Icon name="chevronDown" /></summary>
              <div className="run__group">
                <ProviderSelect label="Backup text to speech" kind="tts" value={draft.ttsBackup} providers={providers} exclude={draft.tts} onChange={(v) => set('ttsBackup', v)} compact />
                <Slider label="Passages per answer" value={draft.topK} min={2} max={8} step={1} onChange={(v) => set('topK', v)} hint="Knowledge passages given to the model after reranking." />
                <label className="switch"><input type="checkbox" checked={draft.cacheOn} onChange={(e) => set('cacheOn', e.target.checked)} /><span className="switch__ui" /><span>Semantic cache</span></label>
                <Slider label="Cache match threshold" value={draft.threshold} min={0.8} max={0.99} step={0.01} onChange={(v) => set('threshold', v)}
                  hint={`Holding ${cache.entries.toLocaleString('en-IN')} answers for KB v${cache.kbVersion}. Higher = fewer wrong cached answers.`} format={(v) => v.toFixed(2)} />
                <label className="switch"><input type="checkbox" checked={draft.autoFailover} onChange={(e) => set('autoFailover', e.target.checked)} /><span className="switch__ui" /><span>Switch to backup after 3 failed health checks</span></label>
              </div>
            </details>
          </div>
          <div className="run__foot">
            {changes.length > 0 && <span className="changed">{changes.length} unsaved</span>}
            <button type="button" className="btn btn--ghost" disabled={!changes.length} onClick={() => setDraft(saved)}>Reset</button>
            <button type="button" className="btn btn--primary" disabled={!changes.length} onClick={save}>Save</button>
          </div>
        </aside>
      </div>
    </>
  );
}

function ProviderSelect({ label, kind, value, providers, onChange, exclude, compact }) {
  const options = providers[kind].options.filter((o) => o.id !== exclude);
  const o = providers[kind].options.find((x) => x.id === value);
  return (
    <label className="run__field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.p50} ms</option>)}
      </select>
      {!compact && o && (
        <p className="run__hint">{o.vendor} · {o.region} · <span className="mono">{o.version}</span> · <Badge status={o.health} /></p>
      )}
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange, hint, format = (v) => v }) {
  return (
    <label className="run__field">
      <span>{label}<b>{format(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <p className="run__hint">{hint}</p>}
    </label>
  );
}

// Try the current (unsaved) settings against the live knowledge base. Latency is an estimate for a
// voice turn built from each selected provider's measured median.
function Playground({ draft, opt }) {
  const { documents, chunks } = useStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const asked = useRef(new Set());
  const logRef = useRef(null);
  useEffect(() => { const l = logRef.current; if (l) l.scrollTop = l.scrollHeight; }, [messages]);

  async function run(q) {
    const question = q.trim();
    if (!question || busy) return;
    setText('');
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: question }]);
    await new Promise((r) => setTimeout(r, 450));
    const key = question.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
    const cached = draft.cacheOn && asked.current.has(key);
    asked.current.add(key);
    const hits = retrieve(question, documents, chunks, { topK: draft.topK });
    const llm = opt('llm', draft.llm);
    const stt = opt('stt', draft.stt);
    const tts = opt('tts', draft.tts);
    let reply;
    if (!hits.length || hits[0].score < MIN_CONFIDENCE) {
      reply = { route: 'handoff', text: "I don't have that information in the knowledge base. On a call, I would offer to connect the caller to an officer.", latency: { eos: 260, stt: stt.p50, retrieval: 90, tts: tts.p50 } };
    } else if (cached) {
      reply = { route: 'cache', text: hits[0].chunk.text, sources: [hits[0]], latency: { eos: 250, stt: stt.p50, cache: 18, tts: tts.p50 } };
    } else {
      reply = { route: 'llm', text: hits[0].chunk.text, sources: hits.slice(0, 2), model: llm.name, latency: { eos: 260, stt: stt.p50, retrieval: 90, llm: llm.p50, tts: tts.p50 } };
    }
    setMessages((m) => [...m, { role: 'bot', ...reply }]);
    setBusy(false);
  }

  return (
    <section className="card play" aria-label="Playground">
      <div className="card__head">
        <div><h2>Try it</h2><p>Ask what a citizen would ask. Uses the settings on the right, including unsaved changes.</p></div>
        {messages.length > 0 && <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setMessages([]); asked.current.clear(); }}>Clear</button>}
      </div>
      <div className="play__log" ref={logRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="play__empty">
            <h3>How can I help citizens today?</h3>
            <p>Answers come from the published knowledge base, in English, Hindi, Telugu or Malayalam. Ask the same thing twice to see a cache hit.</p>
            <div className="play__suggest">{SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => run(s)}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m, i) => (m.role === 'user' ? (
          <div key={i} className="play__msg play__msg--user"><p>{m.text}</p></div>
        ) : (
          <div key={i} className="play__msg play__msg--bot">
            <p>{m.text}</p>
            {m.sources && <div className="play__src"><Icon name="file" size={14} />{m.sources.map((h) => `${h.doc.title} p.${h.chunk.page}`).join(' · ')}</div>}
            <div className="play__meta">
              <span className={`route route--${m.route}`}>{m.route}</span>
              {m.model && <span>{m.model}</span>}
              <Stack parts={Object.entries(m.latency).map(([k, v]) => ({ label: k, ms: v, color: STAGE_COLORS[k] }))} />
              <strong>{Object.values(m.latency).reduce((a, b) => a + b, 0)} ms</strong>
              <span>est. voice turn</span>
            </div>
          </div>
        )))}
        {busy && <div className="play__msg play__msg--bot"><p className="note">Thinking…</p></div>}
      </div>
      <form className="play__input" onSubmit={(e) => { e.preventDefault(); run(text); }}>
        <label className="sr-only" htmlFor="playText">Question</label>
        <textarea id="playText" rows={1} value={text} placeholder="Type a question…" onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(text); } }} />
        <button type="submit" className="btn btn--primary" disabled={busy || !text.trim()}><Icon name="send" size={16} />Run</button>
      </form>
    </section>
  );
}
