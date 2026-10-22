export const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
export const ms = (v) => v.toLocaleString('en-IN') + ' ms';
export const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

export function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
