// AI assistant widget. Talks to ./mockBackend.js today, the orchestrator API later.
// Accessibility: dialog semantics, Esc closes, aria-live message log, per-message lang attribute,
// visible focus. Targets WCAG 2.1 AA / GIGW 3.0.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CallOfferCard, ConfirmCard, OfflineHandoffCard, OtpCard, StatusCard } from './cards.jsx';
import { backend, LANGUAGES, SITE } from './mockBackend.js';
import { STRINGS } from './strings.js';
import './widget.css';
import Icon from '../components/Icon.jsx';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Only plain messages are restored after a refresh; forms and cards are not.
const PERSISTED = new Set(['user', 'bot', 'agent', 'system', 'status']);

function load(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}

const CALL = 'Call the assistant'; // quick reply that starts the voice call straight away

const Widget = forwardRef(function Widget({ tenant = SITE.tenant }, ref) {
  const storeKey = `tn-assistant:${tenant}`;
  const saved = useRef(load(storeKey));
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(saved.current?.lang || 'en');
  const [messages, setMessages] = useState(() => (saved.current?.messages || []).map((m) => ({ ...m, streaming: false })));
  const [busy, setBusy] = useState(false);
  const [withAgent, setWithAgent] = useState(!!saved.current?.backend?.withAgent);
  const [call, setCall] = useState('off'); // off | connecting | live
  const [callSec, setCallSec] = useState(0);
  const [muted, setMuted] = useState(false);
  const [text, setText] = useState('');
  const sessionRef = useRef(saved.current?.sessionId || null);
  const langRef = useRef(lang);
  const nextId = useRef(0);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const t = STRINGS[lang];
  langRef.current = lang;

  useEffect(() => { if (sessionRef.current) backend.resume(sessionRef.current, saved.current?.backend); }, []);

  // Persist the conversation for this browser tab.
  useEffect(() => {
    if (!sessionRef.current) return;
    try {
      sessionStorage.setItem(storeKey, JSON.stringify({
        sessionId: sessionRef.current, lang,
        messages: messages.filter((m) => PERSISTED.has(m.kind)).map((m) => (m.kind === 'bot' ? { ...m, text: m.full ?? m.text } : m)).slice(-60),
        backend: backend.snapshot(sessionRef.current),
      }));
    } catch { /* storage unavailable: chat still works, it just won't survive a refresh */ }
  }, [messages, lang, storeKey]);

  useEffect(() => { const l = logRef.current; if (l) l.scrollTop = l.scrollHeight; }, [messages]);

  // ---------- message helpers ----------
  const push = useCallback((msg) => {
    const id = `m${Date.now()}-${nextId.current++}`;
    setMessages((m) => [...m, { id, ...msg }]);
    return id;
  }, []);
  const patch = useCallback((id, fields) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...fields } : x))), []);
  const removeMsg = useCallback((id) => setMessages((m) => m.filter((x) => x.id !== id)), []);
  const replaceMsg = useCallback((id, msg) => setMessages((m) => m.map((x) => (x.id === id ? { id, ...msg } : x))), []);

  const addBot = useCallback(async (full, { sources, lng, stream = true } = {}) => {
    const id = push({ kind: 'bot', text: stream ? '' : full, full, sources, lang: lng || langRef.current, streaming: stream });
    if (!stream) return;
    const words = full.split(' ');
    for (let i = 1; i <= words.length; i++) {
      patch(id, { text: words.slice(0, i).join(' ') });
      await sleep(28); // eslint-disable-line no-await-in-loop
    }
    patch(id, { streaming: false });
  }, [push, patch]);

  const renderBlocks = useCallback(async (blocks, lng) => {
    for (const b of blocks) {
      if (b.type === 'text') await addBot(b.text, { sources: b.sources, lng }); // eslint-disable-line no-await-in-loop
      else if (b.type === 'quick') push({ kind: 'quick', options: b.options });
      else if (b.type === 'otp') push({ kind: 'otp' });
      else if (b.type === 'status') push({ kind: 'status', record: b.record });
      else if (b.type === 'confirm') push({ kind: 'confirm', block: b });
      else if (b.type === 'agent') push({ kind: 'agent', name: b.name, text: b.text });
      else if (b.type === 'call') push({ kind: 'call' });
      else if (b.type === 'handoff') {
        if (!b.online) { push({ kind: 'offline', text: b.text }); continue; }
        const waitId = push({ kind: 'waiting', text: b.text });
        backend.connectAgent(sessionRef.current).then((agent) => {
          removeMsg(waitId);
          setWithAgent(true);
          push({ kind: 'system', text: `${agent.name} ${STRINGS[langRef.current].joined}` });
          push({ kind: 'agent', name: agent.name, text: agent.text });
        });
      }
    }
  }, [addBot, push, removeMsg]);

  // ---------- conversation ----------
  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return;
    const res = await backend.startSession({ tenant, channel: 'chat', language: langRef.current });
    sessionRef.current = res.sessionId;
    await addBot(res.greeting[langRef.current], { stream: false });
    push({ kind: 'quick', options: res.quick(langRef.current).options });
  }, [tenant, addBot, push]);

  const busyRef = useRef(false);
  // opts.quick: sent from a quick-reply button, so the answer stays in the chosen language.
  const ask = useCallback(async (raw, opts = {}) => {
    const q = raw.trim();
    if (!q || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    await ensureSession();
    push({ kind: 'user', text: q });
    const typing = push({ kind: 'typing' });
    try {
      const res = await backend.sendTurn(sessionRef.current, q, langRef.current, opts);
      removeMsg(typing);
      await renderBlocks(res.blocks, res.lang);
    } catch {
      removeMsg(typing);
      push({ kind: 'system', text: 'Something went wrong. Please try again.' });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [ensureSession, push, removeMsg, renderBlocks]);

  const openPanel = useCallback(async (opts = {}) => {
    if (opts.language) setLang(opts.language);
    langRef.current = opts.language || langRef.current;
    setOpen(true);
    await ensureSession();
    if (opts.call) { setCallSec(0); setMuted(false); setCall('connecting'); }
    if (opts.ask) ask(opts.ask);
  }, [ensureSession, ask]);

  const closePanel = useCallback(() => { setOpen(false); setCall('off'); requestAnimationFrame(() => launcherRef.current?.focus()); }, []);

  useImperativeHandle(ref, () => ({ open: openPanel, close: closePanel }), [openPanel, closePanel]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // Voice call screen (UI only until the LiveKit voice agent is connected).
  useEffect(() => {
    if (call === 'connecting') {
      const tm = setTimeout(() => setCall('live'), 1500);
      return () => clearTimeout(tm);
    }
    if (call === 'live') {
      const iv = setInterval(() => setCallSec((n) => n + 1), 1000);
      return () => clearInterval(iv);
    }
    return undefined;
  }, [call]);
  const startCall = () => { setCallSec(0); setMuted(false); setCall('connecting'); };

  function submit(e) {
    e.preventDefault();
    const v = text;
    setText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    ask(v);
  }

  function onInput(e) {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  async function feedback(m, value) {
    await backend.feedback(sessionRef.current, m.id, value);
    patch(m.id, { fb: value });
  }

  // ---------- render ----------
  function renderMessage(m) {
    switch (m.kind) {
      case 'user':
        return <div key={m.id} className="tnw-msg tnw-msg--user"><p>{m.text}</p></div>;
      case 'bot':
        return (
          <div key={m.id} className="tnw-msg tnw-msg--bot" lang={m.lang}>
            <p className={m.streaming ? 'tnw-streaming' : ''}>{m.text}</p>
            {!m.streaming && m.sources?.length > 0 && (
              <>
                <ul className="tnw-sources" aria-label={t.sources}>
                  {m.sources.map((s) => (
                    <li key={`${s.title}-${s.page}`}><a href="#source" onClick={(e) => e.preventDefault()} title="Opens the document at this page (demo)"><Icon name="file" size={14} />{s.title} · p.{s.page}</a></li>
                  ))}
                </ul>
                <div className="tnw-feedback">
                  {m.fb ? <span>{t.thanks}</span> : (
                    <>
                      <span>{t.helpful}</span>
                      <button type="button" className="tnw-fb" aria-label="Helpful" onClick={() => feedback(m, 'up')}><Icon name="thumbUp" size={16} /></button>
                      <button type="button" className="tnw-fb" aria-label="Not helpful" onClick={() => feedback(m, 'down')}><Icon name="thumbDown" size={16} /></button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        );
      case 'agent':
        return <div key={m.id} className="tnw-msg tnw-msg--agent"><span className="tnw-msg__who">{m.name}</span><p>{m.text}</p></div>;
      case 'system':
        return <p key={m.id} className="tnw-system">{m.icon && <Icon name={m.icon} size={14} />}{m.text}</p>;
      case 'waiting':
        return <p key={m.id} className="tnw-system tnw-waiting"><span className="tnw-spinner" aria-hidden="true" />{m.text}</p>;
      case 'typing':
        return <div key={m.id} className="tnw-typing" aria-label="Assistant is typing"><span /><span /><span /></div>;
      case 'quick':
        return (
          <div key={m.id} className="tnw-quick" role="group" aria-label="Suggested replies">
            {m.options.map((o) => (
              o.send === CALL ? (
                <button key={o.send} type="button" className="tnw-chip tnw-chip--call" onClick={startCall}><Icon name="phone" size={14} />{o.label}</button>
              ) : (
                <button key={o.send} type="button" className="tnw-chip" disabled={busy} onClick={() => { removeMsg(m.id); ask(o.send, { quick: true }); }}>{o.label}</button>
              )
            ))}
          </div>
        );
      case 'otp':
        return (
          <OtpCard key={m.id} t={t} sessionId={sessionRef.current}
            onVerified={(blocks) => { replaceMsg(m.id, { kind: 'system', text: 'Verified with OTP', icon: 'shield' }); renderBlocks(blocks, langRef.current); }} />
        );
      case 'status':
        return <StatusCard key={m.id} record={m.record} />;
      case 'call':
        return <CallOfferCard key={m.id} t={t} onCall={startCall} />;
      case 'confirm':
        return <ConfirmCard key={m.id} t={t} block={m.block} sessionId={sessionRef.current} onResult={(blocks) => renderBlocks(blocks, langRef.current)} />;
      case 'offline':
        return <OfflineHandoffCard key={m.id} t={t} text={m.text} sessionId={sessionRef.current} onDone={(msg) => replaceMsg(m.id, { kind: 'system', text: msg })} />;
      default:
        return null;
    }
  }

  return (
    <div className={`tnw ${withAgent ? 'tnw--agent' : ''}`} data-open={open} onKeyDown={(e) => { if (e.key === 'Escape' && open) closePanel(); }}>
      {!open && (
        // Two round buttons stacked bottom right: a pulsing direct-call button on top, the chat button below.
        <div className="tnw-launchers">
          <button type="button" className="tnw-fab tnw-fab--call" aria-haspopup="dialog" aria-label={t.voice} onClick={() => openPanel({ call: true })}>
            <span className="tnw-fab__ring" aria-hidden="true" />
            <Icon name="phone" size={22} />
            <span className="tnw-fab__tip" aria-hidden="true">{t.callHint}</span>
          </button>
          <button ref={launcherRef} type="button" className="tnw-fab tnw-fab--chat" aria-haspopup="dialog" aria-expanded="false" aria-controls="tnw-panel" aria-label={t.open} onClick={() => openPanel()}>
            <Icon name="chat" size={26} />
            <span className="tnw-fab__tip" aria-hidden="true">{t.launcher}</span>
          </button>
        </div>
      )}
      {open && (
        <section id="tnw-panel" className="tnw-panel" role="dialog" aria-modal="false" aria-labelledby="tnw-title" lang={lang}>
          <header className="tnw-head">
            <div className="tnw-avatar" aria-hidden="true">AI</div>
            <div className="tnw-head__text">
              <h2 id="tnw-title" className="tnw-title">{t.title}</h2>
              <p className="tnw-sub"><span className="tnw-dot" aria-hidden="true" /><span>{withAgent ? t.subAgent : t.sub}</span></p>
            </div>
            <div className="tnw-head__actions">
              <label className="tnw-langpick">
                <span className="tnw-sr">{t.language}</span>
                <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t.language}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
                </select>
              </label>
              <button type="button" className="tnw-callbtn" aria-label={t.voice} title={t.voice} onClick={startCall}>
                <Icon name="phone" size={16} /><span>{t.callShort}</span>
              </button>
              <button type="button" className="tnw-icon tnw-close" aria-label={t.close} onClick={closePanel}>
                <Icon name="x" size={20} />
              </button>
            </div>
          </header>

          <div className="tnw-log" role="log" aria-live="polite" aria-relevant="additions" ref={logRef}>{messages.map(renderMessage)}</div>

          <form className="tnw-input" autoComplete="off" onSubmit={submit}>
            <label className="tnw-sr" htmlFor="tnw-text">{t.placeholder}</label>
            <textarea id="tnw-text" ref={inputRef} rows={1} maxLength={500} value={text} placeholder={t.placeholder} onChange={onInput}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }} />
            <button type="button" className="tnw-send tnw-send--call" aria-label={t.voice} title={t.voice} onClick={startCall}>
              <Icon name="phone" size={18} />
            </button>
            <button type="submit" className="tnw-send" aria-label={t.send} disabled={busy}>
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="tnw-disclaimer">{t.disclaimer}</p>

          {call !== 'off' && (
            <div className={`tnw-call ${call === 'live' ? 'is-live' : ''} ${muted ? 'is-muted' : ''}`} role="region" aria-label={t.voice}>
              <div className="tnw-call__pulse" aria-hidden="true"><span /><span /><span /></div>
              <p className="tnw-call__status" role="status">{call === 'live' ? t.callLive : t.callConnecting}</p>
              {call === 'live' && <p className="tnw-call__timer" aria-label="Call time">{`${Math.floor(callSec / 60)}:${String(callSec % 60).padStart(2, '0')}`}</p>}
              <label className="tnw-call__lang">
                <span>{t.callIn}</span>
                <select value={lang} onChange={(e) => setLang(e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
                </select>
              </label>
              <div className="tnw-call__controls">
                <button type="button" className="tnw-btn tnw-call__mute" aria-pressed={muted} disabled={call !== 'live'} onClick={() => setMuted((v) => !v)}>
                  <Icon name={muted ? 'micOff' : 'mic'} size={18} />{muted ? t.unmute : t.mute}
                </button>
                <button type="button" className="tnw-btn tnw-btn--danger tnw-call__end" autoFocus onClick={() => setCall('off')}><Icon name="phoneOff" size={18} />{t.endCall}</button>
              </div>
              <p className="tnw-call__note">{t.callNote}</p>
              <button type="button" className="tnw-link tnw-call__back" onClick={() => setCall('off')}>{t.backToChat}</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
});

export default Widget;
