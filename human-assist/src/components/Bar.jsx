// The console's frame (tasteskill app sheet "Framed sheet"): one tinted L of rail and top bar, the work on a white
// sheet inset 8px. Two destinations, so the rail carries icons with names; the top bar holds status and the officer.
import { NavLink, useLocation } from 'react-router-dom';
import { useAssist } from '../store.jsx';
import { useToast } from './Toast.jsx';
import Icon from './Icon.jsx';
import Select from './Select.jsx';

const NAV = [{ to: '/', label: 'Live queue', icon: 'headset' }, { to: '/callbacks', label: 'Callbacks', icon: 'calendar' }];

const STATUSES = [['available', 'Available'], ['busy', 'Busy'], ['away', 'Away']];

export default function Frame({ children }) {
  const { state, dispatch } = useAssist();
  const toast = useToast();
  const { officer, status } = state;
  const location = useLocation();
  const here = NAV.find((n) => (n.to === '/' ? !location.pathname.startsWith('/callbacks') : location.pathname.startsWith(n.to)));
  const waiting = state.queue.length;

  function setStatus(value) {
    dispatch({ type: 'status', status: value });
    toast(value === 'available' ? 'You will receive new handoffs.' : 'New handoffs go to other officers, or citizens are offered a callback.');
  }

  return (
    <div className="frame">
      <nav className="rail" aria-label="Console">
        <NavLink className="rail__mark" to="/" aria-label="Agent console home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 3C8.8 3 3 8.4 3 15c0 3.2 1.4 6.1 3.6 8.3L5.5 29l6-2.6c1.4.4 2.9.6 4.5.6 7.2 0 13-5.4 13-12S23.2 3 16 3z" fill="#1b6c80" />
            <path d="M10 15v2M13 12v8M16 9.5v13M19 12v8M22 15v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </NavLink>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className="rail__item" title={n.label} aria-label={n.to === '/' && waiting ? `${n.label}, ${waiting} waiting` : n.label}>
            <Icon name={n.icon} size={18} />
            <span className="rail__tip" aria-hidden="true">{n.label}</span>
            {n.to === '/' && waiting > 0 && <span className="rail__count">{waiting}</span>}
          </NavLink>
        ))}
      </nav>
      <header className="topbar">
        <span className="topbar__title">Agent console<span className="topbar__sep" aria-hidden="true">/</span><b>{here?.label}</b></span>
        <span className="topbar__spacer" />
        <Select className="status-select" label="My status" value={status} onChange={setStatus}
          options={STATUSES.map(([value, label]) => ({ value, label, lead: <span className="status-dot" data-status={value} aria-hidden="true" /> }))} />
        <span className="officer">
          <span className="avatar" aria-hidden="true">{officer.short}</span>
          <span className="officer__text"><strong>{officer.name}</strong><small>{officer.email}</small></span>
        </span>
      </header>
      <div className="sheet">{children}</div>
    </div>
  );
}
