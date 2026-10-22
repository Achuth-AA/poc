// Custom dropdown that replaces the native <select>: a button that opens a listbox popover.
// The same file is used in all four apps; each app maps its colours onto the --sel-* variables.
// Keyboard: arrows/Home/End move, Enter or Space picks, a letter jumps to the next match, Esc or Tab closes.
// options: [{ value, label, disabled?, lang?, lead? }] (lead: an optional node shown before the label, e.g. a status dot)
import { useEffect, useId, useRef, useState } from 'react';
import './Select.css';

const Chevron = () => <svg className="sel__chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Check = () => <svg className="sel__check" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export default function Select({ value, onChange, options, label, id, placeholder = 'Choose…', disabled = false, block = false, className = '', buttonRef }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState('');
  const wrapRef = useRef(null);
  const ownBtn = useRef(null);
  const btnRef = buttonRef || ownBtn;
  const listRef = useRef(null);
  const listId = useId();
  const current = options.find((o) => String(o.value) === String(value));
  const enabled = (i) => i >= 0 && i < options.length && !options[i].disabled;

  useEffect(() => {
    if (!open) return undefined;
    const r = btnRef.current.getBoundingClientRect();
    const h = Math.min(288, options.length * 40 + 12);
    const up = innerHeight - r.bottom < h + 12 && r.top > h + 12;
    const right = r.left + 240 > innerWidth;
    setPlace(`${up ? 'sel--up' : ''} ${right ? 'sel--right' : ''}`);
    const sel = options.findIndex((o) => String(o.value) === String(value));
    setActive(enabled(sel) ? sel : options.findIndex((o) => !o.disabled));
    listRef.current?.focus({ preventScroll: true });
    const away = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const close = () => { setOpen(false); btnRef.current?.focus(); };
  const choose = (i) => { if (!enabled(i)) return; onChange(options[i].value); close(); };
  const step = (from, dir) => {
    for (let k = 1; k <= options.length; k++) {
      const i = (from + dir * k + options.length * k) % options.length;
      if (enabled(i)) return i;
    }
    return from;
  };

  function onListKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => step(i, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => step(i, -1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(step(-1, 1)); }
    else if (e.key === 'End') { e.preventDefault(); setActive(step(options.length, -1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') setOpen(false);
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase();
      for (let n = 1; n <= options.length; n++) {
        const i = (active + n) % options.length;
        if (enabled(i) && String(options[i].label).trim().toLowerCase().startsWith(k)) { setActive(i); break; }
      }
    }
  }

  return (
    <div className={`sel ${block ? 'sel--block' : ''} ${place} ${className}`} ref={wrapRef}>
      <button ref={btnRef} id={id} type="button" className="sel__btn" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
        aria-label={label ? `${label}: ${current ? current.label : placeholder}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setOpen(true); } }}>
        {current?.lead}
        <span className={`sel__value ${current ? '' : 'sel__value--placeholder'}`} lang={current?.lang}>{current ? current.label : placeholder}</span>
        <Chevron />
      </button>
      {open && (
        <ul ref={listRef} id={listId} className="sel__list" role="listbox" tabIndex={-1} aria-label={label}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} onKeyDown={onListKey}>
          {options.map((o, i) => (
            <li key={String(o.value)} id={`${listId}-${i}`} role="option" lang={o.lang} aria-selected={String(o.value) === String(value)} aria-disabled={o.disabled || undefined}
              className={`sel__opt ${i === active ? 'is-active' : ''}`} onPointerEnter={() => !o.disabled && setActive(i)} onClick={() => choose(i)}>
              {o.lead}<span className="sel__label">{o.label}</span><Check />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
