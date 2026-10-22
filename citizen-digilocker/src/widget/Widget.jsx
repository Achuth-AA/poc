// AI assistant widget. Talks to ./mockBackend.js today, the orchestrator API later.
// Accessibility: dialog semantics, Esc closes, aria-live message log, per-message lang attribute,
// visible focus. Targets WCAG 2.1 AA / GIGW 3.0.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CallOfferCard, ConfirmCard, OfflineHandoffCard, OtpCard, StatusCard } from './cards.jsx';
import { AUTH } from './content.js';
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

// Keypad on the voice call, like a helpline menu: 1 checks a status (reference number, then OTP), 0 gets an officer.
// Digits typed here never go through speech recognition, so an OTP is never spoken or transcribed.
const KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
const REF_PREFIX = AUTH.example.replace(/\d+$/, ''); // the letters before the 10 digits, e.g. UM or DL
const DEMO_CALLER = '9876543210'; // the browser call's stand-in for caller ID; the OTP goes to the number registered with the reference
const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], '*': [941, 1209], 0: [941, 1336], '#': [941, 1477] };
let audio;
function tone(key) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
    gain.connect(audio.destination);
    for (const f of DTMF[key]) { const o = audio.createOscillator(); o.frequency.value = f; o.connect(gain); o.start(t0); o.stop(t0 + 0.16); }
  } catch { /* no audio output: the keypad still works */ }
}

// Language picker: a pill button that opens a listbox of the four languages, each in its own script.
// Keyboard: arrows/Home/End move, Enter or Space picks, Esc closes the menu (not the panel).
function LangMenu({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const current = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    setActive(Math.max(0, LANGUAGES.findIndex((l) => l.code === value)));
    listRef.current?.focus();
    const away = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open, value]);

  const close = () => { setOpen(false); btnRef.current?.focus(); };
  const choose = (code) => { onChange(code); close(); };
  function onKey(e) {
    const last = LANGUAGES.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i === last ? 0 : i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i === 0 ? last : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(LANGUAGES[active].code); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') setOpen(false);
  }

  return (
    <div className="tnw-lang" ref={wrapRef}>
      <button ref={btnRef} type="button" className="tnw-lang__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${current.label}`}
        onClick={() => setOpen((o) => !o)} onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}>
        <Icon name="globe" size={16} /><span lang={current.code}>{current.name}</span><Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <ul ref={listRef} className="tnw-lang__list" role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`tnw-lang-${LANGUAGES[active].code}`} onKeyDown={onKey}>
          {LANGUAGES.map((l, i) => (
            <li key={l.code} id={`tnw-lang-${l.code}`} role="option" aria-selected={l.code === value} className={i === active ? 'is-active' : ''}
              onPointerEnter={() => setActive(i)} onClick={() => choose(l.code)}>
              <span className="tnw-lang__name" lang={l.code}>{l.name}</span>
              <span className="tnw-lang__en">{l.label !== l.name ? l.label : ''}</span>
              <Icon name="check" size={16} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

  // ---------- call keypad (helpline menu) ----------
  const [ivr, setIvr] = useState(null); // { step: menu | ref | otp | done | agent, digits, msg: [string keys], hint, readout, agent }
  const [padOpen, setPadOpen] = useState(false);
  const ivrRef = useRef(null);
  const ivrBusy = useRef(false);
  const update = useCallback((fn) => { if (!ivrRef.current) return; ivrRef.current = fn(ivrRef.current); setIvr(ivrRef.current); }, []);
  useEffect(() => {
    if (call === 'live') { ivrRef.current = { step: 'menu', digits: '', msg: ['ivrMenu'], hint: '', readout: '' }; setIvr(ivrRef.current); setPadOpen(true); }
    if (call === 'off') { ivrRef.current = null; setIvr(null); setPadOpen(false); }
  }, [call]);

  function finishStatus(blocks, verified) {
    const rec = blocks.find((b) => b.type === 'status')?.record;
    if (verified) push({ kind: 'system', text: 'Verified with OTP on the call', icon: 'shield' });
    renderBlocks(blocks, langRef.current);
    const row = (name) => rec?.rows.find(([k]) => k === name)?.[1];
    update((v) => ({ ...v, step: 'done', digits: '', hint: '', msg: ['ivrDone'], readout: rec ? [row('Status'), row('Next step')].filter(Boolean).join('. ') : '' }));
  }

  async function ivrSubmit(digits) {
    const { step } = ivrRef.current;
    ivrBusy.current = true;
    try {
      if (step === 'ref') {
        const res = digits.length === 10 && await backend.sendOtp(sessionRef.current, REF_PREFIX + digits, DEMO_CALLER);
        if (!res?.ok) update((v) => ({ ...v, digits: '', msg: ['ivrRefBad', 'ivrRef'] }));
        else update((v) => ({ ...v, step: 'otp', digits: '', msg: ['ivrOtp'], hint: res.hint }));
      } else if (step === 'otp') {
        const res = await backend.verifyOtp(sessionRef.current, digits);
        if (!res.ok) update((v) => ({ ...v, digits: '', msg: ['ivrOtpBad', 'ivrOtp'] }));
        else finishStatus(res.blocks, true);
      }
    } finally { ivrBusy.current = false; }
  }

  async function ivrOfficer() {
    update((v) => ({ ...v, step: 'agent', digits: '', hint: '', readout: '', msg: ['ivrAgent'] }));
    ivrBusy.current = true;
    const agent = await backend.connectAgent(sessionRef.current);
    ivrBusy.current = false;
    setWithAgent(true);
    push({ kind: 'system', text: `${agent.name} ${STRINGS[langRef.current].joined}` });
    push({ kind: 'agent', name: agent.name, text: agent.text });
    update((v) => ({ ...v, agent: agent.name, msg: ['ivrJoined'] }));
  }

  async function press(key) {
    const cur = ivrRef.current;
    if (!cur || ivrBusy.current) return;
    tone(key);
    if (cur.step === 'menu' || cur.step === 'done') {
      if (key === '1' && cur.step === 'menu') {
        if ((backend.snapshot(sessionRef.current)?.auth || 0) >= 1) { // already verified in this chat
          ivrBusy.current = true;
          try { finishStatus((await backend.sendTurn(sessionRef.current, 'Check my status', langRef.current, { quick: true })).blocks, false); } finally { ivrBusy.current = false; }
        } else update((v) => ({ ...v, step: 'ref', digits: '', msg: ['ivrRef'], hint: '', readout: '' }));
      } else if (key === '9') update((v) => ({ ...v, step: 'menu', msg: ['ivrMenu'], hint: '', readout: '' }));
      else if (key === '0') ivrOfficer();
      else update((v) => ({ ...v, msg: ['ivrInvalid', v.step === 'menu' ? 'ivrMenu' : 'ivrDone'] }));
      return;
    }
    if (cur.step !== 'ref' && cur.step !== 'otp') return;
    if (key === '*') { update((v) => ({ ...v, digits: v.digits.slice(0, -1) })); return; }
    if (key === '#') { ivrSubmit(cur.digits); return; }
    const max = cur.step === 'ref' ? 10 : 6;
    if (cur.digits.length >= max) return;
    const digits = cur.digits + key;
    update((v) => ({ ...v, digits }));
    if (cur.step === 'otp' && digits.length === 6) ivrSubmit(digits);
  }
  const pressRef = useRef(press);
  pressRef.current = press;
  // A hardware keyboard works too: digits, * and #, Backspace deletes, Enter confirms.
  useEffect(() => {
    if (call !== 'live') return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      // Enter confirms (#) unless focus is on some other button, which Enter should press as usual.
      const onKeypad = !!e.target.closest?.('.tnw-pad');
      const key = e.key === 'Backspace' ? '*' : e.key === 'Enter' && (onKeypad || e.target.tagName !== 'BUTTON') ? '#' : e.key;
      if (/^[0-9*#]$/.test(key)) { e.preventDefault(); pressRef.current(key); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [call]);
  const ivrText = (key) => {
    if (key === 'ivrJoined') return `${ivr.agent} ${t.ivrJoined}.`;
    const v = t[key];
    return typeof v === 'function' ? v(AUTH.label[lang] || AUTH.label.en) : v;
  };

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
              <LangMenu value={lang} onChange={setLang} label={t.language} />
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
            <div className={`tnw-call ${call === 'live' ? 'is-live' : ''} ${muted ? 'is-muted' : ''} ${padOpen ? 'is-pad' : ''}`} role="region" aria-label={t.voice}>
              <div className="tnw-call__pulse" aria-hidden="true"><span /><span /><span /></div>
              <div className="tnw-call__line">
                <p className="tnw-call__status" role="status">{call === 'live' ? t.callLive : t.callConnecting}</p>
                {call === 'live' && <p className="tnw-call__timer" aria-label="Call time">{`${Math.floor(callSec / 60)}:${String(callSec % 60).padStart(2, '0')}`}</p>}
              </div>
              <div className="tnw-call__lang" role="group" aria-label={t.callIn}>
                <span aria-hidden="true">{t.callIn}</span>
                <div className="tnw-call__langs">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} type="button" lang={l.code} aria-pressed={l.code === lang} aria-label={l.label} onClick={() => setLang(l.code)}>{l.name}</button>
                  ))}
                </div>
              </div>
              {call === 'live' && ivr && (
                <div className="tnw-call__say" aria-live="polite">
                  <Icon name="volume" size={16} />
                  <p>{ivr.msg.map(ivrText).join(' ')}{ivr.readout && <b className="tnw-call__readout">{ivr.readout}.</b>}</p>
                </div>
              )}
              {call === 'live' && ivr && padOpen && (
                <div className="tnw-pad">
                  {(ivr.step === 'ref' || ivr.step === 'otp') && (
                    <p className="tnw-pad__display" aria-label={ivr.step === 'otp' ? `${t.otp}: ${ivr.digits.length}/6` : `${AUTH.label[lang] || AUTH.label.en}: ${REF_PREFIX}${ivr.digits}`}>
                      {ivr.step === 'ref'
                        ? <><span className="tnw-pad__prefix">{REF_PREFIX}</span>{ivr.digits}<span className="tnw-pad__rest">{'0'.repeat(10 - ivr.digits.length)}</span></>
                        : <>{'•'.repeat(ivr.digits.length)}<span className="tnw-pad__rest">{'•'.repeat(6 - ivr.digits.length)}</span></>}
                    </p>
                  )}
                  {ivr.hint && <p className="tnw-pad__hint">{ivr.hint}</p>}
                  <div className="tnw-pad__keys" role="group" aria-label={t.keypad}>
                    {KEYS.map(([k, sub]) => (
                      <button key={k} type="button" className="tnw-key" aria-label={k === '*' ? `* ${t.keyDelete}` : k === '#' ? `# ${t.keyConfirm}` : k} onClick={() => press(k)}>
                        <span>{k}</span>{sub && <small aria-hidden="true">{sub}</small>}
                      </button>
                    ))}
                  </div>
                  <p className="tnw-pad__help">{t.keyHelp}</p>
                </div>
              )}
              <div className="tnw-call__controls">
                <button type="button" className="tnw-btn tnw-call__mute" aria-pressed={muted} disabled={call !== 'live'} onClick={() => setMuted((v) => !v)}>
                  <Icon name={muted ? 'micOff' : 'mic'} size={18} />{muted ? t.unmute : t.mute}
                </button>
                <button type="button" className="tnw-btn tnw-call__padbtn" aria-pressed={padOpen} disabled={call !== 'live'} onClick={() => setPadOpen((v) => !v)}>
                  <Icon name="grid" size={18} />{t.keypad}
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
