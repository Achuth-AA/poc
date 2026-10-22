// Interactive cards inside the chat: OTP verification, status, confirmation, handoff and call options.
import { useEffect, useRef, useState } from 'react';
import { AUTH } from './content.js';
import { backend } from './mockBackend.js';
import Icon from '../components/Icon.jsx';

export function StatusCard({ record: r }) {
  return (
    <div className="tnw-card">
      <h3 className="tnw-card__title">{r.title}</h3>
      <dl className="tnw-dl">{r.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <p className="tnw-card__foot">Verified with OTP · personal data is never cached</p>
    </div>
  );
}

export function OtpCard({ t, sessionId, onVerified }) {
  const [step, setStep] = useState(1);
  const [reg, setReg] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const regRef = useRef(null);
  const otpRef = useRef(null);
  useEffect(() => { regRef.current?.focus(); }, []);
  useEffect(() => { if (step === 2) otpRef.current?.focus(); }, [step]);

  async function send(e) {
    e.preventDefault();
    setError('');
    const res = await backend.sendOtp(sessionId, reg.trim().toUpperCase(), mobile.trim());
    if (!res.ok) { setError(res.error); return; }
    setHint(res.hint);
    setStep(2);
  }

  async function verify() {
    setError('');
    const res = await backend.verifyOtp(sessionId, otp.trim());
    if (!res.ok) { setError(res.error); return; }
    onVerified(res.blocks);
  }

  return (
    <form className="tnw-card tnw-otp" noValidate onSubmit={send}>
      <h3 className="tnw-card__title">Verify it's you</h3>
      {step === 1 ? (
        <div className="tnw-otp__step1">
          <label>{t.regNo}<input ref={regRef} name="reg" value={reg} onChange={(e) => setReg(e.target.value)} autoComplete="off" placeholder={AUTH.example} required /></label>
          <label>{t.mobile}<input name="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" autoComplete="tel" placeholder="10-digit number" maxLength={10} required /></label>
          <button type="submit" className="tnw-btn tnw-btn--primary">{t.sendOtp}</button>
        </div>
      ) : (
        <div className="tnw-otp__step2">
          <p className="tnw-hint" role="status">{hint}</p>
          <label>{t.otp}<input ref={otpRef} name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); verify(); } }} /></label>
          <button type="button" className="tnw-btn tnw-btn--primary tnw-verify" onClick={verify}>{t.verify}</button>
        </div>
      )}
      {error && <p className="tnw-error" role="alert">{error}</p>}
      <p className="tnw-card__foot">The OTP is sent through the form, so it never appears in the chat history.</p>
    </form>
  );
}

export function ConfirmCard({ t, block, sessionId, onResult }) {
  const [chosen, setChosen] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [copied, setCopied] = useState(false);

  async function choose(action) {
    setChosen(action);
    const res = action === 'edit'
      ? await backend.editGrievance(sessionId)
      : await backend.confirmAction(sessionId, block.action, action === 'submit');
    if (res.ticket) setTicket(res.ticket);
    onResult(res.blocks);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(ticket); setCopied(true); } catch { setCopied(false); }
  }

  return (
    <div className="tnw-card tnw-confirm">
      <h3 className="tnw-card__title">{block.title}</h3>
      <table className="tnw-table"><tbody>{block.rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table>
      <div className="tnw-actions">
        {[['submit', t.submit, 'tnw-btn--primary', 'check'], ['edit', t.edit, '', 'edit'], ['cancel', t.cancel, '', 'x']].map(([a, label, cls, icon]) => (
          <button key={a} type="button" className={`tnw-btn ${cls} ${chosen === a ? 'is-chosen' : ''}`} disabled={!!chosen} onClick={() => choose(a)}><Icon name={icon} size={16} />{label}</button>
        ))}
      </div>
      <p className="tnw-card__foot">Nothing is submitted until you press Submit.</p>
      {ticket && (
        <p className="tnw-ticket">Complaint no. <strong>{ticket}</strong>{' '}
          <button type="button" className="tnw-link" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></p>
      )}
    </div>
  );
}

const SLOTS = ['9 am – 12 pm', '12 pm – 3 pm', '3 pm – 6 pm'];

export function OfflineHandoffCard({ t, text, sessionId, onDone }) {
  const [mode, setMode] = useState(null); // 'callback' | 'email'
  const [slot, setSlot] = useState(SLOTS[0]);
  const [email, setEmail] = useState('');

  async function book() {
    const res = await backend.scheduleCallback(sessionId, slot);
    onDone(`Callback booked for tomorrow, ${slot}. Reference ${res.ref}. The officer will see this conversation.`);
  }

  function sendMail() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return;
    onDone(`An officer will reply to ${email.trim()} by the next working day.`);
  }

  return (
    <div className="tnw-card">
      <p>{text}</p>
      <div className="tnw-actions tnw-actions--stack">
        <button type="button" className="tnw-btn tnw-btn--primary" onClick={() => setMode('callback')}><Icon name="phone" size={16} />{t.callback}</button>
        <button type="button" className="tnw-btn" onClick={() => setMode('email')}><Icon name="mail" size={16} />{t.email}</button>
      </div>
      {mode === 'callback' && (
        <div className="tnw-handoff__more">
          <fieldset className="tnw-slots">
            <legend>Choose a time tomorrow</legend>
            {SLOTS.map((s) => <label key={s}><input type="radio" name="slot" checked={slot === s} onChange={() => setSlot(s)} /> {s}</label>)}
            <button type="button" className="tnw-btn tnw-btn--primary" onClick={book}>Book callback</button>
          </fieldset>
        </div>
      )}
      {mode === 'email' && (
        <div className="tnw-handoff__more">
          <label className="tnw-field">Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <button type="button" className="tnw-btn tnw-btn--primary" onClick={sendMail}>Send</button>
        </div>
      )}
    </div>
  );
}

export function CallOfferCard({ t, onCall }) {
  return (
    <div className="tnw-card tnw-calloffer">
      <span className="tnw-calloffer__icon" aria-hidden="true"><Icon name="phone" size={20} /></span>
      <div>
        <p className="tnw-calloffer__title">{t.callHint}</p>
        <p className="tnw-card__foot">English · हिन्दी · తెలుగు · മലയാളം</p>
      </div>
      <button type="button" className="tnw-btn tnw-btn--primary" onClick={onCall}><Icon name="phone" size={16} />{t.callNow}</button>
    </div>
  );
}
