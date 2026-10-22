import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import Icon from '../components/Icon.jsx';
import { HBars, LineChart } from '../components/charts.jsx';
import { useToast } from '../components/Toast.jsx';
import { downloadJson, ms, pct } from '../lib/format.js';
import { useStore } from '../store.jsx';

// Stages in ink steps; the LLM stage, the one this screen is about, takes the data hue.
const STAGE_COLORS = ['var(--c-eos)', 'var(--c-stt)', 'var(--c-ret)', 'var(--data)', 'var(--c-tts)', 'var(--c-pub)'];
const STAGE_SHORT = ['End of speech', 'STT', 'Retrieval', 'LLM first token', 'TTS first audio', 'Publish'];
// Colour only where it means something: the cache hit is the data story, the rest stays neutral.
const ROUTE_COLORS = ['var(--data)', '#b3b6bb', '#b3b6bb', '#b3b6bb', '#b3b6bb'];
const TARGET = 1000;

// Signature element: one voice turn laid out on its own clock, end of caller speech to first reply audio.
function TurnTimeline({ stages }) {
  const total = stages.reduce((a, s) => a + s.ms, 0);
  const scale = Math.max(TARGET, total) * 1.06;
  let at = 0;
  return (
    <div className="turnline">
      <div className="turnline__total"><span className="turnline__num">{total}</span> ms <span className="note">to first audio, median, LLM path</span></div>
      <div className="turnline__track" role="img" aria-label={stages.map((s) => `${s.stage} ${s.ms} ms`).join(', ')}>
        {stages.map((s, i) => {
          const left = (at / scale) * 100; at += s.ms;
          return <span key={s.stage} className="turnline__seg" style={{ left: `${left}%`, width: `${(s.ms / scale) * 100}%`, background: STAGE_COLORS[i] }} title={`${s.stage}: ${s.ms} ms of ${s.budget} ms budget`} />;
        })}
        <i className="turnline__target" style={{ left: `${(TARGET / scale) * 100}%` }}><b>1,000 ms</b></i>
      </div>
      <ol className="turnline__legend">
        {stages.map((s, i) => (
          <li key={s.stage} className={s.ms > s.budget ? 'is-over' : ''}>
            <i style={{ background: STAGE_COLORS[i] }} /><span>{STAGE_SHORT[i] || s.stage}</span><b className="num">{s.ms}</b><span className="note">budget {s.budget} ms</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Dashboard() {
  const { kpis: k, latency: L, cache: c, stageBudget, routes, languages, providers, sessions } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [range, setRange] = useState('24 h');

  // The screen's question: are calls answered inside one second right now? The lead figure answers it.
  const cards = [
    { label: 'Median latency', value: ms(k.p50), meta: `${ms(TARGET - k.p50)} under the 1,000 ms target`, lead: true },
    { label: 'p90 latency', value: ms(k.p90), meta: k.p90 > TARGET ? `${ms(k.p90 - TARGET)} over the 1,000 ms target` : 'inside the 1,000 ms target', good: k.p90 <= TARGET },
    { label: 'Cache hit rate', value: pct(k.cacheHit), meta: 'target 40% or more', good: k.cacheHit >= 0.4 },
    { label: 'Voice calls', value: k.voiceCalls.toLocaleString('en-IN'), meta: `${k.voiceMinutes.toLocaleString('en-IN')} min today` },
    { label: 'Chat sessions', value: k.chatSessions.toLocaleString('en-IN'), meta: 'today' },
    { label: 'Resolved by AI', value: pct(k.resolvedByAi), meta: `${k.handoffs} handed to officers` },
  ];
  const turnTotal = stageBudget.reduce((a, s) => a + s.ms, 0);
  const active = (kind) => providers[kind].options.find((o) => o.id === providers[kind].active);
  const open = (id) => navigate(`/calls?id=${encodeURIComponent(id)}`);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="finding">{k.p90 > TARGET ? <><b>p90 is {ms(k.p90)}, {ms(k.p90 - TARGET)} over target.</b> </> : null}The median voice turn takes {ms(turnTotal)} on the LLM path; language-model first token is its longest stage at {ms(stageBudget[3].ms)}.</p>
          <p className="stamp"><span className="badge badge--live">{k.activeNow} live now</span><span>Availability {pct(k.availability, 2)}</span><span>Updated 10:58 IST</span></p>
        </div>
        <div className="page-head__actions">
          <div className="seg" role="group" aria-label="Time range">
            {['24 h', '7 days', '30 days'].map((r) => (
              <button key={r} type="button" aria-pressed={range === r}
                onClick={() => { setRange(r); if (r !== '24 h') toast('Range switching uses /v1/metrics once the backend is connected.'); }}>{r}</button>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => downloadJson(`metrics-${new Date().toISOString().slice(0, 10)}.json`, { kpis: k, latency: L, cache: c, routes })}>
            <Icon name="upload" size={16} />Export JSON
          </button>
        </div>
      </div>

      <section className="kpis" aria-label="Key numbers">
        {cards.map((card) => (
          <div key={card.label} className={`kpi ${card.lead ? 'kpi--lead' : ''}`}>
            <div className="kpi__label">{card.label}</div>
            <div className="kpi__value">{card.value}</div>
            <div className={`kpi__meta ${card.good === false ? 'bad' : ''}`}>{card.meta}</div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card__head"><div><h2>One voice turn</h2><p>Each stage against its budget; the line is the 1,000 ms target</p></div></div>
        <div className="card__body"><TurnTimeline stages={stageBudget} /></div>
      </section>

      <div className="grid grid--3-1">
        <section className="card">
          <div className="card__head">
            <div><h2>Response latency</h2><p>p50 and p90 per hour, split by cache/rules turns and LLM turns</p></div>
            <div className="legend">
              <span><i style={{ background: 'var(--data)' }} />LLM turns</span>
              <span><i style={{ background: 'var(--c-cache)' }} />Cache and rules turns</span>
              <span className="note">solid p50, dashed p90</span>
            </div>
          </div>
          <div className="card__body">
            <LineChart
              height={260}
              labels={L.hours.map((h) => `${String(h).padStart(2, '0')}:00`)}
              threshold={{ value: 1000, label: '1,000 ms target' }}
              series={[
                { name: 'LLM p50', values: L.llmP50, color: 'var(--data)' },
                { name: 'LLM p90', values: L.llmP90, color: 'var(--data)', dashed: true },
                { name: 'Cache p50', values: L.cacheP50, color: 'var(--c-cache)' },
                { name: 'Cache p90', values: L.cacheP90, color: 'var(--c-cache)', dashed: true },
              ]}
            />
          </div>
        </section>
        <div className="stackcol">
        <section className="card">
          <div className="card__head"><div><h2>Semantic cache</h2><p>Target: at least 40% gain</p></div></div>
          <div className="card__body cache-card">
            <div className="meter">
              <div className="meter__value">{pct(c.hitRate)}<span className="note"> of turns answered from cache</span></div>
              <div className="meter__track" role="img" aria-label={`Cache hit rate ${pct(c.hitRate)}, target 40%`}>
                <span style={{ width: `${c.hitRate * 100}%` }} /><i style={{ left: '40%' }} title="Target 40%" />
              </div>
              <div className="meter__scale"><span>0%</span><span style={{ left: '40%' }}>40% target</span><span>100%</span></div>
            </div>
            <dl className="kv">
              <dt>Status</dt><dd>{c.enabled ? <Badge tone="ok">Enabled</Badge> : <Badge tone="muted">Disabled</Badge>}</dd>
              <dt>Entries</dt><dd>{c.entries.toLocaleString('en-IN')} for KB v{c.kbVersion}</dd>
              <dt>Threshold</dt><dd>cosine ≥ {c.threshold}</dd>
              <dt>False hits</dt><dd>{pct(c.falseHitRate, 1)} (eval set)</dd>
              <dt>Median saving</dt><dd>≈ {ms(L.llmP50[23] - L.cacheP50[23])} per hit</dd>
            </dl>
          </div>
        </section>
          <section className="card">
          <div className="card__head"><div><h2>Active providers</h2></div><button type="button" className="btn btn--sm" onClick={() => navigate('/models')}>Change</button></div>
          <div className="card__body">
            <dl className="kv">
              {['llm', 'stt', 'tts'].map((kind) => (
                <div key={kind} style={{ display: 'contents' }}>
                  <dt>{{ llm: 'Language model', stt: 'Speech to text', tts: 'Text to speech' }[kind]}</dt><dd>{active(kind).name} <Badge status={active(kind).health} /></dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__head"><div><h2>How turns were answered</h2><p>Share of all turns today</p></div></div>
          <div className="card__body"><HBars items={routes.map((r, i) => ({ label: r.route, value: r.share, color: ROUTE_COLORS[i] }))} /></div>
        </section>
        <section className="card">
          <div className="card__head"><div><h2>Languages</h2><p>Share of turns by detected language</p></div></div>
          <div className="card__body"><HBars items={languages.map((l) => ({ label: l.lang, value: l.share, color: '#b3b6bb' }))} /></div>
        </section>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__head">
            <div><h2>Recent calls and chats</h2><p>Click a row to open the full audit trail</p></div>
            <button type="button" className="btn btn--sm" onClick={() => navigate('/calls')}>View all</button>
          </div>
          <div className="card__body card__body--flush table-wrap">
            <table className="data">
              <thead><tr><th>Session</th><th>Channel</th><th>Language</th><th>Started</th><th className="num">Turns</th><th className="num">p50</th><th>Outcome</th></tr></thead>
              <tbody>
                {sessions.slice(0, 6).map((s) => (
                  <tr key={s.id} className="is-clickable" tabIndex={0} onClick={() => open(s.id)} onKeyDown={(e) => e.key === 'Enter' && open(s.id)}>
                    <td><div className="cell-title mono">{s.id}</div><div className="cell-sub">{s.caller}</div></td>
                    <td><span className="cell-title"><Icon name={s.channel === 'voice' ? 'phone' : 'chat'} size={16} />{s.channel === 'voice' ? 'Voice' : 'Chat'}</span></td>
                    <td>{s.lang}</td><td>{s.started}</td>
                    <td className="num">{s.turns}</td><td className="num">{s.p50} ms</td>
                    <td><Badge status={s.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
