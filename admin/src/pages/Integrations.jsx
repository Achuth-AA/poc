// Integrations & tools: the systems the assistant can call, added without code, and the exact tools it may use.
// Covers RFP §6.5 (APIs, webhooks, grievance, CRM), §6.8 (allowlisted parameters, least privilege, human
// confirmation, signed webhooks) and Annexure 2 #5 (low/no-code REST, GraphQL, JSON).
import { useState } from 'react';
import Badge from '../components/Badge.jsx';
import Icon from '../components/Icon.jsx';
import Select from '../components/Select.jsx';
import { useToast } from '../components/Toast.jsx';

const CONNECTORS = [
  {
    id: 'status', name: 'Application status', system: 'UMANG / DigiLocker request APIs', type: 'REST', auth: 'OAuth 2.0 client credentials', status: 'ok', p50: 64,
    tools: [{ name: 'get_request_status', method: 'GET /v1/requests/{ref}', params: 'ref: ^(UM|DL)\\d{10}$', confirm: false, auth: 'OTP level 1', limit: '20 / min / session' }],
  },
  {
    id: 'grievance', name: 'Grievance system', system: 'Department grievance portal', type: 'REST', auth: 'mTLS + OAuth 2.0', status: 'ok', p50: 210,
    tools: [
      { name: 'submit_grievance', method: 'POST /v2/grievances', params: 'category ∈ 4 values · details ≤ 300 chars · ref', confirm: true, auth: 'OTP level 1', limit: '3 / day / citizen' },
      { name: 'get_grievance', method: 'GET /v2/grievances/{id}', params: 'id: ^G-\\d{4}-\\d{4}$', confirm: false, auth: 'OTP level 1', limit: '20 / min' },
    ],
  },
  {
    id: 'sms', name: 'SMS gateway', system: 'DLT-registered sender', type: 'REST', auth: 'API key (vault, rotated 30 days)', status: 'ok', p50: 120,
    tools: [{ name: 'send_sms', method: 'POST /send', params: 'to = caller only · template ∈ 6 DLT templates', confirm: false, auth: 'Caller on the line', limit: '2 / session' }],
  },
  {
    id: 'crm', name: 'Citizen CRM', system: 'Case management', type: 'GraphQL', auth: 'OAuth 2.0 client credentials', status: 'ok', p50: 88,
    tools: [{ name: 'create_case', method: 'mutation createCase', params: 'summary, channel, language, outcome', confirm: false, auth: 'Service only', limit: '—' }],
  },
  {
    id: 'hooks', name: 'Event webhooks', system: 'Department ticketing / SIEM', type: 'Webhook', auth: 'HMAC-SHA256 signed · replay window 5 min', status: 'degraded', p50: 340,
    tools: [{ name: 'events: call.ended, handoff.requested, ticket.created', method: 'POST (outbound)', params: 'no personal data in payload', confirm: false, auth: '—', limit: 'retries 5× with back-off' }],
  },
];

const SAMPLE = {
  REST: { url: 'https://api.example.gov.in/v1/requests/UM2610078812', body: '' },
  GraphQL: { url: 'https://crm.example.gov.in/graphql', body: '{ case(id: "C-5521") { status updatedAt } }' },
  Webhook: { url: 'https://tickets.example.gov.in/hooks/assistant', body: '{ "event": "ticket.created", "id": "G-2026-0512" }' },
};

export default function Integrations() {
  const toast = useToast();
  const [sel, setSel] = useState(CONNECTORS[1].id);
  const [form, setForm] = useState({ type: 'REST', name: 'Application status (staging)', url: SAMPLE.REST.url, auth: 'oauth', body: '' });
  const [test, setTest] = useState(null);
  const c = CONNECTORS.find((x) => x.id === sel);

  function setType(type) { setForm((f) => ({ ...f, type, url: SAMPLE[type].url, body: SAMPLE[type].body })); setTest(null); }
  function runTest() {
    setTest({ busy: true });
    setTimeout(() => setTest({
      ms: form.type === 'GraphQL' ? 91 : 63,
      body: form.type === 'Webhook' ? '{ "received": true, "signatureValid": true }' : form.type === 'GraphQL'
        ? '{ "data": { "case": { "status": "IN_PROGRESS", "updatedAt": "2026-10-21T11:02:00+05:30" } } }'
        : '{\n  "ref": "UM2610078812",\n  "service": "EPF final settlement claim",\n  "status": "Under processing",\n  "nextStep": "Settlement within 20 days of filing"\n}',
    }), 700);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Integrations &amp; tools</h1>
          <p>Connect department systems without code, then choose exactly which actions the assistant may take. Every parameter is checked against an allowlist; irreversible actions wait for the citizen to confirm.</p>
        </div>
      </div>

      <div className="grid grid--1-2">
        <section className="card">
          <div className="card__head"><div><h2>Connected systems</h2><p>{CONNECTORS.length} connectors · secrets in the vault</p></div></div>
          <div className="card__body card__body--flush">
            <ul className="rows rows--pick">
              {CONNECTORS.map((x) => (
                <li key={x.id}>
                  <button type="button" aria-pressed={x.id === sel} onClick={() => setSel(x.id)}>
                    <span className="rows__icon"><Icon name={x.type === 'Webhook' ? 'send' : 'plug'} size={18} /></span>
                    <span className="rows__main"><b>{x.name}</b><small>{x.system}</small></span>
                    <span className="rows__side"><Badge tone="info">{x.type}</Badge><Badge status={x.status} /></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card">
          <div className="card__head"><div><h2>{c.name}</h2><p>{c.type} · {c.auth} · median {c.p50} ms</p></div>
            <button type="button" className="btn btn--sm" onClick={() => toast(`Credentials for ${c.name} rotated. The old secret stops working in 15 minutes.`)}><Icon name="key" size={16} />Rotate secret</button></div>
          <div className="card__body card__body--flush table-wrap">
            <table className="data">
              <thead><tr><th>Tool the assistant can call</th><th>Allowed parameters</th><th>Needs</th><th>Limit</th></tr></thead>
              <tbody>
                {c.tools.map((t) => (
                  <tr key={t.name}>
                    <td><div className="cell-title mono">{t.name}</div><div className="cell-sub mono">{t.method}</div></td>
                    <td className="mono" style={{ fontSize: 12 }}>{t.params}</td>
                    <td>{t.confirm ? <Badge tone="warn">Citizen confirms</Badge> : null} <span className="cell-sub">{t.auth}</span></td>
                    <td className="cell-sub">{t.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card__body"><p className="note"><Icon name="shield" size={14} /> Anything not listed here is refused, and the refusal is logged. The assistant's credentials can only call these tools (least privilege).</p></div>
        </section>
      </div>

      <section className="card">
        <div className="card__head"><div><h2>Add a connector</h2><p>No code: describe the endpoint, test it, then expose it as a tool</p></div></div>
        <div className="card__body builder">
          <div className="builder__form">
            <div className="seg" role="group" aria-label="Connector type">
              {['REST', 'GraphQL', 'Webhook'].map((t) => <button key={t} type="button" aria-pressed={form.type === t} onClick={() => setType(t)}>{t === 'Webhook' ? 'Webhook (outbound)' : t}</button>)}
            </div>
            <label className="field"><span>Name</span><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>{form.type === 'Webhook' ? 'Send events to' : 'Endpoint'}</span><input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
            <div className="field"><span>Authentication</span>
              <Select block label="Authentication" value={form.auth} onChange={(v) => setForm({ ...form, auth: v })}
                options={[{ value: 'oauth', label: 'OAuth 2.0 client credentials' }, { value: 'mtls', label: 'Mutual TLS (mTLS)' }, { value: 'key', label: 'API key from the vault' }, { value: 'hmac', label: 'HMAC-signed (webhooks)' }]} /></div>
            {form.type !== 'REST' && <label className="field"><span>{form.type === 'GraphQL' ? 'Query' : 'Sample payload (JSON)'}</span><textarea rows={3} className="mono" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>}
            <div className="toolbar">
              <button type="button" className="btn btn--primary" onClick={runTest} disabled={test?.busy}><Icon name="play" size={16} />{test?.busy ? 'Calling…' : 'Test call'}</button>
              <button type="button" className="btn" disabled={!test || test.busy} onClick={() => toast(`"${form.name}" saved as a draft. It is not callable until an admin approves it.`)}>Save as draft</button>
            </div>
          </div>
          <div className="builder__out" aria-live="polite">
            {!test && <p className="note">Run a test call to see the response here. Only staging data is used.</p>}
            {test?.busy && <p className="note">Calling {form.url}…</p>}
            {test?.body && (<><p className="note"><Badge tone="ok">200 OK</Badge> in {test.ms} ms · response fields can be mapped to tool outputs</p><pre className="code">{test.body}</pre></>)}
          </div>
        </div>
      </section>
    </>
  );
}
