// Demo UMANG home page, art-directed with tasteskill ("The sentence is the layout"): the page reads as a series of
// short statements with their proof, and its live centre is a headline you can type into, which finds the
// service you mean. It keeps the real site's jobs (search, log in, register, help) but uses no official logo or
// emblem, and says plainly that it is a demonstration. Searching or choosing a service opens the assistant.
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './components/Icon.jsx';

function Ask({ assistant, ask, call, language, className, children, label }) {
  const opts = call ? { call: true, language } : { ask, language };
  return <button type="button" className={className} aria-label={label} onClick={() => assistant.open(opts)}>{children}</button>;
}

// Section parts arrive once, in reading order; the fixed bar takes the ink of the chapter beneath it.
function usePageMotion(barRef) {
  useEffect(() => {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    const chapters = [...document.querySelectorAll('[data-chapter]')];
    const onScroll = () => {
      const bar = barRef.current; if (!bar) return;
      const y = bar.getBoundingClientRect().bottom - 8;
      const under = chapters.find((c) => { const r = c.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      bar.dataset.tone = under ? under.dataset.chapter : 'paper';
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); };
  }, [barRef]);
}

// Services the search knows. Words are matched against the name, the department and the keywords.
const SERVICES = [
  { name: 'View EPF passbook', dept: 'EPFO', keys: 'epf pf balance passbook uan provident', ask: 'How do I check my EPF balance?' },
  { name: 'Raise an EPF claim', dept: 'EPFO', keys: 'epf claim withdraw advance settlement', ask: 'Raise an EPF claim' },
  { name: 'Track an EPF claim', dept: 'EPFO', keys: 'epf claim status track', ask: 'What is my EPF claim status?' },
  { name: 'Know your UAN', dept: 'EPFO', keys: 'uan number epf', ask: 'How do I find my UAN on UMANG?' },
  { name: 'Book an LPG refill', dept: 'Oil marketing companies', keys: 'gas lpg cylinder book refill indane hp bharat', ask: 'How do I book a gas cylinder on UMANG?' },
  { name: 'Refund for a failed payment', dept: 'UMANG payments', keys: 'refund payment failed money deducted gas', ask: 'Money was deducted but the service failed' },
  { name: 'Download Aadhaar', dept: 'UIDAI', keys: 'aadhaar download eaadhaar uid', ask: 'Which Aadhaar services are on UMANG?' },
  { name: 'Your DigiLocker documents', dept: 'DigiLocker', keys: 'digilocker documents licence marksheet certificate', ask: 'Can I use DigiLocker from UMANG?' },
  { name: 'Apply for PAN', dept: 'Income Tax Department', keys: 'pan card tax apply', ask: 'Which PAN services are on UMANG?' },
  { name: 'NPS account statement', dept: 'Pension Fund Regulator', keys: 'nps pension statement retirement', ask: 'Which NPS services are on UMANG?' },
  { name: 'Ayushman card', dept: 'National Health Authority', keys: 'ayushman health card hospital pmjay', ask: 'Which Ayushman Bharat services are on UMANG?' },
  { name: 'Ration card status', dept: 'State food departments', keys: 'ration card food status member', ask: 'Which ration card services are on UMANG?' },
];
const GROUPS = [['EPFO', ['View EPF passbook', 'Raise an EPF claim', 'Track an EPF claim', 'Know your UAN']], ['Gas and payments', ['Book an LPG refill', 'Refund for a failed payment']], ['Identity and documents', ['Download Aadhaar', 'Your DigiLocker documents', 'Apply for PAN']], ['Pension, health, food', ['NPS account statement', 'Ayushman card', 'Ration card status']]];
const EXAMPLES = ['book a gas cylinder', 'track my claim', 'download Aadhaar'];

function search(q) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !['check', 'my', 'the', 'how', 'want', 'need'].includes(w));
  if (!words.length) return SERVICES.slice(0, 3);
  return SERVICES.map((s) => ({ s, score: words.filter((w) => `${s.name} ${s.dept} ${s.keys}`.toLowerCase().includes(w)).length }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.s);
}

const FAQS = [
  ['What is UMANG?', 'UMANG (Unified Mobile Application for New-age Governance) is built by MeitY and the National e-Governance Division. It brings central, state and local government services into one app.'],
  ['How do I register?', 'Enter your mobile number, verify the OTP and set an MPIN. After that you sign in with the MPIN or an OTP.'],
  ['Money was taken but the service failed.', 'It usually comes back to the same account within 5 to 7 working days. If it has not, the assistant can register a complaint with your transaction details.'],
  ['I forgot my MPIN.', 'Choose “Forgot MPIN” on the login screen, verify the OTP sent to your registered mobile and set a new one.'],
  ['How long does an EPF claim take?', 'Claims are usually settled within 20 days of filing, once your employer has approved your KYC.'],
  ['Can I use it without the app?', 'Yes, at web.umang.gov.in. A missed call to 97183 97183 also sends you the app link by SMS.'],
];

export default function Site({ assistant }) {
  const [scale, setScale] = useState(1);
  const [contrast, setContrast] = useState(false);
  const [q, setQ] = useState('check my EPF balance');
  const results = useMemo(() => search(q), [q]);
  const barRef = useRef(null);
  const inputRef = useRef(null);
  usePageMotion(barRef);

  useEffect(() => { document.documentElement.style.setProperty('--font-scale', scale.toFixed(2)); }, [scale]);
  useEffect(() => { document.body.classList.toggle('high-contrast', contrast); }, [contrast]);
  const font = (step) => setScale((s) => (step === 0 ? 1 : Math.min(1.3, Math.max(0.85, s + step * 0.1))));
  const askService = (name) => assistant.open({ ask: SERVICES.find((s) => s.name === name).ask });

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="demo-banner" role="note"><p>
        Demonstration copy built for the Voice AI Agent POC. Not the official UMANG website, and nothing here logs you in.
        The real service is at <a href="https://web.umang.gov.in" rel="noopener noreferrer" target="_blank">web.umang.gov.in</a>.
      </p></div>

      <header className="bar" ref={barRef} data-tone="paper">
        <div className="frame bar__inner">
          <a className="wordmark" href="#main" aria-label="UMANG demo, home">
            <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="12.5" height="12.5" fill="#e8590c" /><rect x="17.5" y="2" width="12.5" height="12.5" fill="#1f4e9e" /><rect x="2" y="17.5" width="12.5" height="12.5" fill="#1e7b4f" /><rect x="17.5" y="17.5" width="12.5" height="12.5" fill="currentColor" /></svg>
            UMANG
          </a>
          <nav className="bar__nav" aria-label="Main"><a href="#find">Find a service</a><a href="#services">Popular</a><a href="#help">Help</a></nav>
          <div className="bar__tools" aria-label="Accessibility and language">
            <button type="button" onClick={() => font(-1)} aria-label="Smaller text">A−</button>
            <button type="button" onClick={() => font(1)} aria-label="Larger text">A+</button>
            <button type="button" aria-pressed={contrast} onClick={() => setContrast((c) => !c)}>Contrast</button>
            {/* The page is English-only in the demo; these open the assistant in that language. */}
            <button type="button" lang="hi" onClick={() => assistant.open({ language: 'hi' })}>हिन्दी</button>
            <button type="button" lang="te" onClick={() => assistant.open({ language: 'te' })}>తెలుగు</button>
            <button type="button" lang="ml" onClick={() => assistant.open({ language: 'ml' })}>മലയാളം</button>
          </div>
          <Ask assistant={assistant} ask="How do I log in to UMANG?" className="btn btn--action">Log in</Ask>
        </div>
      </header>

      <main id="main">
        {/* Hero: the headline across two fields */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__upper" aria-hidden="true" />
          <div className="hero__lower" aria-hidden="true" />
          <h1 id="hero-title" className="hero__title">
            <span className="hero__ink hero__ink--top">Government<br />in one app</span>
            <span className="hero__ink hero__ink--bottom" aria-hidden="true">Government<br />in one app</span>
          </h1>
          <p className="hero__sub">EPFO, Aadhaar, gas booking, NPS and more central and state services, on your phone and the web.</p>
        </section>

        {/* Showcase: the headline you can type (the live thing) */}
        <section id="find" className="find" aria-labelledby="find-title" data-chapter="blue">
          <div className="frame">
            <h2 id="find-title" className="find__label" data-reveal>Find a service by saying what you need</h2>
            <form className="find__form" role="search" data-ui onSubmit={(e) => { e.preventDefault(); assistant.open({ ask: q.trim() || 'Popular services' }); }}>
              <label className="sr-only" htmlFor="find-q">What do you need?</label>
              <input id="find-q" ref={inputRef} className="find__input" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" spellCheck="false" />
              <div className="find__answer" aria-live="polite">
                {results.length === 0 && <p className="find__none">No service matches “{q}”. The assistant can still help: press Enter.</p>}
                <ul>
                  {results.map((s) => (
                    <li key={s.name}>
                      <button type="button" onClick={() => assistant.open({ ask: s.ask })}>
                        <span className="find__name">{s.name}</span><span className="find__dept">{s.dept}</span><Icon name="arrowRight" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="submit" className="find__ask"><Icon name="sparkle" size={16} />Ask the assistant about “{q.trim() || '…'}”</button>
              </div>
            </form>
            <div className="find__examples" data-reveal>
              <span>Try</span>
              {EXAMPLES.map((x) => <button key={x} type="button" onClick={() => { setQ(x); inputRef.current?.focus(); }}>{x}</button>)}
            </div>
          </div>
        </section>

        {/* List: statement, table pushed right */}
        <section id="services" className="list" aria-labelledby="services-title" data-chapter="paper">
          <div className="frame">
            <h2 id="services-title" className="list__title" data-reveal>The services people<br /> open most</h2>
            <div className="list__body">
              <figure className="list__pic" data-reveal>
                <img src="/media/csc-nellai.jpg" alt="The sign of a Common Service Centre in Tamil Nadu, listing the services it offers" width="1920" height="1446" loading="lazy" />
                <figcaption>Services a citizen once went to a centre for, now in the app.</figcaption>
              </figure>
              <div className="list__table" data-reveal>
                <p className="list__word">Services</p>
                {GROUPS.map(([g, names]) => (
                  <div key={g} className="list__group">
                    {names.map((n, i) => {
                      const s = SERVICES.find((x) => x.name === n);
                      return (
                        <button key={n} type="button" className="list__row" onClick={() => askService(n)}>
                          <span className="list__kind">{i === 0 ? g : ''}</span><span className="list__svc">{n}</span><span className="list__dept">{s.dept}</span><Icon name="arrowRight" size={16} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats: a column aligned on the decimal */}
        <section className="ledger" aria-labelledby="ledger-title" data-chapter="paper">
          <div className="frame ledger__inner">
            <div className="ledger__head" data-reveal>
              <h2 id="ledger-title"><span>What to expect</span><br />when you use it</h2>
              <figure className="ledger__pic">
                <img src="/media/post-office-services-telugu.jpg" alt="A poster in Telugu at a post office listing savings schemes and Common Service Centre services" width="1920" height="1440" loading="lazy" />
                <figcaption>The same services, printed on a post-office wall in Telugu.</figcaption>
              </figure>
            </div>
            <dl className="ledger__rows" data-reveal>
              <div><dt className="num">20</dt><dd className="ledger__dec" /><dd>days to settle an EPF claim, usually, once your employer has approved your KYC</dd></div>
              <div><dt className="num">7</dt><dd className="ledger__dec" /><dd>working days at most for a failed payment to come back to your account</dd></div>
              <div><dt className="num">4</dt><dd className="ledger__dec" /><dd>languages the assistant speaks: English, हिन्दी, తెలుగు and മലയാളം</dd></div>
              <div><dt className="num">1</dt><dd className="ledger__dec num">.0</dd><dd>second: the time the voice assistant aims to take to start answering</dd></div>
            </dl>
          </div>
        </section>

        {/* Contact: the missed-call number as display type */}
        <section className="missed" aria-labelledby="missed-title" data-chapter="ink">
          <div className="frame missed__inner">
            <p id="missed-title" className="missed__lead" data-reveal>Give a missed call and the app link arrives by SMS.</p>
            <div className="missed__sms" data-ui data-reveal>
              <p className="missed__head"><span>Messages</span><span>UMANG</span></p>
              <p className="missed__out">Call to 97183 97183, 1 ring</p>
              <div className="missed__bubble">
                <p className="missed__from"><span>UMANG</span><span>now</span></p>
                <p>Thank you for your interest in UMANG. Download the app on Android or iOS: umang.gov.in/app</p>
              </div>
              <p className="missed__note">No charge for the call or the SMS.</p>
            </div>
            <a className="missed__number num" href="tel:+919718397183">97183&nbsp;97183</a>
            <div className="missed__corners"><span>Calls are free; the line hangs up on its own.</span><span>Android, iOS and web.umang.gov.in</span></div>
          </div>
        </section>

        {/* FAQ: wide heading, indented questions */}
        <section id="help" className="faq" aria-labelledby="faq-title" data-chapter="paper">
          <div className="frame">
            <h2 id="faq-title" className="faq__title" data-reveal>Questions people ask</h2>
            <div className="faq__list" data-reveal>
              {FAQS.map(([qq, a]) => (
                <details key={qq}>
                  <summary>{qq}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer: contact as the headline, on the blue field */}
      <footer className="foot" data-chapter="blue">
        <div className="frame foot__inner">
          <div className="foot__top">
            <p>A demonstration of UMANG with an AI assistant, built for the Voice AI Agent POC.</p>
            <p>Officers answer on chat and call from 9 am to 6 pm; the assistant answers at any hour.</p>
            <a href="#main" className="foot__back">Back to top</a>
          </div>
          <Ask assistant={assistant} call className="foot__line">Call the assistant</Ask>
          <div className="foot__meta">
            <span className="foot__links"><a href="#find">Find a service</a><a href="#help">Help</a><a href="https://web.umang.gov.in" rel="noopener noreferrer" target="_blank">The real UMANG</a></span>
            <span>Photographs: “Common Service Centre Nellai Computers” by Helloasir and a post-office poster by Mouryan, both CC BY-SA 4.0, via Wikimedia Commons.</span>
            <span>Content summarised from public information; may be out of date.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
