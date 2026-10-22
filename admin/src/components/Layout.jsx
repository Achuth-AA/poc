import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store.jsx';
import Icon from './Icon.jsx';

const NAV = [
  { to: '/', label: 'Overview', icon: 'grid' },
  { to: '/knowledge', label: 'Knowledge base', icon: 'book' },
  { to: '/models', label: 'Models & voice', icon: 'sparkle' },
  { to: '/calls', label: 'Calls & chats', icon: 'phone' },
  { to: '/evaluation', label: 'Evaluation', icon: 'chart' },
];

// Product mark: a speech bubble carrying a voice waveform.
export function Mark({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3C8.8 3 3 8.4 3 15c0 3.2 1.4 6.1 3.6 8.3L5.5 29l6-2.6c1.4.4 2.9.6 4.5.6 7.2 0 13-5.4 13-12S23.2 3 16 3z" fill="#0b57d0" />
      <path d="M10 15v2M13 12v8M16 9.5v13M19 12v8M22 15v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Sibling apps (agent console and the two citizen sites). Set in Vercel project env vars (or .env); an empty value hides the link.
const LINKS = [
  ['Open agent console', import.meta.env.VITE_AGENT_CONSOLE_URL],
  ['Open DigiLocker demo', import.meta.env.VITE_DIGILOCKER_DEMO_URL],
  ['Open UMANG demo', import.meta.env.VITE_UMANG_DEMO_URL],
].filter(([, url]) => url);

export default function Layout() {
  const { kb, user } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setNavOpen(false), [location.pathname]);
  const here = NAV.find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)));

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <NavLink className="side-brand" to="/">
          <Mark className="side-brand__mark" />
          <span><strong>Voice AI Platform</strong><small>Admin console</small></span>
        </NavLink>
        <div className="switcher">
          <label className="sr-only" htmlFor="helpline">Helpline</label>
          <select id="helpline" defaultValue={kb.tenant}>
            <option value={kb.tenant}>{kb.tenantName}</option>
            <option disabled>Add a helpline (later)</option>
          </select>
          <p className="switcher__meta"><span>Knowledge <b>v{kb.version}</b></span><span>India-hosted POC</span></p>
        </div>
        <nav aria-label="Admin">
          <ul className="side-nav">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.to === '/'}>
                  <Icon name={n.icon} size={16} />
                  <span>{n.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {LINKS.length > 0 && (
          <>
            <p className="side-label">Other apps</p>
            <div className="side-foot" style={{ marginTop: 0, paddingTop: 0 }}>
              {LINKS.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label}<Icon name="arrowUpRight" size={14} /></a>)}
            </div>
          </>
        )}
        <div className="side-user" style={{ marginTop: 'auto' }}>
          <span className="avatar" aria-hidden="true">{user.initials}</span>
          <span><strong>{user.name}</strong><small>{user.email}</small></span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
            <Icon name="menu" size={22} />
          </button>
          <span className="topbar__title">{here ? here.label : 'Admin console'}</span>
        </header>
        <main className="content" id="main"><Outlet /></main>
      </div>
    </div>
  );
}
