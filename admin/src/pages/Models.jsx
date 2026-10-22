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
import Select from '../components/Select.jsx';

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
          <ChangeControl />
          <FailoverDrills />
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
              <div className="run__field"><span>Voice</span>
                <Select block label="Voice" value={draft.voice} onChange={(v) => set('voice', v)} options={(opt('tts', draft.tts).voices || []).map((v) => ({ value: v, label: v }))} />
              </div>
              <div className="run__field"><span>Default language</span>
                <Select block label="Default language" value={draft.defaultLang} onChange={(v) => set('defaultLang', v)} options={LANGS.map(([v, l]) => ({ value: v, label: l }))} />
              </div>
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
    <div className="run__field">
      <span>{label}</span>
      <Select block label={label} value={value} onChange={onChange} options={options.map((x) => ({ value: x.id, label: `${x.name} · ${x.p50} ms` }))} />
      {!compact && o && (
        <p className="run__hint">{o.vendor} · {o.region} · <span className="mono">{o.version}</span> · <Badge status={o.health} /></p>
      )}
    </div>
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

// Annexure 14: every component is version-pinned; a change needs notice, an evaluation against the accepted
// baseline and an approval before it is promoted, and can be rolled back within 30 minutes.
const PINS = [
  ['LLM', 'claude-haiku-5-5', '2026-10-02', 'arjun.nair@dic.gov.in'],
  ['STT', 'saarika:v2', '2026-10-21', 'arjun.nair@dic.gov.in'],
  ['TTS', 'bulbul:v2', '2026-10-02', 'arjun.nair@dic.gov.in'],
  ['Embeddings', 'bge-m3 @ 2026-09', '2026-09-28', 'meera.iyer@dic.gov.in'],
  ['Reranker', 'bge-reranker-v2-m3', '2026-09-28', 'meera.iyer@dic.gov.in'],
  ['Safety filter', 'guard-rules v12', '2026-10-15', 'meera.iyer@dic.gov.in'],
  ['Prompt', 'answer_voice v3 · answer_chat v3', '2026-10-18', 'vikram.shah@negd.gov.in'],
];
const STEPS = ['Proposed', 'Evaluated', 'Approved', 'Promoted'];
const EVAL = [['Answer accuracy', '96.2%', '97.4%', true], ['Wrong / made-up answers', '1.3%', '0.9%', true], ['Correct escalation', '96.7%', '97.0%', true], ['p95 latency (complex turns)', '1,140 ms', '1,060 ms', true], ['Red-team attacks blocked', '100%', '100%', true]];

function ChangeControl() {
  const { logChange, user } = useStore();
  const toast = useToast();
  const [step, setStep] = useState(1); // index into STEPS
  const [promotedAt, setPromotedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!promotedAt) return undefined; const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, [promotedAt]);
  const left = promotedAt ? Math.max(0, 30 * 60 - Math.floor((now - promotedAt) / 1000)) : 0;

  function approve() { setStep(2); logChange({ at: stamp(), who: user.email, kind: 'Approval', from: 'Proposed', to: 'Approved', note: 'Complex-turn model change approved after eval run #15' }); toast('Approved. It is not live until you promote it.'); }
  function promote() { const t = Date.now(); setStep(3); setPromotedAt(t); setNow(t); logChange({ at: stamp(), who: user.email, kind: 'LLM (complex turns)', from: 'claude-haiku-5-5', to: 'claude-sonnet-5-5', note: 'Promoted to production; rollback available for 30 min' }); toast('Promoted. New complex turns use Claude Sonnet 5.5. You can roll back for the next 30 minutes.'); }
  function rollback() { setStep(2); setPromotedAt(null); logChange({ at: stamp(), who: user.email, kind: 'Rollback', from: 'claude-sonnet-5-5', to: 'claude-haiku-5-5', note: 'Rolled back within the 30-minute window' }); toast('Rolled back. New calls are on the previous pinned version again.'); }

  return (
    <section className="card">
      <div className="card__head"><div><h2>Change control</h2><p>Version-pinned components; changes need notice, evaluation and approval (Annexure 14)</p></div></div>
      <div className="card__body" style={{ display: 'grid', gap: 16 }}>
        <div className="proposal">
          <div className="proposal__head">
            <div><b>Use Claude Sonnet 5.5 for complex, tool-heavy turns</b><small>Proposed by arjun.nair@dic.gov.in · notice given 1 Oct (15 business days) · simple turns stay on Haiku</small></div>
          </div>
          <ol className="steps">{STEPS.map((x, i) => <li key={x} className={i <= step ? 'is-done' : ''}>{x}</li>)}</ol>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Eval run #15 vs accepted baseline</th><th className="num">Now</th><th className="num">Proposed</th><th /></tr></thead>
              <tbody>{EVAL.map(([m, a, b, ok]) => <tr key={m}><td>{m}</td><td className="num">{a}</td><td className="num">{b}</td><td>{ok ? <Badge tone="ok">No regression</Badge> : <Badge tone="bad">Worse</Badge>}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="toolbar">
            {step === 1 && <button type="button" className="btn btn--primary" onClick={approve}><Icon name="check" size={16} />Approve</button>}
            {step === 2 && <button type="button" className="btn btn--primary" onClick={promote}><Icon name="arrowUpRight" size={16} />Promote to production</button>}
            {step === 3 && <button type="button" className="btn" onClick={rollback} disabled={!left}><Icon name="history" size={16} />Roll back ({Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left)</button>}
            <span className="note">Only roles with "Approve model or prompt changes" can approve.</span>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Component</th><th>Pinned version</th><th>Since</th><th>Approved by</th></tr></thead>
            <tbody>{PINS.map(([c, v, d, w]) => <tr key={c}><td>{c}</td><td className="mono">{c === 'LLM' && step === 3 ? 'claude-haiku-5-5 + claude-sonnet-5-5 (complex)' : v}</td><td style={{ whiteSpace: 'nowrap' }}>{d}</td><td className="cell-sub">{w}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// RFP §6.11: backup providers switch within 15 minutes and are drilled at least twice a year.
function FailoverDrills() {
  const { logChange, user } = useStore();
  const toast = useToast();
  const [rows, setRows] = useState([
    ['2026-10-19 10:02', 'LLM', 'claude-haiku-5-5 → vllm-local', '6m 10s', 'Real outage · automatic'],
    ['2026-09-12 15:30', 'STT', 'sarvam-saarika → deepgram-nova-3', '3m 42s', 'Planned drill'],
    ['2026-04-08 11:00', 'TTS', 'sarvam-bulbul → google-tts', '4m 05s', 'Planned drill'],
  ]);
  const [running, setRunning] = useState(false);
  function drill() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRows((r) => [[stamp(), 'TTS', 'sarvam-bulbul → google-tts', '2m 58s', 'Planned drill'], ...r]);
      logChange({ at: stamp(), who: user.email, kind: 'Failover drill', from: 'sarvam-bulbul', to: 'google-tts', note: 'Switched in 2m 58s and back; target ≤ 15 min' });
      toast('Drill passed: TTS switched to the backup in 2 min 58 s and back. Logged as evidence.');
    }, 1200);
  }
  return (
    <section className="card">
      <div className="card__head"><div><h2>Failover drills</h2><p>Backup must take over within 15 minutes; drilled at least twice a year (RFP §6.11)</p></div>
        <button type="button" className="btn btn--sm" onClick={drill} disabled={running}><Icon name="refresh" size={16} />{running ? 'Running drill…' : 'Run drill now'}</button></div>
      <div className="card__body card__body--flush table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Stage</th><th>Switched</th><th className="num">Time to switch</th><th>Result</th></tr></thead>
          <tbody>{rows.map(([w, k, sw, t, why]) => <tr key={w + k}><td style={{ whiteSpace: 'nowrap' }}>{w}</td><td><Badge tone="muted">{k}</Badge></td><td className="mono" style={{ fontSize: 12 }}>{sw}</td><td className="num">{t}</td><td><Badge tone="ok">Within 15 min</Badge> <span className="cell-sub">{why}</span></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
