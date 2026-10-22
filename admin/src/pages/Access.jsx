// Access & security: who can do what, how they sign in, how systems authenticate, and where data lives.
// Covers RFP §6.8 (RBAC, secrets, retention, masking, redaction), §6.11 (data in India, provider locations),
// Annexure 2 #5 (authentication, SSO and API security), Annexure 12 (retention, erasure) and Annexure 23 #10–13.
import { useState } from 'react';
import Badge from '../components/Badge.jsx';
import Icon from '../components/Icon.jsx';
import Select from '../components/Select.jsx';
import { useToast } from '../components/Toast.jsx';
import { useStore } from '../store.jsx';

const ROLES = ['Admin', 'Knowledge admin', 'Supervisor', 'Officer', 'Auditor'];
const PERMS_SEED = [
  ['Publish knowledge', [1, 1, 0, 0, 0]],
  ['Change models and providers', [1, 0, 0, 0, 0]],
  ['Approve model or prompt changes', [1, 0, 0, 0, 0]],
  ['Listen, whisper and barge on calls', [1, 0, 1, 0, 0]],
  ['Answer handoffs and callbacks', [0, 0, 1, 1, 0]],
  ['See citizen personal data', [0, 0, 1, 1, 0]],
  ['Launch outbound campaigns', [1, 0, 1, 0, 0]],
  ['Read audit logs and exports', [1, 0, 1, 0, 1]],
  ['Manage users and roles', [1, 0, 0, 0, 0]],
];
const USERS = [
  ['Meera Iyer', 'meera.iyer@dic.gov.in', 'Admin', 'Today 10:58', true],
  ['Vikram Shah', 'vikram.shah@negd.gov.in', 'Knowledge admin', 'Today 08:05', true],
  ['Arjun Nair', 'arjun.nair@dic.gov.in', 'Admin', 'Yesterday', true],
  ['Rekha Menon', 'rekha.menon@dic.gov.in', 'Supervisor', 'Today 09:30', true],
  ['Sunita Sharma', 'sunita.sharma@dic.gov.in', 'Officer', 'Today 09:02', true],
  ['CAG audit team', 'audit.team@cag.gov.in', 'Auditor', '12 Oct', true],
];
const CLIENTS = [
  ['orchestrator-prod', 'tools:status tools:grievance', '15 min tokens', 'Rotated 2 days ago'],
  ['siem-export', 'metrics:read logs:stream', '15 min tokens', 'Rotated 11 days ago'],
  ['dept-crm', 'cases:write', 'mTLS + 15 min tokens', 'Rotated 20 days ago'],
];

export default function Access() {
  const toast = useToast();
  const { providers } = useStore();
  const [perms, setPerms] = useState(PERMS_SEED);
  const [sso, setSso] = useState({ proto: 'saml', enforce: true, mfa: true });
  const [keep, setKeep] = useState({ recordings: '90', transcripts: '180', logs: '365' });
  const [mask, setMask] = useState({ aadhaar: true, phone: true, bank: true, address: false });

  const toggle = (row, col) => setPerms((p) => p.map(([n, v], i) => (i === row ? [n, v.map((x, j) => (j === col ? 1 - x : x))] : [n, v])));
  const where = ['llm', 'stt', 'tts'].flatMap((k) => providers[k].options.map((o) => [k.toUpperCase(), o.name, o.vendor, o.region]));
  const toConfirm = where.filter((w) => /confirm/i.test(w[3])).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Access &amp; security</h1>
          <p>Role-based access for people, short-lived credentials for systems, and data that stays in India. Every change here is written to the audit log.</p>
        </div>
      </div>

      <section className="card">
        <div className="card__head"><div><h2>Roles and permissions</h2><p>Least privilege: tick only what a role needs. Admin cannot lose "Manage users".</p></div></div>
        <div className="card__body card__body--flush table-wrap">
          <table className="data matrix">
            <thead><tr><th>Permission</th>{ROLES.map((r) => <th key={r} className="matrix__role">{r}</th>)}</tr></thead>
            <tbody>
              {perms.map(([name, v], i) => (
                <tr key={name}><td>{name}</td>
                  {v.map((on, j) => {
                    const locked = name === 'Manage users and roles' && j === 0;
                    return (
                      <td key={ROLES[j]} className="matrix__cell">
                        <button type="button" className={`tick ${on ? 'is-on' : ''}`} aria-pressed={!!on} disabled={locked}
                          aria-label={`${ROLES[j]}: ${name}`} onClick={() => toggle(i, j)}>{on ? <Icon name="check" size={14} /> : null}</button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid--3-1">
        <section className="card">
          <div className="card__head"><div><h2>People</h2><p>{USERS.length} users · signed in through government SSO</p></div>
            <button type="button" className="btn btn--sm" onClick={() => toast('Invitation sent (demo). The person signs in with their government SSO account.')}><Icon name="plus" size={16} />Invite</button></div>
          <div className="card__body card__body--flush table-wrap">
            <table className="data">
              <thead><tr><th>Name</th><th>Role</th><th>Last sign-in</th><th>MFA</th></tr></thead>
              <tbody>
                {USERS.map(([n, e, r, last, mfa]) => (
                  <tr key={e}><td><div className="cell-title">{n}</div><div className="cell-sub">{e}</div></td><td><Badge tone={r === 'Admin' ? 'info' : 'muted'}>{r}</Badge></td><td>{last}</td>
                    <td>{mfa ? <Badge tone="ok">On</Badge> : <Badge tone="bad">Off</Badge>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__head"><div><h2>Single sign-on</h2><p>Government identity provider</p></div><Badge tone="ok">Connected</Badge></div>
          <div className="card__body settings">
            <div className="seg seg--fill" role="group" aria-label="SSO protocol">
              <button type="button" aria-pressed={sso.proto === 'saml'} onClick={() => setSso({ ...sso, proto: 'saml' })}>SAML 2.0</button>
              <button type="button" aria-pressed={sso.proto === 'oidc'} onClick={() => setSso({ ...sso, proto: 'oidc' })}>OpenID Connect</button>
            </div>
            <dl className="kv"><dt>Identity provider</dt><dd>Government SSO (Parichay)</dd><dt>Session</dt><dd>8 hours, 30 min idle</dd></dl>
            <label className="switch"><input type="checkbox" checked={sso.enforce} onChange={(e) => setSso({ ...sso, enforce: e.target.checked })} /><span className="switch__ui" /><span>Only allow SSO sign-in</span></label>
            <label className="switch"><input type="checkbox" checked={sso.mfa} onChange={(e) => setSso({ ...sso, mfa: e.target.checked })} /><span className="switch__ui" /><span>Require MFA</span></label>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__head"><div><h2>System credentials</h2><p>OAuth 2.0 client credentials with short-lived tokens; secrets live in the vault and are never shown again</p></div>
          <button type="button" className="btn btn--sm" onClick={() => toast('New client created (demo). Copy the secret now; it is shown once.')}><Icon name="key" size={16} />New client</button></div>
        <div className="card__body card__body--flush table-wrap">
          <table className="data">
            <thead><tr><th>Client</th><th>Scopes</th><th>Tokens</th><th>Secret</th><th /></tr></thead>
            <tbody>
              {CLIENTS.map(([id, scopes, tok, rot]) => (
                <tr key={id}><td className="mono">{id}</td><td className="mono" style={{ fontSize: 12 }}>{scopes}</td><td>{tok}</td><td className="cell-sub">{rot}</td>
                  <td className="num"><button type="button" className="btn btn--sm" onClick={() => toast(`${id}: secret rotated. The old one stops working in 15 minutes.`)}>Rotate</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__head"><div><h2>Where data is processed</h2><p>Every model component and its hosting region (RFP §6.11)</p></div>{toConfirm ? <Badge tone="warn">{toConfirm} regions to confirm</Badge> : <Badge tone="ok">All in India</Badge>}</div>
          <div className="card__body card__body--flush table-wrap">
            <table className="data">
              <thead><tr><th>Stage</th><th>Component</th><th>Vendor</th><th>Region</th></tr></thead>
              <tbody>
                {where.map(([k, n, v, r]) => <tr key={k + n}><td><Badge tone="muted">{k}</Badge></td><td>{n}</td><td>{v}</td><td>{/confirm/i.test(r) ? <Badge tone="warn">{r}</Badge> : r}</td></tr>)}
                <tr><td><Badge tone="muted">DATA</Badge></td><td>Recordings, transcripts, vectors, logs</td><td>Government cloud</td><td>India (Mumbai, Chennai DR)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__head"><div><h2>Retention and redaction</h2><p>Erasure also clears derived stores (Annexure 12)</p></div></div>
          <div className="card__body settings">
            <div className="settings__row">
              {[['recordings', 'Call recordings', ['30', '90', '180']], ['transcripts', 'Transcripts', ['90', '180', '365']], ['logs', 'Audit logs', ['365', '730', '1825']]].map(([k, label, opts]) => (
                <div className="field" key={k}><span>{label}</span>
                  <Select block label={label} value={keep[k]} onChange={(v) => setKeep({ ...keep, [k]: v })} options={opts.map((d) => ({ value: d, label: `${d} days` }))} /></div>
              ))}
            </div>
            <p className="note">Mask before anything is stored or sent to a model:</p>
            <div className="chips">
              {[['aadhaar', 'Aadhaar numbers'], ['phone', 'Phone numbers'], ['bank', 'Bank accounts'], ['address', 'Home address']].map(([k, label]) => (
                <button key={k} type="button" className="chip" aria-pressed={mask[k]} onClick={() => setMask({ ...mask, [k]: !mask[k] })}>{mask[k] && <Icon name="check" size={14} />}{label}</button>
              ))}
            </div>
            <button type="button" className="btn" onClick={() => toast('Erasure request logged (demo): recordings, transcripts, vectors and backups for that number are queued for deletion within 72 hours.')}><Icon name="trash" size={16} />Erase a citizen's data</button>
          </div>
        </section>
      </div>
    </>
  );
}
