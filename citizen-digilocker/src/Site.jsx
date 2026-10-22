// Demo DigiLocker home page, art-directed with tasteskill ("The page is the object"): the page is built from
// DigiLocker's own artefact, the issued document card, held over the old collectorate where such papers were issued by hand. It keeps the real
// site's jobs (sign up, sign in, get a document, help) but uses no official logo or emblem, and says plainly
// that it is a demonstration. Buttons open the assistant through `assistant.open()`.
import { useEffect, useRef, useState } from 'react';
import Icon from './components/Icon.jsx';

function Ask({ assistant, ask, call, language, className, children, label }) {
  const opts = call ? { call: true, language } : { ask, language };
  return <button type="button" className={className} aria-label={label} onClick={() => assistant.open(opts)}>{children}</button>;
}

// Section parts arrive once, in reading order, as they scroll in. Without script everything is simply shown.
function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// The documents the picker shows. Sample holder details match the assistant's demo data (Ramesh Kumar, UP).
const DOCS = [
  {
    id: 'dl', tab: 'Driving licence', title: 'Driving licence', issuer: 'Transport Department, Uttar Pradesh',
    enter: ['Driving licence number', 'Date of birth, as on the licence'], time: 'About a minute',
    text: 'Search for your state’s Transport Department, enter the licence number and your date of birth, and the licence is saved in Issued documents.',
    card: { kind: 'Driving Licence', no: 'UP14 2019 0047 362', rows: [['Name', 'Ramesh Kumar'], ['Date of birth', '12-08-1986'], ['Valid till', '11-08-2036'], ['Class', 'LMV, MCWG']], tone: '#f2e1df' },
    ask: 'How do I get my driving licence in DigiLocker?',
  },
  {
    id: 'marks', tab: 'Class X marksheet', title: 'Class X marksheet', issuer: 'Central Board of Secondary Education',
    enter: ['Roll number', 'Year of passing'], time: 'Under a minute',
    text: 'Choose CBSE, enter your roll number and the year you passed, and the marksheet arrives exactly as the board issued it.',
    card: { kind: 'Marks Statement, Class X', no: 'Roll 2104 7731', rows: [['Name', 'Lakshmi Reddy'], ['Year', '2021'], ['Result', 'Pass'], ['School', 'Kendriya Vidyalaya, Hyderabad']], tone: '#e3e7dc' },
    ask: 'How do I get my CBSE marksheet?',
  },
  {
    id: 'rc', tab: 'Vehicle RC', title: 'Vehicle registration', issuer: 'Transport Department, Kerala',
    enter: ['Registration number', 'Chassis number, last five characters'], time: 'About a minute',
    text: 'Enter the vehicle’s registration number and the last five characters of the chassis number. The certificate shows the owner, the vehicle and its validity.',
    card: { kind: 'Registration Certificate', no: 'KL07 BX 4417', rows: [['Owner', 'Anil Kumar Nair'], ['Vehicle', 'Motor car, petrol'], ['Registered', '03-02-2022'], ['Fitness till', '02-02-2037']], tone: '#e2e2e8' },
    ask: 'How do I fetch my vehicle RC?',
  },
];

const FAQS = [
  ['Are these documents valid as originals?', 'Yes. A document issued into DigiLocker by the department counts as the original under Rule 9A of the IT (Digital Locker) Rules, 2016.'],
  ['What do I need to sign up?', 'A mobile number for the OTP and your Aadhaar for verification. You set a 6-digit security PIN while signing up.'],
  ['My document will not fetch.', 'Usually the name or date of birth with the issuer does not match your Aadhaar. Get the record corrected with the department, then try again.'],
  ['Can I upload my own files?', 'Yes, as PDF, JPG or PNG, up to 10 MB each and 1 GB in total. Uploaded files are not checked by any issuer.'],
  ['I forgot my security PIN.', 'Choose “Forgot security PIN” on the sign-in page and reset it with the OTP sent to your registered mobile.'],
  ['How do I share a document?', 'Open it and choose Share. You set how long the link works, and you can stop sharing at any time.'],
  ['Does it work without the internet?', 'Documents you saved in the app stay viewable offline. Fetching a new one needs a connection.'],
  ['Is DigiLocker down on 2 November?', 'Yes, for maintenance from 1 am to 4 am. Fetch anything you need for an appointment before then.'],
];

function QR({ seed = 7 }) {
  // A drawn 21×21 QR-like code; the finder squares are fixed, the data cells are seeded so each card differs.
  const cells = [];
  let x = seed * 9301 + 49297;
  const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
  for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
    if (finder(r, c)) continue;
    x = (x * 9301 + 49297) % 233280;
    if (x / 233280 > 0.52) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
  }
  const box = (x0, y0) => <g key={`${x0}${y0}`}><rect x={x0} y={y0} width="7" height="7" /><rect x={x0 + 1} y={y0 + 1} width="5" height="5" fill="#fff" /><rect x={x0 + 2} y={y0 + 2} width="3" height="3" /></g>;
  return <svg className="qr" viewBox="-1 -1 23 23" aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff" />{box(0, 0)}{box(14, 0)}{box(0, 14)}{cells}</svg>;
}

// A cropped fragment of the DigiLocker app: one issued document, open, as the citizen sees it.
function DocFragment({ doc }) {
  const c = doc.card;
  return (
    <figure className="docfrag" data-ui style={{ '--doc-tone': c.tone }}>
      <div className="docfrag__bar"><span>Issued documents</span><span className="docfrag__ok"><Icon name="checkCircle" size={14} />Verified by issuer</span></div>
      <div className="docfrag__card">
        <div className="docfrag__head"><span className="docfrag__kind">{c.kind}</span><span className="docfrag__issuer">{doc.issuer}</span></div>
        <dl className="docfrag__rows">
          <div><dt>Number</dt><dd>{c.no}</dd></div>
          {c.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <QR seed={doc.id.length * 7 + c.no.length} />
      </div>
      <div className="docfrag__actions"><span><Icon name="share" size={14} />Share</span><span><Icon name="download" size={14} />Save PDF</span></div>
      <figcaption className="sr-only">{doc.title} as it appears in DigiLocker (sample details)</figcaption>
    </figure>
  );
}

export default function Site({ assistant }) {
  const [scale, setScale] = useState(1);
  const [contrast, setContrast] = useState(false);
  const [docId, setDocId] = useState(DOCS[0].id);
  const [coupon, setCoupon] = useState({ q: '', lang: 'en', how: 'chat', doc: 'Driving licence' });
  const doc = DOCS.find((d) => d.id === docId);
  const qRef = useRef(null);
  useReveal();

  useEffect(() => { document.documentElement.style.setProperty('--font-scale', scale.toFixed(2)); }, [scale]);
  useEffect(() => { document.body.classList.toggle('high-contrast', contrast); }, [contrast]);
  const font = (step) => setScale((s) => (step === 0 ? 1 : Math.min(1.3, Math.max(0.85, s + step * 0.1))));

  function sendCoupon(e) {
    e.preventDefault();
    const q = coupon.q.trim() || `How do I get my ${coupon.doc.toLowerCase()} in DigiLocker?`;
    if (coupon.how === 'call') assistant.open({ call: true, language: coupon.lang });
    else assistant.open({ ask: q, language: coupon.lang });
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="demo-banner" role="note"><p>
        Demonstration copy built for the Voice AI Agent POC. Not the official DigiLocker website, and nothing here signs you in.
        The real service is at <a href="https://www.digilocker.gov.in" rel="noopener noreferrer" target="_blank">digilocker.gov.in</a>.
      </p></div>

      <header className="bar">
        <div className="frame bar__inner">
          <a className="wordmark" href="#main" aria-label="DigiLocker demo, home">
            <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="4" fill="currentColor" /><path d="M11 15v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#eeecea" strokeWidth="2.4" strokeLinecap="round" /><rect x="8.5" y="15" width="15" height="10" rx="1.5" fill="#eeecea" /></svg>
            DigiLocker
          </a>
          <nav className="bar__nav" aria-label="Main"><a href="#documents">Documents</a><a href="#how">Sign up</a><a href="#faq">Help</a></nav>
          <div className="bar__tools" aria-label="Accessibility and language">
            <button type="button" onClick={() => font(-1)} aria-label="Smaller text">A−</button>
            <button type="button" onClick={() => font(0)} aria-label="Default text size">A</button>
            <button type="button" onClick={() => font(1)} aria-label="Larger text">A+</button>
            <button type="button" aria-pressed={contrast} onClick={() => setContrast((c) => !c)}>Contrast</button>
            {/* The page is English-only in the demo; these open the assistant in that language. */}
            <button type="button" lang="hi" onClick={() => assistant.open({ language: 'hi' })}>हिन्दी</button>
            <button type="button" lang="te" onClick={() => assistant.open({ language: 'te' })}>తెలుగు</button>
            <button type="button" lang="ml" onClick={() => assistant.open({ language: 'ml' })}>മലയാളം</button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero: the issued document as a card, over a service centre at dusk */}
        <section className="hero" aria-labelledby="hero-title">
          <img className="hero__room" src="/media/collectorate-mahbubnagar.jpg" alt="" width="1920" height="1440" fetchpriority="high" />
          <div className="hero__stage">
            <article className="hero__card">
              <div className="hero__top">
                <h1 id="hero-title">Your documents,<br /> valid as originals</h1>
                <QR seed={3} />
              </div>
              <div className="hero__facts">
                <p>Issued straight to you by UIDAI, CBSE and state departments.</p>
                <p>Equal to the paper original under IT Rule 9A.</p>
                <p>Free, with 1 GB for your own files.</p>
              </div>
              <div className="hero__foot">
                <span className="hero__credit">Demo copy of DigiLocker</span>
                <Ask assistant={assistant} ask="How do I sign up for DigiLocker?" className="btn btn--action">Sign up</Ask>
                <Ask assistant={assistant} ask="How do I sign in to DigiLocker?" className="textlink">Sign in</Ask>
              </div>
            </article>
          </div>
        </section>

        {/* Showcase: pick a document (the live thing) */}
        <section id="documents" className="plate" aria-labelledby="docs-title">
          <div className="frame plate__inner">
            <div className="plate__pic" data-reveal><DocFragment doc={doc} /></div>
            <div className="plate__text">
              <div className="tabs" role="tablist" aria-label="Documents" data-reveal>
                {DOCS.map((d) => (
                  <button key={d.id} type="button" role="tab" aria-selected={d.id === docId} className="tab" onClick={() => setDocId(d.id)}>{d.tab}</button>
                ))}
              </div>
              <div className="plate__body" data-reveal>
                <h2 id="docs-title">Get your {doc.title.toLowerCase()}</h2>
                <p className="plate__issuer">From {doc.issuer}</p>
                <p>{doc.text}</p>
                <dl className="plate__enter">
                  <dt>You enter</dt><dd>{doc.enter.join(' and ')}</dd>
                  <dt>It takes</dt><dd>{doc.time}</dd>
                </dl>
              </div>
              <div className="plate__actions" data-reveal>
                <Ask assistant={assistant} ask={doc.ask} className="cell cell--ink">Get it<Icon name="arrowRight" size={18} /></Ask>
                <Ask assistant={assistant} call className="cell cell--tone"><Icon name="phone" size={18} />Ask on a call</Ask>
              </div>
            </div>
          </div>
        </section>

        {/* How it works: sign-up as an itinerary slip */}
        <section id="how" className="slip-section" aria-labelledby="how-title">
          <div className="frame slip-section__inner">
            <div className="slip-section__text" data-reveal>
              <h2 id="how-title">Sign up in five minutes</h2>
              <p>All you need is the mobile number linked to your Aadhaar. Nothing is posted and nothing needs a visit.</p>
              <Ask assistant={assistant} ask="How do I sign up for DigiLocker?" className="textlink">Ask the assistant to walk you through it</Ask>
            </div>
            <div className="slip" data-reveal>
              <h3>On your phone</h3>
              <p className="slip__row"><span>Enter your mobile number</span><i /><span>30 s</span></p>
              <p className="slip__row"><span>Type the 6-digit OTP</span><i /><span>30 s</span></p>
              <p className="slip__row"><span>Set a 6-digit security PIN</span><i /><span>30 s</span></p>
              <h3>With Aadhaar</h3>
              <p className="slip__row"><span>Enter your Aadhaar number</span><i /><span>30 s</span></p>
              <p className="slip__row"><span>Confirm with the Aadhaar OTP</span><i /><span>1 min</span></p>
              <h3>Then</h3>
              <p className="slip__row"><span>Fetch your first document</span><i /><span>2 min</span></p>
              <p className="slip__total"><span>Your locker, ready to use</span><span>about 5 min</span></p>
            </div>
          </div>
        </section>

        {/* Features: stacking sheets, each a capability with its own interface fragment */}
        <section className="sheets" aria-labelledby="sheets-title">
          <div className="frame"><h2 id="sheets-title" className="sheets__title" data-reveal>What the locker does</h2></div>
          <div className="sheet sheet--1">
            <div className="frame sheet__inner">
              <h3 data-reveal>No queue, no photocopies</h3>
              <p data-reveal>A document fetched here comes from the issuer itself, so a department, college or employer can accept it without a stamped copy or a visit to a counter.</p>
              <figure className="sheet__pic" data-reveal><img src="/media/aadhaar-seva-kendra.jpg" alt="People queueing outside an Aadhaar Seva Kendra" width="1920" height="1440" loading="lazy" /></figure>
            </div>
          </div>
          <div className="sheet sheet--2">
            <div className="frame sheet__inner">
              <h3 data-reveal>Share it, and take it back</h3>
              <p data-reveal>Send a link that stops working when you say, or approve a request from an organisation that asks. Every share is listed, and you can end it at any time.</p>
              <div className="sheet__pic" data-ui data-reveal>
                <div className="ui-share">
                  <p className="ui-share__title">Share “Driving licence”</p>
                  <label>Link expires<span className="ui-select">In 24 hours<Icon name="chevronDown" size={14} /></span></label>
                  <label>Who can open it<span className="ui-select">Anyone with the link<Icon name="chevronDown" size={14} /></span></label>
                  <p className="ui-share__link"><span>digilocker.gov.in/s/7Hq2…</span><span className="ui-btn">Copy link</span></p>
                  <p className="ui-share__list-title">Shared now</p>
                  <ul className="ui-share__list">
                    <li><span>Class X marksheet</span><span>Kendriya Vidyalaya admissions</span><span>ends in 3 days</span></li>
                    <li><span>Vehicle RC</span><span>Insurance renewal</span><span>ends today</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="sheet sheet--3">
            <div className="frame sheet__inner">
              <h3 data-reveal>Room for your own files</h3>
              <p data-reveal>Keep rent agreements, medical papers and old certificates next to the issued ones: PDF, JPG or PNG, up to 10 MB each, 1 GB in all.</p>
              <div className="sheet__pic" data-ui data-reveal>
                <div className="ui-files">
                  <p className="ui-files__use"><span>Uploaded documents</span><span className="num">312 MB of 1 GB</span></p>
                  <div className="ui-files__track" aria-hidden="true"><span style={{ width: '30.5%' }} /></div>
                  <ul>
                    <li><Icon name="file" size={16} /><span>Rent agreement, 2025.pdf</span><span className="num">2.4 MB</span></li>
                    <li><Icon name="file" size={16} /><span>Blood test, March.pdf</span><span className="num">0.8 MB</span></li>
                    <li><Icon name="file" size={16} /><span>Birth certificate scan.jpg</span><span className="num">3.1 MB</span></li>
                    <li><Icon name="file" size={16} /><span>Electricity bill, Sept.pdf</span><span className="num">0.4 MB</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ as reading text */}
        <section id="faq" className="faq" aria-labelledby="faq-title">
          <div className="frame faq__inner">
            <h2 id="faq-title" data-reveal>Questions people ask</h2>
            <div className="faq__text" data-reveal>
              {FAQS.map(([q, a]) => <p key={q}><b>{q}</b> {a}</p>)}
            </div>
          </div>
        </section>

        {/* Contact: a clip-out coupon that starts a chat or a call with the assistant */}
        <section className="coupon-section" aria-labelledby="coupon-title">
          <div className="frame">
            <form className="coupon" onSubmit={sendCoupon} data-reveal>
              <div className="coupon__left">
                <h2 id="coupon-title">Ask in your language</h2>
                <p>The assistant answers by chat or on a voice call in English, हिन्दी, తెలుగు or മലയാളം, and hands you to an officer if it cannot help.</p>
              </div>
              <div className="coupon__right">
                <label className="sr-only" htmlFor="c-q">Your question</label>
                <input id="c-q" ref={qRef} type="text" placeholder="Your question, for example: my licence will not fetch" value={coupon.q} onChange={(e) => setCoupon((c) => ({ ...c, q: e.target.value }))} />
                <label className="sr-only" htmlFor="c-doc">Document</label>
                <select id="c-doc" value={coupon.doc} onChange={(e) => setCoupon((c) => ({ ...c, doc: e.target.value }))}>
                  {['Driving licence', 'Class X marksheet', 'Vehicle RC', 'Aadhaar', 'PAN'].map((d) => <option key={d}>{d}</option>)}
                </select>
                <label className="sr-only" htmlFor="c-lang">Language</label>
                <select id="c-lang" value={coupon.lang} onChange={(e) => setCoupon((c) => ({ ...c, lang: e.target.value }))}>
                  <option value="en">English</option><option value="hi" lang="hi">हिन्दी</option><option value="te" lang="te">తెలుగు</option><option value="ml" lang="ml">മലയാളം</option>
                </select>
                <label className="sr-only" htmlFor="c-how">Chat or call</label>
                <select id="c-how" value={coupon.how} onChange={(e) => setCoupon((c) => ({ ...c, how: e.target.value }))}>
                  <option value="chat">By chat</option><option value="call">On a voice call</option>
                </select>
                <button type="submit" className="coupon__submit">{coupon.how === 'call' ? 'Start the call' : 'Ask the assistant'}</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Footer: the back of the card, in tiles */}
      <footer className="tiles" aria-label="Footer">
        <div className="tile tile--statement" data-reveal>
          <p>A demonstration of DigiLocker with an AI assistant, built for the Voice AI Agent POC.</p>
          <p className="tile__small">Content is summarised from public information and may be out of date. Photographs: “Mahbubnagar District Old Collectorate Building, Telangana” by Kavali Chandrakanth KCK, CC0; “AADHAAR SEVA KENDRA” by Suyash.dwivedi, CC BY-SA 4.0; both via Wikimedia Commons. Document details shown are samples.</p>
        </div>
        <nav className="tile tile--nav" aria-label="Footer" data-reveal><a href="#documents">Documents</a><a href="#how">Sign up</a><a href="#faq">Help</a><a href="https://www.digilocker.gov.in" rel="noopener noreferrer" target="_blank">The real DigiLocker</a></nav>
        <div className="tile tile--langs" data-reveal><p>Help in</p><p className="tile__big">English, हिन्दी, తెలుగు, മലയാളം</p></div>
        <div className="tile tile--hours" data-reveal><p>Officers on chat and call</p><p className="tile__big">9 am to 6 pm</p></div>
        <div className="tile tile--mark" aria-hidden="true">DigiLocker</div>
        <Ask assistant={assistant} call className="tile tile--accent">
          <span>Talk to the assistant</span>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40L40 8M16 8h24v24" fill="none" stroke="currentColor" strokeWidth="4" /></svg>
        </Ask>
      </footer>
    </>
  );
}
