// Channels & telephony: every way a citizen reaches the assistant, behind one provider-neutral telephony layer.
// Covers RFP §6.3 (SIP/PRI/PSTN/CPaaS, recording, interruption, silence, retry) and Annexure 2 #5
// (omnichannel and telephony abstraction).
import { useState } from 'react';
import Badge from '../components/Badge.jsx';
import Icon from '../components/Icon.jsx';
import Select from '../components/Select.jsx';
import { useToast } from '../components/Toast.jsx';

const LINES = [
  { number: '1800-11-4455', kind: 'Toll-free', helpline: 'DigiLocker & UMANG', trunk: 'trunk-a', concurrency: '42 / 120', status: 'ok' },
  { number: '1800-11-4456', kind: 'Toll-free · overflow', helpline: 'DigiLocker & UMANG', trunk: 'trunk-b', concurrency: '0 / 60', status: 'ok' },
  { number: '+91 11 4060 2200', kind: 'Geographic', helpline: 'Officer callbacks (outbound)', trunk: 'trunk-a', concurrency: '3 / 30', status: 'ok' },
  { number: 'Web voice', kind: 'WebRTC in the browser', helpline: 'DigiLocker and UMANG sites', trunk: 'webrtc', concurrency: '17 / 500', status: 'ok' },
];

const TRUNKS_SEED = [
  { id: 'trunk-a', name: 'Trunk A', carrier: 'Carrier 1 · SIP over TLS', region: 'Mumbai', codec: 'G.711 / Opus', order: 1, status: 'ok', latency: 38 },
  { id: 'trunk-b', name: 'Trunk B', carrier: 'Carrier 2 · SIP over TLS', region: 'Chennai', codec: 'G.711', order: 2, status: 'ok', latency: 44 },
  { id: 'pri', name: 'PRI gateway', carrier: 'Existing contact-centre PRI (E1)', region: 'Delhi', codec: 'G.711', order: 3, status: 'degraded', latency: 61 },
];

const SNIPPET = `<script src="https://assistant.example.gov.in/widget.js"
  data-helpline="digilocker-umang"
  data-languages="en,hi,te,ml"
  data-voice="true" defer></script>`;

export default function Channels() {
  const toast = useToast();
  const [trunks, setTrunks] = useState(TRUNKS_SEED);
  const [rec, setRec] = useState({ record: true, bargeIn: true, dtmf: true, silence: '8', retries: '2', retention: '90' });
  const set = (k, v) => setRec((r) => ({ ...r, [k]: v }));

  function failover() {
    setTrunks((t) => t.map((x) => ({ ...x, order: x.id === 'trunk-b' ? 1 : x.id === 'trunk-a' ? 2 : x.order })).sort((a, b) => a.order - b.order));
    toast('New calls now route to Trunk B first. Calls in progress stay on Trunk A. Logged in the failover drill history.');
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Channels &amp; telephony</h1>
          <p>One assistant behind every channel. Phone lines reach it through a carrier-neutral SIP layer, so a carrier, PRI or CPaaS can be swapped without touching the assistant.</p>
        </div>
      </div>

      <section className="card">
        <div className="card__head"><div><h2>How a call reaches the assistant</h2><p>Each layer is replaceable on its own</p></div></div>
        <div className="card__body">
          <ol className="flow">
            <li><Icon name="phone" /><b>Citizen</b><span>Phone (PSTN), browser voice, web chat</span></li>
            <li><Icon name="server" /><b>Carriers &amp; gateways</b><span>SIP trunks, PRI, CPaaS</span></li>
            <li className="is-key"><Icon name="plug" /><b>Telephony abstraction</b><span>SIP / WebRTC media server · carrier-neutral</span></li>
            <li><Icon name="sparkle" /><b>AI orchestrator</b><span>STT → knowledge → LLM → TTS</span></li>
            <li><Icon name="headset" /><b>Officers</b><span>Transfer with summary · agent console</span></li>
          </ol>
        </div>
      </section>

      <section className="card">
        <div className="card__head"><div><h2>Numbers and entry points</h2><p>{LINES.length} entry points · concurrency is calls now / licensed</p></div>
          <button type="button" className="btn btn--sm" onClick={() => toast('Request a number (demo): the carrier provisions it on a trunk; no change to the assistant.')}><Icon name="plus" size={16} />Add number</button></div>
        <div className="card__body card__body--flush table-wrap">
          <table className="data">
            <thead><tr><th>Number</th><th>Type</th><th>Helpline</th><th>Route</th><th className="num">Concurrency</th><th>Status</th></tr></thead>
            <tbody>
              {LINES.map((l) => (
                <tr key={l.number}><td className="mono">{l.number}</td><td>{l.kind}</td><td>{l.helpline}</td>
                  <td>{l.trunk === 'webrtc' ? 'WebRTC' : trunks.find((t) => t.id === l.trunk).name}</td><td className="num">{l.concurrency}</td><td><Badge status={l.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__head"><div><h2>Trunks (carrier-neutral)</h2><p>Tried in this order; health-checked every 30 s</p></div>
            <button type="button" className="btn btn--sm" onClick={failover} disabled={trunks[0].id === 'trunk-b'}><Icon name="refresh" size={16} />Fail over to Trunk B</button></div>
          <div className="card__body card__body--flush">
            <ul className="rows">
              {trunks.map((t, i) => (
                <li key={t.id}>
                  <span className="rows__n">{i + 1}</span>
                  <span className="rows__main"><b>{t.name}</b><small>{t.carrier} · {t.region} · {t.codec}</small></span>
                  <span className="rows__side"><Badge status={t.status} /><small>{t.latency} ms</small></span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card">
          <div className="card__head"><div><h2>Web assistant</h2><p>Chat and browser voice on any approved site</p></div>
            <button type="button" className="btn btn--sm" onClick={() => { navigator.clipboard?.writeText(SNIPPET).catch(() => {}); toast('Embed code copied.'); }}>Copy code</button></div>
          <div className="card__body" style={{ display: 'grid', gap: 12 }}>
            <pre className="code">{SNIPPET}</pre>
            <p className="note">Allowed sites: <span className="pill">digilocker.gov.in</span> <span className="pill">web.umang.gov.in</span> · GIGW 3.0 / WCAG 2.1 AA</p>
            <p className="note">Coming next: <Badge tone="muted">WhatsApp</Badge> <Badge tone="muted">SMS link-back</Badge> on the same assistant and knowledge.</p>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__head"><div><h2>Call handling</h2><p>Applies to every voice line</p></div><Badge tone="ok">Stored in India</Badge></div>
        <div className="card__body settings">
          <label className="switch"><input type="checkbox" checked={rec.record} onChange={(e) => set('record', e.target.checked)} /><span className="switch__ui" />
            <span><b>Record calls</b><small>The greeting tells callers the call is recorded. Recordings are never used to train or clone voices.</small></span></label>
          <label className="switch"><input type="checkbox" checked={rec.bargeIn} onChange={(e) => set('bargeIn', e.target.checked)} /><span className="switch__ui" />
            <span><b>Caller can interrupt</b><small>The assistant stops speaking as soon as the caller talks.</small></span></label>
          <label className="switch"><input type="checkbox" checked={rec.dtmf} onChange={(e) => set('dtmf', e.target.checked)} /><span className="switch__ui" />
            <span><b>Keypad (DTMF) fallback</b><small>Menu, reference numbers and OTP by keypad for callers who cannot use speech.</small></span></label>
          <div className="settings__row">
            <div className="field"><span>If the caller is silent</span>
              <Select block label="Silence timeout" value={rec.silence} onChange={(v) => set('silence', v)} options={['5', '8', '12'].map((s) => ({ value: s, label: `Prompt again after ${s} s` }))} /></div>
            <div className="field"><span>Failed turns before an officer</span>
              <Select block label="Failed turns before handoff" value={rec.retries} onChange={(v) => set('retries', v)} options={[{ value: '1', label: '1 failed turn' }, { value: '2', label: '2 failed turns (RFP maximum)' }]} /></div>
            <div className="field"><span>Keep recordings for</span>
              <Select block label="Recording retention" value={rec.retention} onChange={(v) => set('retention', v)} options={['30', '90', '180'].map((d) => ({ value: d, label: `${d} days, then deleted` }))} /></div>
          </div>
        </div>
      </section>
    </>
  );
}
