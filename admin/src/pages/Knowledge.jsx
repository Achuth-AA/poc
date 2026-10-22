// Knowledge base: the list of live sources, version status and a retrieval test. Adding sources happens on
// its own page, Edit knowledge library (./EditLibrary.jsx).
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import { Drawer, Modal } from '../components/Overlay.jsx';
import { useToast } from '../components/Toast.jsx';
import { stamp } from '../lib/format.js';
import { MIN_CONFIDENCE, retrieve } from '../lib/retrieve.js';
import { useStore } from '../store.jsx';
import Icon from '../components/Icon.jsx';

const FILTERS = [['all', 'All'], ['public', 'Public'], ['internal', 'Officers only'], ['tool', 'Data tables']];

function langOf(doc) {
  if (/[ఀ-౿]/.test(doc.title)) return 'Telugu';
  if (/[ഀ-ൿ]/.test(doc.title)) return 'Malayalam';
  if (/[ऀ-ॿ]/.test(doc.title)) return 'Hindi';
  return 'English';
}
const sizeOf = (doc) => (doc.rows ? `${doc.rows.toLocaleString('en-IN')} rows` : `${doc.chunks} passages${doc.pages ? ` · ${doc.pages} pages` : ''}`);

const TYPE_ICON = { URL: 'globe', CSV: 'table', XLSX: 'table', API: 'code' };

export default function Knowledge() {
  const { documents, setDocuments, chunks, kb, applyKbChange, cache, clearCache, warmCache, changeLog } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [previewId, setPreviewId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const live = documents.filter((d) => d.status === 'published');
  const rows = useMemo(() => documents.filter((d) =>
    (filter === 'all' || d.audience === filter) && (!query || `${d.title} ${d.file}`.toLowerCase().includes(query.trim().toLowerCase()))),
  [documents, filter, query]);
  const preview = documents.find((d) => d.id === previewId);
  const history = changeLog.filter((c) => c.kind === 'Knowledge');
  const lastUpdate = history[0];

  useEffect(() => {
    if (!menuId) return undefined;
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  function reindex(doc) {
    setDocuments((docs) => docs.map((d) => (d.id === doc.id ? { ...d, updated: stamp() } : d)));
    const r = applyKbChange(`Re-indexed "${doc.title}"`);
    toast(`Re-indexed "${doc.title}". Now KB v${r.to}; ${r.cleared.toLocaleString('en-IN')} cached answers cleared.`);
  }

  function remove(doc) {
    setDocuments((docs) => docs.filter((d) => d.id !== doc.id));
    const r = applyKbChange(`Removed "${doc.title}"`);
    setRemoving(null);
    setPreviewId(null);
    toast(`Removed "${doc.title}". Now KB v${r.to}; its passages and ${r.cleared.toLocaleString('en-IN')} cached answers are gone.`);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Knowledge base</h1>
          <p>What the assistant answers from, on voice, chat and agent assist. Add or replace sources with one update: it becomes a new version and the old cached answers are cleared automatically.</p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--primary" to="/knowledge/edit">
            <Icon name="plus" />
            Edit knowledge library
          </Link>
        </div>
      </div>

      <section className="card">
        <div className="kb-status">
          <div className="kb-status__ver"><span className="live-dot" aria-hidden="true" /><div><div className="note">Live version</div><strong>v{kb.version}</strong></div></div>
          <div className="kb-status__stat"><span>Sources</span><b>{live.length}</b></div>
          <div className="kb-status__stat"><span>Passages</span><b>{live.reduce((a, d) => a + (d.chunks || 0), 0).toLocaleString('en-IN')}</b></div>
          <div className="kb-status__stat"><span>Cached answers</span><b>{cache.entries.toLocaleString('en-IN')}</b></div>
          <div className="kb-status__stat"><span>Last update</span><b>{lastUpdate ? lastUpdate.at : '—'}</b></div>
          <div className="kb-status__actions">
            <button type="button" className="btn btn--sm" onClick={() => toast(`Pre-warmed ${warmCache()} FAQ answers for KB v${kb.version}.`)}>Pre-warm cache</button>
            <button type="button" className="btn btn--sm" onClick={() => toast(`Cache cleared (${clearCache('Cleared from knowledge base page').toLocaleString('en-IN')} answers).`)}>Clear cache</button>
            <button type="button" className="btn btn--sm btn--ghost" aria-expanded={showHistory} onClick={() => setShowHistory((s) => !s)}>{showHistory ? 'Hide history' : 'History'}</button>
          </div>
        </div>
        {showHistory && (
          <div className="card__body" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <ol className="versions" aria-label="Version history">
              {history.map((h) => <li key={`${h.at}-${h.to}`}><strong>{h.to}</strong><span>{h.note}</span><span className="note">{h.at} · {h.who}</span></li>)}
            </ol>
          </div>
        )}
      </section>

      <div className="grid grid--3-1">
        <section className="card">
          <div className="card__head">
            <div className="chips" role="group" aria-label="Filter sources">
              {FILTERS.map(([v, l]) => <button key={v} type="button" className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
            </div>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sources" aria-label="Search sources" style={{ width: 220 }} />
          </div>
          <ul className="sources">
            {rows.length === 0 && <li className="empty">No sources match.</li>}
            {rows.map((d) => (
              <li key={d.id} className="source" onClick={() => setPreviewId(d.id)}>
                <span className="source__icon"><Icon name={TYPE_ICON[d.type] || 'file'} size={20} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="source__title" style={{ display: 'block' }}>{d.title}</span>
                  <span className="source__meta">
                    <span>{d.type}</span><span>{sizeOf(d)}</span><span>{langOf(d)}</span><span>v{d.version}, {d.updated}</span>
                    {d.history?.length > 0 && <span>replaced v{d.history[0].version}</span>}
                    {d.refreshDays && <span>refreshes every {d.refreshDays} days</span>}
                    {d.priority === 'high' && <Badge tone="warn">Priority</Badge>}
                  </span>
                </span>
                <Badge status={d.audience}>{d.audience === 'internal' ? 'Officers only' : undefined}</Badge>
                <span className="source__menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="icon-btn" aria-label={`Options for ${d.title}`} aria-expanded={menuId === d.id}
                    onClick={(e) => { e.stopPropagation(); setMenuId(menuId === d.id ? null : d.id); }}>
                    <Icon name="more" size={20} />
                  </button>
                  {menuId === d.id && (
                    <div className="menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPreviewId(d.id); }}><Icon name="eye" />Preview</button>
                      <button type="button" role="menuitem" onClick={() => { setMenuId(null); navigate(`/knowledge/edit?replace=${d.id}`); }}><Icon name="upload" />Upload new version</button>
                      <button type="button" role="menuitem" onClick={() => { setMenuId(null); reindex(d); }}><Icon name="refresh" />Re-index</button>
                      <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuId(null); setRemoving(d); }}><Icon name="trash" />Remove…</button>
                    </div>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <RetrievalTest documents={documents} chunks={chunks} />
      </div>

      <Drawer open={!!preview} onClose={() => setPreviewId(null)} title={preview?.title}
        subtitle={preview && <>{preview.file} · <Badge status={preview.audience} /></>}>
        {preview && <Preview doc={preview} chunks={chunks[preview.id] || []} onReindex={() => { reindex(preview); setPreviewId(null); }} onRemove={() => setRemoving(preview)} />}
      </Drawer>

      <Modal open={!!removing} onClose={() => setRemoving(null)} title={`Remove "${removing?.title}"?`}
        footer={<><button type="button" className="btn" onClick={() => setRemoving(null)}>Cancel</button><button type="button" className="btn btn--primary" onClick={() => remove(removing)}>Remove and update</button></>}>
        <p>Its passages and embeddings are deleted, the knowledge base moves to v{kb.version + 1}, and {cache.entries.toLocaleString('en-IN')} cached answers are cleared. Calls stop using it straight away.</p>
      </Modal>

    </>
  );
}

function RetrievalTest({ documents, chunks }) {
  const [q, setQ] = useState('Is a DigiLocker document valid as the original?');
  const [as, setAs] = useState('public');
  const [result, setResult] = useState(null);
  const confident = result && result.length > 0 && result[0].score >= MIN_CONFIDENCE;
  return (
    <section className="card">
      <div className="card__head"><div><h2>Test a question</h2><p>Runs retrieval exactly as a live call would</p></div></div>
      <div className="card__body" style={{ display: 'grid', gap: 10 }}>
        <form onSubmit={(e) => { e.preventDefault(); setResult(retrieve(q, documents, chunks, { audience: as })); }} style={{ display: 'grid', gap: 8 }}>
          <textarea rows={2} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Question" />
          <div className="toolbar">
            <select value={as} onChange={(e) => setAs(e.target.value)} aria-label="Search as" style={{ flex: 1 }}>
              <option value="public">As a citizen (public)</option><option value="internal">As an officer (+ internal)</option>
            </select>
            <button className="btn btn--primary" type="submit">Search</button>
          </div>
        </form>
        {result && !confident && (
          <div className="answer answer--warn"><div className="answer__label">No confident match</div>
            The bot would say it doesn't have this information and offer an officer. Consider adding a document.</div>
        )}
        {confident && (
          <>
            <div className="answer">
              <div className="answer__label">The bot would answer from</div>
              {result[0].chunk.text}
              <div className="note" style={{ marginTop: 6 }}>Source: {result[0].doc.title}, p.{result[0].chunk.page}</div>
            </div>
            {result.slice(1).map((h) => (
              <div key={`${h.doc.id}-${h.chunk.page}-${h.chunk.section}`} className="chunk hit">
                <div className="chunk__meta"><span className="score">{h.score.toFixed(2)}</span><span>{h.doc.title}</span><span>p.{h.chunk.page}</span></div>
                <p>{h.chunk.text}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function Preview({ doc, chunks, onReindex, onRemove }) {
  const { tables } = useStore();
  const table = tables[doc.id];
  return (
    <>
      <div className="pipeline" aria-label="Ingestion steps">{['Read', 'Chunked', 'Embedded', 'Safety-checked', 'Live'].map((s) => <span key={s} className="done"><Icon name="check" size={13} />{s}</span>)}</div>
      <dl className="kv">
        <dt>Version</dt><dd>v{doc.version}</dd>
        <dt>Language</dt><dd>{langOf(doc)}</dd>
        <dt>Who can use it</dt>
        <dd>{doc.audience === 'internal' ? 'Officers only (agent assist)'
          : doc.audience === 'tool' ? <>Data table behind the tool <code>{doc.tool || `lookup_${doc.id}`}</code></>
            : 'Citizens, chat and officers'}</dd>
        {doc.pages && <><dt>Pages</dt><dd>{doc.pages}</dd></>}
        {doc.lookup && <><dt>Lookup column</dt><dd><code>{doc.lookup}</code> · needs OTP verification</dd></>}
        <dt>Updated</dt><dd>{doc.updated} by {doc.by}</dd>
        <dt>File</dt><dd className="mono">{doc.file}</dd>
      </dl>
      {doc.history?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Earlier versions</h3>
          <p className="note" style={{ marginTop: 0 }}>Replaced versions are kept for the audit trail only. Their passages are deleted, so no answer can cite them.</p>
          <ol className="versions">
            {doc.history.map((h) => <li key={h.version}><strong>v{h.version}, {h.file}</strong><span>{h.passages} passages, uploaded {h.updated} by {h.by}</span><span className="note">Replaced {h.retired}</span></li>)}
          </ol>
        </div>
      )}
      {table ? (
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Data preview</h3>
          <p className="note">The AI never writes SQL. It can only call a fixed lookup by <code>{doc.lookup}</code>.</p>
          <div className="table-wrap">
            <table className="data">
              <thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{table.rows.map((r) => <tr key={r[0]}>{r.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Passages ({doc.chunks || chunks.length}) <span className="note">showing {chunks.length}</span></h3>
          <div className="grid" style={{ gap: 8 }}>
            {chunks.length === 0 && <p className="empty">No passages yet.</p>}
            {chunks.map((c, i) => (
              <div key={i} className="chunk">
                <div className="chunk__meta"><span className="mono">#{i + 1}</span><span>p.{c.page}</span><span>{c.section}</span></div>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="toolbar">
        <button type="button" className="btn" onClick={onReindex}>Re-index</button>
        <button type="button" className="btn btn--danger" onClick={onRemove}>Remove…</button>
      </div>
    </>
  );
}
