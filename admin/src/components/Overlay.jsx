// Drawer and Modal with Escape-to-close and focus on open.
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

export function Drawer({ open, onClose, title, subtitle, children }) {
  const [shown, setShown] = useState(open);
  const [slid, setSlid] = useState(false);
  const closeRef = useRef(null);
  useEscape(open, onClose);
  useEffect(() => {
    if (open) {
      setShown(true);
      const id = requestAnimationFrame(() => { setSlid(true); closeRef.current?.focus(); });
      return () => cancelAnimationFrame(id);
    }
    setSlid(false);
    const t = setTimeout(() => setShown(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      <div className={`scrim ${slid ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${slid ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="drawerTitle" hidden={!shown}>
        <div className="drawer__head">
          <div><h2 id="drawerTitle">{title}</h2><div className="note">{subtitle}</div></div>
          <button type="button" ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close preview"><Icon name="x" size={20} /></button>
        </div>
        <div className="drawer__body">{shown ? children : null}</div>
      </aside>
    </>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  const boxRef = useRef(null);
  useEscape(open, onClose);
  useEffect(() => { if (open) boxRef.current?.querySelector('.btn--primary')?.focus(); }, [open]);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="scrim is-open" onClick={onClose} />
      <div className="modal__box" ref={boxRef}>
        <header><h2 id="modalTitle">{title}</h2></header>
        <div className="modal__body">{children}</div>
        <footer>{footer}</footer>
      </div>
    </div>
  );
}
