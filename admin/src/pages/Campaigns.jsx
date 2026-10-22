// Outbound campaigns: reminder, feedback and survey calls made by the assistant, gated by the TRAI TCCCPR
// checks in RFP Annexure 15 and §15.16. A campaign cannot launch until every check passes.
import { useState } from 'react';
import Badge from '../components/Badge.jsx';
import Icon from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';

const SEED = [
  {
    id: 'c1', name: 'EPF claim pending KYC: reminder', kind: 'Reminder', audience: 4820, langs: 'Hindi, Telugu', when: 'Draft', status: 'draft', progress: 0,
    script: 'Namaste, this is an automated call from the UMANG helpline. Your EPF claim is waiting for your employer to approve your KYC. Press 1 to hear the steps, 2 to talk to an officer, or 9 to stop these calls.',
    checks: { series: true, dlt: true, notice: true, consent: true, dnd: false, hours: true },
  },
  {
    id: 'c2', name: 'DigiLocker maintenance on 2 Nov: notice', kind: 'Reminder', audience: 12400, langs: 'English, Hindi', when: '1 Nov, 10:00–18:00', status: 'scheduled', progress: 0,
    script: 'Namaste, this is an automated call from DigiLocker. DigiLocker will be down for maintenance on 2 November from 1 am to 4 am. Fetch any documents you need before then. Press 9 to stop these calls.',
    checks: { series: true, dlt: true, notice: true, consent: true, dnd: true, hours: true },
  },
  {
    id: 'c3', name: 'Grievance closed: feedback', kind: 'Feedback', audience: 2150, langs: 'All four', when: 'Running since 09:00', status: 'running', progress: 63,
    script: 'Namaste, this is an automated call from the helpline about your recent complaint. On a scale of 1 to 5, how satisfied are you? You can also say it in your own words.',
    checks: { series: true, dlt: true, notice: true, consent: true, dnd: true, hours: true },
    results: { answered: 71, completed: 64, human: 4, optout: 2, csat: 4.1 },
  },
];

const CHECKS = [
  ['series', 'Calls from the 140 / 1600 number series', 'Ordinary 10-digit numbers are not used for automated calls.'],
  ['dlt', 'DLT registration, header and traceability', 'Sender header registered; every call traceable on the DLT portal.'],
  ['notice', 'Auto-dialler notice to the access provider', 'Advance notification acknowledged by the originating carrier.'],
  ['consent', 'Purpose and consent recorded', 'Service-related call to people with an open application; purpose approved.'],
  ['dnd', 'DND scrub of the call list', 'Numbers on the National Customer Preference Register are removed before launch.'],
  ['hours', 'Calling hours 10:00–19:00, no Sundays', 'Calls outside the window are held, not dropped.'],
];

const STATUS = { draft: ['muted', 'Draft'], scheduled: ['info', 'Scheduled'], running: ['live', 'Running'], done: ['ok', 'Completed'] };

export default function Campaigns() {
  const toast = useToast();
  const [list, setList] = useState(SEED);
  const [sel, setSel] = useState('c1');
  const [scrubbing, setScrubbing] = useState(false);
  const c = list.find((x) => x.id === sel);
  const ready = Object.values(c.checks).every(Boolean);
  const update = (fields) => setList((l) => l.map((x) => (x.id === c.id ? { ...x, ...fields } : x)));

  function scrub() {
    setScrubbing(true);
    setTimeout(() => {
      setScrubbing(false);
      update({ checks: { ...c.checks, dnd: true }, audience: c.audience - 312 });
      toast('DND scrub done: 312 numbers removed. 4,508 left on the list.');
    }, 900);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Outbound campaigns</h1>
          <p>Reminder, notice and feedback calls made by the assistant. The assistant says it is automated, offers an officer, and lets people stop the calls. A campaign launches only when every TRAI check passes.</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={() => toast('New campaign (demo): pick an approved script, upload or select the list, then pass the checks.')}><Icon name="plus" size={16} />New campaign</button>
        </div>
      </div>

      <section className="card">
        <div className="card__body card__body--flush table-wrap">
          <table className="data">
            <thead><tr><th>Campaign</th><th>Type</th><th className="num">People</th><th>Languages</th><th>When</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} className={`is-clickable ${x.id === sel ? 'is-selected' : ''}`} tabIndex={0} onClick={() => setSel(x.id)} onKeyDown={(e) => e.key === 'Enter' && setSel(x.id)}>
                  <td><div className="cell-title">{x.name}</div>{x.status === 'running' && <div className="progress"><span style={{ width: `${x.progress}%` }} /></div>}</td>
                  <td>{x.kind}</td><td className="num">{x.audience.toLocaleString('en-IN')}</td><td>{x.langs}</td><td>{x.when}</td>
                  <td><Badge tone={STATUS[x.status][0]}>{STATUS[x.status][1]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__head"><div><h2>{c.name}</h2><p>{c.kind} · {c.audience.toLocaleString('en-IN')} people · {c.langs}</p></div><Badge tone={STATUS[c.status][0]}>{STATUS[c.status][1]}</Badge></div>
          <div className="card__body" style={{ display: 'grid', gap: 14 }}>
            <div className="script"><span className="script__label"><Icon name="volume" size={14} />Opening line (approved script)</span><p>{c.script}</p></div>
            <dl className="kv">
              <dt>If nobody answers</dt><dd>Two more tries, at least 4 hours apart</dd>
              <dt>Caller wants a person</dt><dd>Transferred to the officer queue, or a callback is booked</dd>
              <dt>"Stop these calls"</dt><dd>Number added to the do-not-call list at once</dd>
            </dl>
            {c.results && (
              <div className="tiles">
                <div><b>{c.results.answered}%</b><span>answered</span></div>
                <div><b>{c.results.completed}%</b><span>completed</span></div>
                <div><b>{c.results.human}%</b><span>asked for a person</span></div>
                <div><b>{c.results.csat}</b><span>average rating / 5</span></div>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card__head"><div><h2>Before launch: TRAI checks</h2><p>RFP Annexure 15 · TCCCPR 2018 as amended</p></div>
            {ready ? <Badge tone="ok">All passed</Badge> : <Badge tone="warn">{Object.values(c.checks).filter((v) => !v).length} to do</Badge>}</div>
          <div className="card__body" style={{ display: 'grid', gap: 12 }}>
            <ul className="checklist">
              {CHECKS.map(([k, label, help]) => (
                <li key={k} className={c.checks[k] ? 'is-done' : ''}>
                  <span className="checklist__mark">{c.checks[k] ? <Icon name="check" size={14} /> : null}</span>
                  <span><b>{label}</b><small>{help}</small></span>
                  {!c.checks[k] && k === 'dnd' && <button type="button" className="btn btn--sm" onClick={scrub} disabled={scrubbing}>{scrubbing ? 'Scrubbing…' : 'Run DND scrub'}</button>}
                </li>
              ))}
            </ul>
            {c.status === 'draft' && (
              <button type="button" className="btn btn--primary" disabled={!ready} onClick={() => { update({ status: 'scheduled', when: 'Tomorrow, 10:00–19:00' }); toast('Campaign scheduled for tomorrow 10:00. A supervisor can pause it at any time.'); }}>
                <Icon name="send" size={16} />{ready ? 'Schedule campaign' : 'Pass every check to schedule'}
              </button>
            )}
            {c.status === 'running' && <button type="button" className="btn" onClick={() => { update({ status: 'scheduled', when: 'Paused' }); toast('Campaign paused. Calls in progress finish normally.'); }}><Icon name="pause" size={16} />Pause</button>}
          </div>
        </section>
      </div>
    </>
  );
}
