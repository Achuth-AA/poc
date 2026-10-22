// Supervisor view: live officers and calls, listen / whisper / barge, queue assignment and quality review.
// Covers RFP §6.3 (queueing, transfer, conference / whisper / consult) and §6.6 (supervisor dashboards,
// quality monitoring, sentiment-aware handling).
import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Select from '../components/Select.jsx';
import { useToast } from '../components/Toast.jsx';

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const OFFICERS = [
  { id: 'o1', name: 'Sunita Sharma', status: 'oncall', call: { caller: 'Caller ••318', lang: 'Telugu', channel: 'voice', sec: 194, mood: 'Distressed', topic: 'EPF claim stuck; family member in hospital' } },
  { id: 'o2', name: 'Rahul Verma', status: 'oncall', call: { caller: 'Caller ••774', lang: 'Hindi', channel: 'voice', sec: 71, mood: 'Calm', topic: 'Driving licence not fetching into DigiLocker' } },
  { id: 'o3', name: 'Anitha K', status: 'chat', call: { caller: 'Web visitor', lang: 'Malayalam', channel: 'chat', sec: 312, mood: 'Frustrated', topic: 'Refund for a failed gas booking' } },
  { id: 'o4', name: 'Imran Qureshi', status: 'wrap', call: null },
  { id: 'o5', name: 'Priya Das', status: 'available', call: null },
  { id: 'o6', name: 'Joseph Mathew', status: 'away', call: null },
];
const STATUS = { oncall: ['tag--teal', 'On a call'], chat: ['tag--teal', 'In a chat'], wrap: ['tag--warn', 'Wrap-up'], available: ['tag--ok', 'Available'], away: ['', 'Away'] };
const MOOD = { Distressed: 'bad', Frustrated: 'bad', Calm: 'ok' };
const LIVE = {
  o1: [['citizen', 'అమ్మ ఆసుపత్రిలో ఉంది, డబ్బు చాలా అవసరం. (My mother is in hospital, I really need the money.)'], ['officer', 'I understand. I am checking your claim now. Can you tell me the claim number?'], ['citizen', 'UM 2610078812.'], ['officer', 'Thank you. I will mark it urgent for the EPFO nodal officer today.']],
  o2: [['citizen', 'Licence fetch karne par error aata hai.'], ['officer', 'Kya aapka naam licence aur Aadhaar mein same hai?'], ['citizen', 'Nahi, licence mein spelling alag hai.']],
  o3: [['citizen', 'ഇതുവരെ പണം തിരികെ കിട്ടിയില്ല. (I still have not got the refund.)'], ['officer', 'I can see the complaint G-2026-0512. The refund was sent to the bank yesterday.']],
};
const QUEUE = [
  { id: 'q1', who: 'Caller ••612', lang: 'Hindi', wait: 52, why: 'Asked for a person', pri: false },
  { id: 'q2', who: 'Web visitor', lang: 'English', wait: 28, why: 'Two answers not found', pri: false },
];
const REVIEW = [
  ['s_8838', 'Telugu', 'Sentiment dropped after the third AI answer', 'Check the KYC answer in the Telugu FAQ'],
  ['s_8836', 'English', 'Caller hung up after 12 s of silence', 'Silence prompt may be too late'],
  ['s_c_2288', 'Malayalam', 'Officer marked a suggested answer "wrong"', 'Refund window differs for UPI payments'],
];

export default function Supervisor() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [mon, setMon] = useState(null); // { id, mode: listen | whisper | barge }
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState('');
  const [assign, setAssign] = useState({ q1: 'o5', q2: 'o5' });
  const logRef = useRef(null);
  useEffect(() => { const iv = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { const l = logRef.current; if (l) l.scrollTop = l.scrollHeight; }, [lines]);

  // The monitored call's transcript continues live.
  useEffect(() => {
    if (!mon) return undefined;
    const script = LIVE[mon.id] || [];
    let i = Math.min(2, script.length);
    setLines(script.slice(0, i));
    const iv = setInterval(() => { if (i < script.length) { const next = script[i]; i += 1; setLines((l) => [...l, next]); } }, 4000);
    return () => clearInterval(iv);
  }, [mon?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const officer = mon && OFFICERS.find((o) => o.id === mon.id);
  const busy = OFFICERS.filter((o) => o.call).length;
  const free = OFFICERS.filter((o) => o.status === 'available').length;

  function start(o, mode) {
    setMon({ id: o.id, mode });
    if (mode === 'barge') toast(`You joined ${o.call.caller}'s call. The caller and ${o.name} can both hear you.`);
  }
  function whisper(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setLines((l) => [...l, ['whisper', note.trim()]]);
    setNote('');
  }

  return (
    <div className="page sup">
      <div>
        <h1>Supervisor</h1>
        <p className="page-sub">Live view of the helpline. Listen silently, whisper to an officer without the caller hearing, or join the call.</p>
      </div>

      <dl className="sup__tiles">
        <div className="is-alert"><dt>Waiting</dt><dd>{QUEUE.length}</dd></div>
        <div><dt>Longest wait</dt><dd>{mmss(QUEUE[0].wait + tick)}</dd></div>
        <div><dt>Officers busy / free</dt><dd>{busy} / {free}</dd></div>
        <div><dt>Answered in 60 s</dt><dd>92%</dd></div>
        <div><dt>Average handle time</dt><dd>4:12</dd></div>
      </dl>

      <div className="sup__main">
        <section className="card sup__officers">
          <h2 className="sup__h">Officers</h2>
          <ul className="officers">
            {OFFICERS.map((o) => (
              <li key={o.id} className={mon?.id === o.id ? 'is-on' : ''}>
                <span className="avatar" aria-hidden="true">{o.name.split(' ').map((w) => w[0]).join('')}</span>
                <span className="officers__main">
                  <b>{o.name}</b>
                  {o.call
                    ? <small>{o.call.caller} · {o.call.lang} · {mmss(o.call.sec + tick)} · {o.call.topic}</small>
                    : <small>{o.status === 'wrap' ? 'Writing after-call notes' : o.status === 'available' ? 'Ready for the next handoff' : 'Not taking handoffs'}</small>}
                </span>
                <span className="officers__side">
                  <span className={`tag ${STATUS[o.status][0]}`}>{STATUS[o.status][1]}</span>
                  {o.call && <span className={`mood mood--${MOOD[o.call.mood] || 'warn'}`}>{o.call.mood}</span>}
                </span>
                {o.call && (
                  <span className="officers__acts" role="group" aria-label={`Monitor ${o.name}`}>
                    <button type="button" className="btn btn--sm" aria-pressed={mon?.id === o.id && mon.mode === 'listen'} onClick={() => start(o, 'listen')}><Icon name="ear" size={15} />Listen</button>
                    <button type="button" className="btn btn--sm" aria-pressed={mon?.id === o.id && mon.mode === 'whisper'} onClick={() => start(o, 'whisper')}><Icon name="whisper" size={15} />Whisper</button>
                    <button type="button" className="btn btn--sm" aria-pressed={mon?.id === o.id && mon.mode === 'barge'} onClick={() => start(o, 'barge')}><Icon name="barge" size={15} />{o.call.channel === 'chat' ? 'Join chat' : 'Barge in'}</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card sup__monitor" aria-live="polite">
          {!officer ? (
            <div className="sup__empty"><span className="convo__empty-icon"><Icon name="ear" size={24} /></span><h2>Nothing monitored</h2><p className="note">Choose Listen, Whisper or Barge in next to an officer on a call.</p></div>
          ) : (
            <>
              <div className="sup__monhead">
                <div><h2>{officer.name} · {officer.call.caller}</h2><p className="note">{officer.call.lang} · {officer.call.channel === 'voice' ? 'voice call' : 'web chat'} · {mmss(officer.call.sec + tick)}</p></div>
                <span className={`tag ${mon.mode === 'barge' ? 'tag--bad' : mon.mode === 'whisper' ? 'tag--warn' : 'tag--teal'}`}>
                  {mon.mode === 'listen' ? 'Listening, muted' : mon.mode === 'whisper' ? 'Whisper: officer only' : 'You are on the call'}
                </span>
              </div>
              <ol className="transcript sup__log" ref={logRef}>
                {mon.mode === 'barge' && <li className="line line--system">Supervisor joined · the caller was told</li>}
                {lines.map(([who, text], i) => (
                  <li key={i} className={`line line--${who === 'whisper' ? 'whisper' : who}`}>
                    <span className="line__who">{who === 'citizen' ? 'Citizen' : who === 'officer' ? officer.name : 'You → officer only'}</span><p>{text}</p>
                  </li>
                ))}
              </ol>
              {mon.mode !== 'listen' && (
                <form className="composer" onSubmit={whisper}>
                  <label className="sr-only" htmlFor="sup-note">{mon.mode === 'whisper' ? 'Whisper to the officer' : 'Say to the caller'}</label>
                  <textarea id="sup-note" rows={1} value={note} placeholder={mon.mode === 'whisper' ? `Whisper to ${officer.name.split(' ')[0]} (the caller cannot hear)` : 'Type what to say; the caller hears it'} onChange={(e) => setNote(e.target.value)} />
                  <button type="submit" className="btn btn--primary">{mon.mode === 'whisper' ? 'Whisper' : 'Send'}</button>
                </form>
              )}
              <div className="sup__monfoot"><button type="button" className="btn btn--sm" onClick={() => setMon(null)}>Stop monitoring</button></div>
            </>
          )}
        </section>
      </div>

      <div className="sup__grid">
        <section className="card">
          <h2 className="sup__h">Queue · assign to an officer</h2>
          <ul className="sup__queue">
            {QUEUE.map((q) => (
              <li key={q.id}>
                <span><b>{q.who}</b><small>{q.lang} · {q.why} · waiting {mmss(q.wait + tick)}</small></span>
                <Select label={`Assign ${q.who}`} value={assign[q.id]} onChange={(v) => setAssign({ ...assign, [q.id]: v })}
                  options={OFFICERS.map((o) => ({ value: o.id, label: o.name, disabled: o.status === 'away' }))} />
                <button type="button" className="btn btn--sm btn--primary" onClick={() => toast(`${q.who} sent to ${OFFICERS.find((o) => o.id === assign[q.id]).name} with the AI summary.`)}>Assign</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="sup__h">Flagged for quality review</h2>
          <ul className="sup__queue">
            {REVIEW.map(([id, lang, why, hint]) => (
              <li key={id}>
                <span><b className="mono">{id}</b><small>{lang} · {why}</small><small className="sup__hint">{hint}</small></span>
                <button type="button" className="btn btn--sm" onClick={() => toast(`${id} opened for review (demo). Score it and send knowledge fixes to the knowledge team.`)}>Review</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
