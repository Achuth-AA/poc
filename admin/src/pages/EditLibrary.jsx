// Edit knowledge library: its own page (not a dialog). Pick sources from a grid of connectors
// (files, Google Drive, public and internal web pages, data tables, an API), set who can use each,
// then one "Update library" reads, chunks, embeds, safety-checks, publishes the next version and clears the cache.
// A source that is a new version of one already live (guidelines.pdf v1 → v2) is mapped to it: the document keeps
// its identity and history, moves to the next version, and its old passages are deleted so they can never be cited.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Overlay.jsx';
import { useToast } from '../components/Toast.jsx';
import { stamp } from '../lib/format.js';
import { useStore } from '../store.jsx';
import Icon from '../components/Icon.jsx';

const TTL_OPTIONS = [7, 30, 90];

// The connectors shown as cards. `pick` says how the Add button collects the source.
const CONNECTORS = [
  { id: 'upload', name: 'Files', icon: 'upload', text: 'Upload PDF, DOCX or TXT from your computer', pick: 'file', accept: '.pdf,.docx,.txt', types: ['PDF', 'DOCX', 'TXT'] },
  { id: 'drive', name: 'Google Drive', icon: 'drive', text: 'Select docs from the shared helpline folder', pick: 'drive' },
  { id: 'public-url', name: 'Public URL', icon: 'globe', text: 'Add public web pages, such as an FAQ page', pick: 'url' },
  { id: 'internal-url', name: 'Internal URL', icon: 'link', text: 'Add intranet pages. Officers only by default', pick: 'url' },
  { id: 'table', name: 'Data table', icon: 'table', text: 'CSV or Excel for lookups, like request status', pick: 'file', accept: '.csv,.xlsx', types: ['CSV', 'XLSX'] },
  { id: 'api', name: 'API', icon: 'code', text: 'A read-only department API the assistant can call', pick: 'api', advanced: true },
];
const BY_ID = Object.fromEntries(CONNECTORS.map((c) => [c.id, c]));

// Files in the shared Drive folder (mock of the Drive picker).
const DRIVE_FILES = [
  { name: 'DigiLocker user FAQs v5.pdf', type: 'PDF', size: 1720000 },
  { name: 'UMANG user guide, Nov 2026.docx', type: 'DOCX', size: 566000 },
  { name: 'DigiLocker issuer list, Oct 2026.pdf', type: 'PDF', size: 412000 },
  { name: 'UMANG new services, Oct 2026.docx', type: 'DOCX', size: 186000 },
  { name: 'Helpdesk FAQ additions.docx', type: 'DOCX', size: 94000 },
  { name: 'EPFO claim SOP for officers.pdf', type: 'PDF', size: 640000, audience: 'internal' },
  { name: 'Refund timelines by department.xlsx', type: 'XLSX', size: 38000 },
];

const uid = () => Math.random().toString(36).slice(2, 8);
const isTable = (type) => type === 'CSV' || type === 'XLSX';

// Words that name a version or a date, not the document: "v5", "final", "Nov 2026", "rev2", "(1)".
const NOISE = new Set('v ver version rev final draft new updated latest copy the of and a an jan feb mar apr may jun jul aug sep sept oct nov dec january february march april june july august september october november december'.split(' '));
function words(name) {
  return name.toLowerCase().replace(/\.[a-z0-9]{2,5}$/, '').replace(/[_\-–,.()]+/g, ' ').split(/\s+/)
    .filter((w) => w && !NOISE.has(w) && !/^v?\d+$/.test(w) && !/^rev\d+$/.test(w))
    .map((w) => w.replace(/s$/, ''));
}
// The live document this source most likely replaces: same file name, or the same title words (Jaccard 0.6 or more).
export function findReplaced(name, documents) {
  const w = new Set(words(name));
  let best = null;
  for (const d of documents) {
    if (d.status !== 'published') continue;
    if (d.file && d.file.toLowerCase() === name.toLowerCase()) return d;
    const t = new Set([...words(d.title), ...words(d.file || '')]);
    const inter = [...w].filter((x) => t.has(x)).length;
    const score = inter / new Set([...w, ...t]).size;
    if (w.size && score >= 0.6 && (!best || score > best.score)) best = { doc: d, score };
  }
  return best ? best.doc : null;
}

export default function EditLibrary() {
  const { kb, cache, documents, setDocuments, setChunks, applyKbChange, warmCache, user } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const forcedId = params.get('replace');   // "Upload new version" from a source's menu
  const forced = documents.find((d) => d.id === forcedId);
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(null); // connector id whose dialog is open
  const [phase, setPhase] = useState('pick'); // pick | run | done
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const fileFor = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Each new item is mapped to the live document it replaces (or to the one chosen from a source's menu).
  const add = (list) => setItems((x) => {
    const taken = new Set(x.map((i) => i.replaces).filter(Boolean));
    return [...x, ...list.map((it, n) => {
      const pick = forced && !taken.has(forced.id) && n === 0 && !x.length ? forced : findReplaced(it.name, documents);
      const replaces = pick && !taken.has(pick.id) ? pick.id : '';
      if (replaces) taken.add(replaces);
      return { ...it, replaces, ...(pick && replaces ? { audience: pick.audience } : {}) };
    })];
  });
  const update = (id, fields) => setItems((x) => x.map((y) => (y.id === id ? { ...y, ...fields } : y)));

  function onAdd(c) {
    if (c.pick === 'file') { fileFor.current = c; fileRef.current.accept = c.accept; fileRef.current.click(); return; }
    setAdding(c.id);
  }

  function addFiles(files) {
    const c = fileFor.current;
    const next = [];
    files.forEach((f) => {
      const ext = (f.name.split('.').pop() || '').toUpperCase();
      if (!c.types.includes(ext)) { toast(`${f.name}: use ${c.types.join(', ')}`); return; }
      next.push({ id: uid(), source: c.id, name: f.name, type: ext, size: f.size, audience: isTable(ext) ? 'tool' : 'public' });
    });
    add(next);
  }

  const replacing = items.filter((it) => it.replaces).map((it) => documents.find((d) => d.id === it.replaces)).filter(Boolean);
  const oldPassages = replacing.reduce((a, d) => a + (d.chunks || 0), 0);
  const steps = [
    `Reading ${items.length} source${items.length === 1 ? '' : 's'}`,
    ...(items.some((it) => it.type === 'URL') ? ['Taking snapshots of web pages'] : []),
    'Splitting into passages with page numbers',
    'Creating embeddings (bge-m3)',
    'Checking for hidden instructions',
    ...(replacing.length ? [`Retiring ${oldPassages.toLocaleString('en-IN')} old passages from ${replacing.length} replaced version${replacing.length === 1 ? '' : 's'}`] : []),
    `Publishing as version v${kb.version + 1}`,
    `Clearing ${cache.entries.toLocaleString('en-IN')} cached answers from v${kb.version}`,
  ];

  function run() {
    setPhase('run');
    setStep(0);
    steps.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i + 1), 600 * (i + 1))));
    timers.current.push(setTimeout(() => {
      const now = stamp();
      const fresh = (it) => {
        const web = it.type === 'URL' || it.type === 'API';
        return {
          file: it.file || it.name, type: it.type, audience: it.audience,
          size: web ? (it.type === 'API' ? 'API' : 'web page') : `${Math.max(1, Math.round(it.size / 1024))} KB`,
          ...(it.audience === 'tool'
            ? { rows: 50 + Math.floor(Math.random() * 900), lookup: it.lookup || 'id', tool: it.tool, chunks: 0 }
            : { chunks: 8 + Math.floor(Math.random() * 40), pages: web ? undefined : 2 + Math.floor(Math.random() * 20) }),
          ...(it.ttl ? { refreshDays: it.ttl } : {}),
          source: it.source, updated: now, by: user.email,
        };
      };
      const added = items.filter((it) => !it.replaces).map((it) => ({
        id: `u${Date.now()}${uid()}`, title: it.type === 'URL' || it.type === 'API' ? it.name : it.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
        version: 1, status: 'published', history: [], ...fresh(it),
      }));
      // Replacements keep the document's id and title; the old version moves into its history.
      const replaced = items.filter((it) => it.replaces).map((it) => {
        const old = documents.find((d) => d.id === it.replaces);
        return { id: old.id, prev: old, next: { ...old, ...fresh(it), version: old.version + 1, history: [{ version: old.version, file: old.file, updated: old.updated, by: old.by, passages: old.chunks || 0, retired: now }, ...(old.history || [])] } };
      });
      const byId = Object.fromEntries(replaced.map((x) => [x.id, x.next]));
      setDocuments((docs) => [...added, ...docs.map((d) => byId[d.id] || d)]);
      setChunks((c) => ({
        ...c,
        ...Object.fromEntries([...added, ...replaced.map((x) => x.next)].map((d) => [d.id, [{ page: 1, section: 'Preview', text: `Passages from ${d.file} appear here once the ingestion worker processes the real source.` }]])),
      }));
      const what = [
        ...replaced.map((x) => `Replaced "${x.prev.title}" v${x.prev.version} → v${x.next.version}`),
        ...(added.length ? [`Added ${added.map((d) => `"${d.title}"`).join(', ')}`] : []),
      ].join('; ');
      const r = applyKbChange(note.trim() ? `${note.trim()} (${what})` : what);
      setResult({ ...r, added: added.length, replaced: replaced.length, retired: replaced.reduce((a, x) => a + (x.prev.chunks || 0), 0) });
      setPhase('done');
    }, 600 * steps.length + 400));
  }

  if (phase === 'done' && result) {
    return (
      <section className="lib">
        <div className="upd__done">
          <div className="big" aria-hidden="true"><Icon name="check" size={26} /></div>
          <h1>Library live as v{result.to}</h1>
          <p>
            {result.added ? `${result.added} source${result.added === 1 ? '' : 's'} added. ` : ''}
            {result.replaced ? `${result.replaced} replaced by a new version; ${result.retired.toLocaleString('en-IN')} old passages deleted. ` : ''}
            {result.cleared.toLocaleString('en-IN')} cached answers from v{result.from} cleared. New calls and chats use it now.
          </p>
          <div className="toolbar" style={{ justifyContent: 'center', marginTop: 8 }}>
            <button type="button" className="btn" onClick={() => toast(`Pre-warmed ${warmCache()} FAQ answers for KB v${result.to}.`)}>Pre-warm cache</button>
            <Link className="btn" to="/models">Test the assistant</Link>
            <Link className="btn btn--primary" to="/knowledge">Back to knowledge base</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lib" aria-labelledby="libTitle">
      <div className="lib__top">
        <Link to="/knowledge" className="lib__back"><Icon name="arrowLeft" size={18} />Knowledge base</Link>
        <Link className="btn btn--sm" to="/models"><Icon name="play" size={16} />Test assistant</Link>
      </div>

      <h1 id="libTitle" className="lib__title">{forced ? `New version of “${forced.title}”` : 'Edit knowledge library'}</h1>
      <ul className="lib__rules">
        <li>Add the information the assistant needs to answer citizens and officers. Web pages are imported as a snapshot of their contents at that moment.</li>
        <li>Web snapshots have a time to live (7, 30 or 90 days, set per page). They are refreshed automatically before they expire; if a refresh fails the page stays live and you are alerted.</li>
        <li>A file that is a new version of a live document (for example guidelines.pdf, then guidelines v2.pdf) replaces it: the old version’s passages are deleted and it stays only in the document’s history.</li>
        <li>Only add content that the people using it are allowed to see. Mark staff material <strong>Officers only</strong>, and never add personal data such as Aadhaar or bank numbers.</li>
      </ul>

      {phase === 'run' ? (
        <div className="lib__run" role="status" aria-live="polite">
          <div className="upd__bar"><span style={{ width: `${(step / steps.length) * 100}%` }} /></div>
          <ol className="upd__steps">
            {steps.map((s, i) => (
              <li key={s} className={i < step ? 'is-done' : i === step ? 'is-active' : ''}>
                <span className="tick" aria-hidden="true">{i < step ? <Icon name="check" size={14} /> : ''}</span><span>{s}</span><span className="note">{i < step ? 'done' : ''}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <h2 className="lib__count">{items.length ? `${items.length} source${items.length === 1 ? '' : 's'} selected${replacing.length ? `, ${replacing.length} replacing a live document` : ''}` : 'No sources selected'}</h2>
          {forced && !items.length && <p className="note" style={{ margin: 0 }}>Add the new file from any source below. It will replace “{forced.title}” v{forced.version} and its {forced.chunks || 0} passages.</p>}
          {items.length > 0 && (
            <ul className="lib__list">
              {items.map((it) => (
                <li key={it.id} className="lib__item">
                  <span className="source__icon" title={BY_ID[it.source].name}><Icon name={BY_ID[it.source].icon} size={20} /></span>
                  <span className="lib__name">
                    <span className="source__title">{it.name}</span>
                    <span className="note">{BY_ID[it.source].name}{it.type !== 'URL' && it.type !== 'API' ? `, ${it.type}` : ''}{it.tool ? `, tool ${it.tool}` : ''}</span>
                    <label className="lib__map">
                      <span className="sr-only">What {it.name} is</span>
                      <select value={it.replaces} onChange={(e) => update(it.id, { replaces: e.target.value })}>
                        <option value="">Add as a new source</option>
                        {documents.filter((d) => d.status === 'published' && (d.audience === 'tool') === (it.audience === 'tool')).map((d) => (
                          <option key={d.id} value={d.id} disabled={items.some((o) => o.id !== it.id && o.replaces === d.id)}>Replaces “{d.title}” v{d.version} → v{d.version + 1}</option>
                        ))}
                      </select>
                    </label>
                  </span>
                  {it.ttl && (
                    <select value={it.ttl} aria-label={`Refresh ${it.name} every`} onChange={(e) => update(it.id, { ttl: Number(e.target.value) })}>
                      {TTL_OPTIONS.map((d) => <option key={d} value={d}>Refresh every {d} days</option>)}
                    </select>
                  )}
                  <select value={it.audience} aria-label={`Who can use ${it.name}`} disabled={it.audience === 'tool'} onChange={(e) => update(it.id, { audience: e.target.value })}>
                    {it.audience === 'tool' ? <option value="tool">Data for a tool</option> : <><option value="public">Public</option><option value="internal">Officers only</option></>}
                  </select>
                  <button type="button" className="icon-btn" aria-label={`Remove ${it.name}`} onClick={() => setItems((x) => x.filter((y) => y.id !== it.id))}><Icon name="x" /></button>
                </li>
              ))}
            </ul>
          )}

          <div className="lib__grid">
            {CONNECTORS.map((c) => (
              <div key={c.id} className="lib__card">
                <div className="lib__card-head">
                  <span className="lib__card-icon"><Icon name={c.icon} size={20} /></span>
                  <span className="lib__card-name">{c.name}{c.advanced && <small>Advanced</small>}</span>
                  <button type="button" className="btn btn--sm" onClick={() => onAdd(c)} aria-label={`Add from ${c.name}`}>Add</button>
                </div>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" multiple className="sr-only" tabIndex={-1} onChange={(e) => { addFiles([...e.target.files]); e.target.value = ''; }} />

          <label className="field lib__note"><span>What changed? (optional, shown in the version history)</span>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. New UMANG services for November" /></label>

          <div className="lib__foot">
            <p className="note">Live now: v{kb.version}. Updating publishes v{kb.version + 1}{replacing.length ? `, deletes ${oldPassages.toLocaleString('en-IN')} old passages` : ''} and clears {cache.entries.toLocaleString('en-IN')} cached answers, so nobody gets an outdated answer.</p>
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/knowledge')}>Cancel</button>
            <button type="button" className="btn btn--primary" disabled={!items.length} onClick={run}><Icon name="book" size={16} />Update library</button>
          </div>
        </>
      )}

      <DrivePicker open={adding === 'drive'} onClose={() => setAdding(null)}
        onPick={(files) => { add(files.map((f) => ({ id: uid(), source: 'drive', ...f, audience: f.audience || (isTable(f.type) ? 'tool' : 'public') }))); setAdding(null); }} />
      <UrlDialog connector={adding === 'public-url' || adding === 'internal-url' ? BY_ID[adding] : null} onClose={() => setAdding(null)}
        onAdd={(urls, audience) => { add(urls.map((u) => ({ id: uid(), source: adding, name: u.replace(/^https?:\/\//, ''), type: 'URL', size: 0, audience, ttl: 30 }))); setAdding(null); }} />
      <ApiDialog open={adding === 'api'} onClose={() => setAdding(null)}
        onAdd={(api) => { add([{ id: uid(), source: 'api', type: 'API', size: 0, audience: 'tool', ...api }]); setAdding(null); }} />
    </section>
  );
}

function DrivePicker({ open, onClose, onPick }) {
  const [chosen, setChosen] = useState([]);
  useEffect(() => { if (open) setChosen([]); }, [open]);
  const toggle = (name) => setChosen((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]));
  return (
    <Modal open={open} onClose={onClose} title="Select from Google Drive"
      footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" disabled={!chosen.length} onClick={() => onPick(DRIVE_FILES.filter((f) => chosen.includes(f.name)))}>Add {chosen.length || ''}</button></>}>
      <p className="note" style={{ marginTop: 0 }}>Shared drive · Helpline knowledge (demo). The assistant reads a copy; later edits in Drive are picked up on the next refresh.</p>
      <ul className="lib__picker">
        {DRIVE_FILES.map((f) => (
          <li key={f.name}>
            <label>
              <input type="checkbox" checked={chosen.includes(f.name)} onChange={() => toggle(f.name)} />
              <Icon name={isTable(f.type) ? 'table' : 'file'} size={18} />
              <span>{f.name}</span>
              <span className="note">{f.audience === 'internal' ? 'Officers only · ' : ''}{Math.round(f.size / 1024)} KB</span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function UrlDialog({ connector, onClose, onAdd }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const internal = connector?.id === 'internal-url';
  useEffect(() => { if (connector) { setText(''); setError(''); } }, [connector]);
  function submit() {
    const urls = text.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
    if (!urls.length || urls.some((u) => !/^https?:\/\/\S+\.\S+/.test(u))) { setError('Enter full web addresses starting with https://, one per line.'); return; }
    onAdd(urls, internal ? 'internal' : 'public');
  }
  return (
    <Modal open={!!connector} onClose={onClose} title={internal ? 'Add internal pages' : 'Add public web pages'}
      footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn btn--primary" onClick={submit}>Add</button></>}>
      <label className="field"><span>Web addresses, one per line</span>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={internal ? 'https://intranet.example.gov.in/helpdesk/sop' : 'https://www.example.gov.in/faq'} /></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="note">{internal
        ? 'Read through the helpline’s network connection. Added as Officers only: used in agent assist, never shown to citizens.'
        : 'Only the page itself is imported, not the pages it links to. Add each page you need.'}</p>
    </Modal>
  );
}

function ApiDialog({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [lookup, setLookup] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setName(''); setUrl(''); setLookup(''); setError(''); } }, [open]);
  function submit() {
    if (!/^[a-z][a-z0-9_]{2,40}$/.test(name)) { setError('Tool name: lowercase letters, digits and underscores, e.g. get_claim_status.'); return; }
    if (!/^https:\/\/\S+\.\S+/.test(url)) { setError('The endpoint must start with https://'); return; }
    if (!lookup.trim()) { setError('Say which field the assistant looks up by.'); return; }
    onAdd({ name: url.replace(/^https:\/\//, ''), file: url, tool: name, lookup: lookup.trim() });
  }
  return (
    <Modal open={open} onClose={onClose} title="Connect a department API"
      footer={<><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn btn--primary" onClick={submit}>Add</button></>}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label className="field"><span>Tool name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="get_claim_status" /></label>
        <label className="field"><span>Endpoint (GET, read-only)</span><input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.gov.in/v1/claims/{id}" /></label>
        <label className="field"><span>Look up by</span><input type="text" value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="request_no" /></label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <p className="note" style={{ margin: 0 }}>The assistant can only call this with a single value, after the caller is verified with an OTP. It never writes SQL or sends other parameters.</p>
      </div>
    </Modal>
  );
}
