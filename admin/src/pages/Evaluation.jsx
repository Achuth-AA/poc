import { useEffect, useRef, useState } from 'react';
import Badge from '../components/Badge.jsx';
import { useToast } from '../components/Toast.jsx';
import { pct, stamp } from '../lib/format.js';
import { useStore } from '../store.jsx';
import Icon from '../components/Icon.jsx';

const STEPS = ['Golden Q&A', 'Unanswerable', 'Escalation', 'Red team', 'Audio / STT', 'Latency benchmark'];
const fmt = (m) => (m.unit === 'ms' ? `${m.value.toLocaleString('en-IN')} ms` : pct(m.value, 1));

export default function Evaluation() {
  const { evalReport: R, setEvalReport } = useStore();
  const toast = useToast();
  const [progress, setProgress] = useState(null); // null | step index
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const passed = R.metrics.filter((m) => m.pass).length;

  function run() {
    setProgress(0);
    STEPS.forEach((_, i) => timers.current.push(setTimeout(() => setProgress(i + 1), 600 * (i + 1))));
    timers.current.push(setTimeout(() => {
      const n = Number(R.run.slice(1)) + 1;
      const at = stamp();
      setEvalReport((r) => ({
        ...r, run: `#${n}`, at,
        history: [{ run: `#${n}`, at, acc: r.metrics[0].value, halluc: r.metrics[1].value, p50: r.metrics[7].value, change: 'Manual run' }, ...r.history],
      }));
      setProgress(null);
      toast(`Run #${n} finished (demo data).`);
    }, 600 * STEPS.length + 500));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI quality evaluation</h1>
          <p>Runs the DIC-owned test sets (Annexure 13). Run it before acceptance and after every model, prompt, knowledge or provider change.</p>
        </div>
        <div className="toolbar">
          {progress !== null && (
            <div className="run-progress is-on" role="status">
              <span className="bar"><span style={{ width: `${(progress / STEPS.length) * 100}%` }} /></span>
              <span>{progress === 0 ? 'Starting…' : `${STEPS[Math.min(progress, STEPS.length) - 1]} (${Math.min(progress, STEPS.length)}/${STEPS.length})`}</span>
            </div>
          )}
          <select aria-label="Test suite" defaultValue="all">
            <option value="all">All suites</option><option>Golden Q&amp;A (150)</option><option>Unanswerable (30)</option><option>Escalation (30)</option>
            <option>Red team (40)</option><option>Audio / STT (100)</option><option>Latency benchmark (220 turns)</option>
          </select>
          <button type="button" className="btn btn--primary" disabled={progress !== null} onClick={run}>Run evaluation</button>
        </div>
      </div>

      <section className="card">
        <div className="card__head">
          <div><h2>Run {R.run} · {R.at}</h2><p className="mono">{R.config}</p></div>
          {passed === R.metrics.length ? <Badge tone="ok">All {passed} targets met</Badge> : <Badge tone="warn">{passed} of {R.metrics.length} targets met</Badge>}
        </div>
        <div className="card__body card__body--flush table-wrap">
          <table className="data">
            <thead><tr><th>Metric</th><th className="num">Result</th><th>Target</th><th>Status</th><th className="num">Cases</th><th>RFP ref.</th></tr></thead>
            <tbody>
              {R.metrics.map((m) => (
                <tr key={m.name}>
                  <td className="cell-title">{m.name}</td><td className="num val">{fmt(m)}</td><td>{m.target}</td>
                  <td>{m.pass ? <span className="pass"><Icon name="check" size={14} />Pass</span> : <span className="fail"><Icon name="alert" size={14} />Below target</span>}</td>
                  <td className="num">{m.n}</td><td>{m.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__head"><div><h2>Speech recognition accuracy by language</h2><p>1 − WER (CER for Indic scripts) · tick = target</p></div></div>
          <div className="card__body">
            <div className="budget">
              {R.stt.map((s) => (
                <div key={s.lang} className="budget__row">
                  <span>{s.lang}</span>
                  <span className="budget__bar" title={`target ${pct(s.target)}`}>
                    <span style={{ width: `${s.acc * 100}%`, background: s.acc >= s.target ? 'var(--accent)' : 'var(--bad)' }} />
                    <i style={{ left: `${s.target * 100}%` }} />
                  </span>
                  <span className="num">{pct(s.acc)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card__head"><div><h2>Red-team results</h2><p>Attacks must fail: no data leak, no unauthorised tool call</p></div></div>
          <div className="card__body card__body--flush table-wrap">
            <table className="data">
              <thead><tr><th>Attack type</th><th className="num">Cases</th><th className="num">Blocked</th><th>Result</th></tr></thead>
              <tbody>
                {R.redteam.map((r) => (
                  <tr key={r.cat}><td>{r.cat}</td><td className="num">{r.n}</td><td className="num">{r.blocked}</td>
                    <td>{r.blocked === r.n ? <Badge tone="ok">All blocked</Badge> : <Badge tone="bad">{r.n - r.blocked} got through</Badge>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__head"><div><h2>Run history</h2><p>Regression check after each change</p></div></div>
        <div className="card__body card__body--flush table-wrap">
          <table className="data">
            <thead><tr><th>Run</th><th>When</th><th>What changed</th><th className="num">Accuracy</th><th className="num">Made-up answers</th><th className="num">Median latency</th></tr></thead>
            <tbody>
              {R.history.map((h) => (
                <tr key={h.run}><td className="mono">{h.run}</td><td>{h.at}</td><td>{h.change}</td>
                  <td className="num">{pct(h.acc, 1)}</td><td className="num">{pct(h.halluc, 1)}</td><td className="num">{h.p50} ms</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
