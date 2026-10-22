const STATUS = {
  published: ['ok', 'Published'], draft: ['warn', 'Draft'], processing: ['info', 'Processing'], failed: ['bad', 'Failed'], archived: ['muted', 'Archived'],
  resolved: ['ok', 'Resolved'], handoff: ['info', 'Handoff'], callback: ['warn', 'Callback'], abandoned: ['muted', 'Abandoned'], live: ['live', 'Live'],
  ok: ['ok', 'Healthy'], degraded: ['warn', 'Degraded'], down: ['bad', 'Down'],
  public: ['info', 'Public'], internal: ['teal', 'Internal'], tool: ['muted', 'Tool data'],
};

// <Badge status="published" />, or <Badge tone="warn">Custom</Badge>
export default function Badge({ status, tone, children }) {
  const [t, text] = STATUS[status] || [tone || 'muted', status];
  return <span className={`badge badge--${tone || t}`}>{children || text}</span>;
}
