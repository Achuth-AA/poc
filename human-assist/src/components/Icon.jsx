// One outline icon set (24px grid, 1.75 stroke, round caps) used everywhere instead of emoji or glyphs.
const PATHS = {
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  phoneOff: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z M3 21L21 3',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5',
  table: 'M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9 M12 3C9.5 5.5 8.2 8.5 8.2 12s1.3 6.5 3.8 9',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  upload: 'M12 16V4 M7 9l5-5 5 5 M5 20h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12.5l3 3 5-6',
  x: 'M6 6l12 12 M18 6L6 18',
  plus: 'M12 5v14 M5 12h14',
  more: 'M12 5.5h.01 M12 12h.01 M12 18.5h.01',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
  micOff: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3 M3 3l18 18',
  send: 'M4.5 12L20 4.5 14.5 20l-2.5-6z M12 14l8-9.5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  headset: 'M4 15v-3a8 8 0 0 1 16 0v3 M4 15h3v5H5.5A1.5 1.5 0 0 1 4 18.5z M20 15h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  alert: 'M12 4l9 16H3z M12 10v4 M12 17h.01',
  arrowUpRight: 'M7 17L17 7 M8 7h9v9',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  thumbUp: 'M7 10v10H4V10z M7 10l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7',
  thumbDown: 'M7 14V4H4v10z M7 14l4 7a2 2 0 0 0 2-2v-4h5.5a2 2 0 0 0 2-2.3l-1.2-7A2 2 0 0 0 17.3 4H7',
  mail: 'M4 6h16v12H4z M4 7l8 6 8-6',
  edit: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  pause: 'M9 5v14 M15 5v14',
  play: 'M8 5l11 7-11 7z',
  transfer: 'M4 8h13 M14 4l4 4-4 4 M20 16H7 M10 12l-4 4 4 4',
  tool: 'M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3z M14.7 6.3l3-3a4 4 0 0 0-3 3z',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  history: 'M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4 M12 8v4l3 2',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  idCard: 'M3 6h18v12H3z M7 10h4 M7 14h6 M15 10h2.5v4H15z',
  megaphone: 'M4 10v4h3l8 4V6l-8 4z M18.5 9.5a3 3 0 0 1 0 5',
  clipboard: 'M9 4h6v3H9z M8 5H5v16h14V5h-3 M9 13l2 2 4-4',
  volume: 'M4 10v4h4l5 4V6l-5 4z M16.5 9a4 4 0 0 1 0 6 M19 6.5a7.5 7.5 0 0 1 0 11',
  sparkle: 'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M18 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M21 20H3',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
};
const HEAVY = new Set(['more']);

export default function Icon({ name, size = 18, title, className }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={HEAVY.has(name) ? 2.6 : 1.75} strokeLinecap="round" strokeLinejoin="round"
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title} focusable="false">
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}
