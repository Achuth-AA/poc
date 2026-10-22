// Mock of the orchestrator API used by the chat widget (see docs/POC_DESIGN.md §14).
// Every method returns a Promise shaped like the real endpoint, so swapping this file for
// fetch() calls to /v1/sessions, /v1/turn, /otp/* and /tickets should not touch Widget.jsx.
// What the assistant knows about this site (answers, intents, lookups) lives in ./content.js; this file is
// the same in both citizen apps.
//
// Languages: English (en) and Hindi (hi) are mandatory; Telugu (te) and Malayalam (ml) are the two
// additional Indian languages for the POC.
//
// A reply is a list of blocks the widget knows how to render:
//   {type:'text', text, sources?}          answer text (streamed word by word by the widget)
//   {type:'quick', options:[{label, send}]} quick-reply buttons (label in the caller's language)
//   {type:'otp'}                           OTP verification form
//   {type:'status', record:{title, rows}}  request status card
//   {type:'confirm', title, rows, action}  confirmation card (irreversible action)
//   {type:'handoff', online}               connect-to-officer / callback options
//   {type:'call'}                          offer to switch this chat to a voice call
//   {type:'agent', name, text}             message from a human officer
import { ANSWERS, AUTH, CATEGORIES, CLARIFY_QUICK, INTENTS, QUICK as SITE_QUICK, SITE, START_QUICK, STATUS_RE, lookupRecord } from './content.js';

export { SITE };
export const LANGUAGES = [
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'hi', name: 'हिन्दी', short: 'हिं' },
  { code: 'te', name: 'తెలుగు', short: 'తె' },
  { code: 'ml', name: 'മലയാളം', short: 'മ' },
];

const DEMO_OTP = '123456';
const AGENT = 'Officer Sunita (demo)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const params = new URLSearchParams(location.search);
const AGENTS_ONLINE = params.get('agents') !== 'offline';

// Quick replies send the English value (so the router matches it) but show a label in the caller's language.
const QUICK = {
  'Check my status': { hi: 'मेरा स्टेटस देखें', te: 'నా స్థితి చూడండి', ml: 'എന്റെ സ്റ്റാറ്റസ് നോക്കുക' },
  'Talk to an officer': { hi: 'अधिकारी से बात करें', te: 'అధికారితో మాట్లాడండి', ml: 'ഉദ്യോഗസ്ഥനുമായി സംസാരിക്കുക' },
  'Register a complaint': { hi: 'शिकायत दर्ज करें', te: 'ఫిర్యాదు నమోదు చేయండి', ml: 'പരാതി രജിസ്റ്റർ ചെയ്യുക' },
  'Call the assistant': { hi: 'सहायक को कॉल करें', te: 'సహాయకుడికి కాల్ చేయండి', ml: 'സഹായിയെ വിളിക്കുക' },
  Other: { hi: 'अन्य', te: 'ఇతర', ml: 'മറ്റുള്ളവ' },
  ...SITE_QUICK,
};
const quick = (options, lang) => ({ type: 'quick', options: options.map((send) => ({ send, label: QUICK[send]?.[lang] || send })) });

const n = SITE.name;
const TEXT = {
  greeting: {
    en: `Namaste! I am the automated assistant for ${n}. You can type in English, Hindi, Telugu or Malayalam, or call me.`,
    hi: `नमस्ते! मैं ${n} का स्वचालित सहायक हूँ। आप हिंदी, अंग्रेज़ी, तेलुगु या मलयालम में लिख सकते हैं, या मुझे कॉल कर सकते हैं।`,
    te: `నమస్కారం! నేను ${n} స్వయంచాలక సహాయకుడిని. మీరు తెలుగు, ఇంగ్లీష్, హిందీ లేదా మలయాళంలో అడగవచ్చు, లేదా నాకు కాల్ చేయవచ్చు.`,
    ml: `നമസ്കാരം! ഞാൻ ${n}-ന്റെ ഓട്ടോമേറ്റഡ് സഹായിയാണ്. നിങ്ങൾക്ക് മലയാളം, ഇംഗ്ലീഷ്, ഹിന്ദി അല്ലെങ്കിൽ തെലുങ്കിൽ ചോദിക്കാം, അല്ലെങ്കിൽ എന്നെ വിളിക്കാം.`,
  },
  clarify: {
    en: `Sorry, I couldn't find that in the ${n} information. Could you say it another way?`,
    hi: `माफ़ कीजिए, यह जानकारी ${n} के दस्तावेज़ों में नहीं मिली। क्या आप दूसरे शब्दों में पूछ सकते हैं?`,
    te: `క్షమించండి, ఈ సమాచారం ${n} వివరాల్లో దొరకలేదు. దయచేసి మరో విధంగా అడగగలరా?`,
    ml: `ക്ഷമിക്കണം, ഈ വിവരം ${n} വിവരങ്ങളിൽ കണ്ടെത്താനായില്ല. മറ്റൊരു രീതിയിൽ ചോദിക്കാമോ?`,
  },
  offerHuman: {
    en: "I still couldn't find an answer. I don't want to guess, so let me connect you to an officer.",
    hi: 'मुझे अब भी जवाब नहीं मिला। मैं अंदाज़ा नहीं लगाना चाहता, इसलिए आपको एक अधिकारी से जोड़ता हूँ।',
    te: 'నాకు ఇంకా సమాధానం దొరకలేదు. ఊహించి చెప్పడం ఇష్టం లేదు, కాబట్టి మిమ్మల్ని ఒక అధికారితో కలుపుతాను.',
    ml: 'എനിക്ക് ഇപ്പോഴും ഉത്തരം കണ്ടെത്താനായില്ല. ഊഹിച്ചു പറയാൻ ഞാൻ ആഗ്രഹിക്കുന്നില്ല, അതിനാൽ നിങ്ങളെ ഒരു ഉദ്യോഗസ്ഥനുമായി ബന്ധിപ്പിക്കാം.',
  },
  authNeeded: {
    en: `For your security, please verify with an OTP sent to the mobile number registered with ${n}.`,
    hi: `आपकी सुरक्षा के लिए, ${n} में दर्ज मोबाइल पर भेजे गए OTP से पुष्टि करें।`,
    te: `మీ భద్రత కోసం, ${n} లో నమోదైన మొబైల్‌కు పంపిన OTP తో ధృవీకరించండి.`,
    ml: `നിങ്ങളുടെ സുരക്ഷയ്ക്കായി, ${n}-ൽ രജിസ്റ്റർ ചെയ്ത മൊബൈലിലേക്ക് അയച്ച OTP ഉപയോഗിച്ച് സ്ഥിരീകരിക്കുക.`,
  },
  refuse: {
    en: `I can't help with that. I can only share your own details after verification, and information from the ${n} guides.`,
    hi: `मैं इसमें मदद नहीं कर सकता। मैं सिर्फ़ पुष्टि के बाद आपकी अपनी जानकारी और ${n} की आधिकारिक जानकारी बता सकता हूँ।`,
    te: `నేను దీనిలో సహాయం చేయలేను. ధృవీకరణ తర్వాత మీ స్వంత వివరాలు మరియు ${n} మార్గదర్శకాల సమాచారం మాత్రమే చెప్పగలను.`,
    ml: `എനിക്ക് ഇതിൽ സഹായിക്കാനാവില്ല. സ്ഥിരീകരണത്തിന് ശേഷം നിങ്ങളുടെ സ്വന്തം വിവരങ്ങളും ${n} മാർഗ്ഗനിർദ്ദേശങ്ങളിലെ വിവരങ്ങളും മാത്രമേ എനിക്ക് പറയാനാകൂ.`,
  },
  thanks: {
    en: "You're welcome! Is there anything else I can help with?",
    hi: 'आपका स्वागत है! क्या मैं और कुछ मदद कर सकता हूँ?',
    te: 'మీకు స్వాగతం! ఇంకా ఏమైనా సహాయం కావాలా?',
    ml: 'സ്വാഗതം! മറ്റെന്തെങ്കിലും സഹായം വേണോ?',
  },
  call: {
    en: 'Sure. You can talk to me on a voice call right here in the browser, in any of the four languages. No phone needed.',
    hi: 'ज़रूर। आप यहीं ब्राउज़र में वॉइस कॉल पर मुझसे चारों में से किसी भी भाषा में बात कर सकते हैं। फ़ोन की ज़रूरत नहीं।',
    te: 'తప్పకుండా. మీరు ఇక్కడే బ్రౌజర్‌లో వాయిస్ కాల్‌లో నాలుగు భాషల్లో ఏదైనా ఒకదానిలో నాతో మాట్లాడవచ్చు. ఫోన్ అవసరం లేదు.',
    ml: 'തീർച്ചയായും. ഇവിടെ ബ്രൗസറിൽ തന്നെ നാല് ഭാഷകളിൽ ഏതിലും വോയ്സ് കോളിൽ എന്നോട് സംസാരിക്കാം. ഫോൺ ആവശ്യമില്ല.',
  },
  grievanceCategory: {
    en: 'Sure. What is the complaint about?',
    hi: 'ज़रूर। शिकायत किस बारे में है?',
    te: 'తప్పకుండా. ఫిర్యాదు దేని గురించి?',
    ml: 'തീർച്ചയായും. പരാതി എന്തിനെക്കുറിച്ചാണ്?',
  },
  grievanceDetails: {
    en: 'Please describe the problem in a sentence or two.',
    hi: 'कृपया समस्या एक-दो वाक्यों में बताइए।',
    te: 'దయచేసి సమస్యను ఒకటి రెండు వాక్యాల్లో వివరించండి.',
    ml: 'ദയവായി പ്രശ്നം ഒന്നോ രണ്ടോ വാക്യങ്ങളിൽ വിവരിക്കുക.',
  },
  confirmTitle: {
    en: 'Please confirm your complaint',
    hi: 'कृपया अपनी शिकायत की पुष्टि करें',
    te: 'దయచేసి మీ ఫిర్యాదును నిర్ధారించండి',
    ml: 'ദയവായി നിങ്ങളുടെ പരാതി സ്ഥിരീകരിക്കുക',
  },
  registered: {
    en: (id) => `Your complaint is registered. The complaint number is ${id}. You will also get an SMS.`,
    hi: (id) => `आपकी शिकायत दर्ज हो गई है। शिकायत संख्या ${id} है।`,
    te: (id) => `మీ ఫిర్యాదు నమోదైంది. ఫిర్యాదు సంఖ్య ${id}.`,
    ml: (id) => `നിങ്ങളുടെ പരാതി രജിസ്റ്റർ ചെയ്തു. പരാതി നമ്പർ ${id}.`,
  },
  cancelled: {
    en: 'Okay, I have cancelled it. Nothing was submitted.',
    hi: 'ठीक है, रद्द कर दिया। कुछ भी जमा नहीं हुआ।',
    te: 'సరే, రద్దు చేశాను. ఏదీ సమర్పించబడలేదు.',
    ml: 'ശരി, റദ്ദാക്കി. ഒന്നും സമർപ്പിച്ചിട്ടില്ല.',
  },
  connecting: {
    en: 'Connecting you to an officer. Please stay in this chat.',
    hi: 'आपको एक अधिकारी से जोड़ रहा हूँ। कृपया इसी चैट में रहें।',
    te: 'మిమ్మల్ని ఒక అధికారితో కలుపుతున్నాను. దయచేసి ఈ చాట్‌లోనే ఉండండి.',
    ml: 'നിങ്ങളെ ഒരു ഉദ്യോഗസ്ഥനുമായി ബന്ധിപ്പിക്കുന്നു. ദയവായി ഈ ചാറ്റിൽ തന്നെ തുടരുക.',
  },
  offline: {
    en: 'Our officers are available 9 am to 6 pm. I can arrange a callback or send the reply by email.',
    hi: 'हमारे अधिकारी सुबह 9 से शाम 6 बजे तक उपलब्ध हैं। मैं कॉलबैक या ईमेल से जवाब की व्यवस्था कर सकता हूँ।',
    te: 'మా అధికారులు ఉదయం 9 నుండి సాయంత్రం 6 వరకు అందుబాటులో ఉంటారు. నేను కాల్‌బ్యాక్ లేదా ఈమెయిల్ ద్వారా సమాధానం ఏర్పాటు చేయగలను.',
    ml: 'ഞങ്ങളുടെ ഉദ്യോഗസ്ഥർ രാവിലെ 9 മുതൽ വൈകിട്ട് 6 വരെ ലഭ്യമാണ്. ഞാൻ ഒരു കോൾബാക്ക് അല്ലെങ്കിൽ ഇമെയിൽ വഴി മറുപടി ക്രമീകരിക്കാം.',
  },
};

// Rules first (cheap and predictable), as in the orchestrator's input guardrail and router.
// Each rule covers English, Hindi/Hinglish, Telugu and Malayalam keywords. The site's own answer intents
// (./content.js) sit between the shared safety/handoff rules and "thanks".
const ROUTES = [
  ['injection', /ignore (all|your|previous)|system prompt|act as|jailbreak|other (people|users|citizens|applicants)'?s? (data|details|documents)/i],
  ['call', /voice call|call (the assistant|you|me)|phone call|talk on (a )?call|कॉल कर|कॉल पर|फ़ोन पर बात|ఫోన్ కాల్|కాల్ చేయ|കോൾ ചെയ്യ|വിളിക്ക/i],
  ['human', /human|officer|agent|person|insaan|adhikari|अधिकारी|इंसान|बात कर|అధికారి|మనిషి|ഉദ്യോഗസ്ഥ|മനുഷ്യ/i],
  ['status', new RegExp(`status|track|स्थिति|स्टेटस|ट्रैक|స్థితి|స్టేటస్|ട്രാക്ക്|സ്റ്റാറ്റസ്|${STATUS_RE.source}`, 'i')],
  ['grievance', /complain|complaint|grievance|shikayat|शिकायत|ఫిర్యాదు|പരാതി/i],
  ...INTENTS,
  ['thanks', /thank|dhanyavad|shukriya|धन्यवाद|शुक्रिया|ధన్యవాద|నెనర్లు|നന്ദി/i],
];

const HINGLISH = /\b(kya|kab|kaise|mera|meri|mujhe|hai|nahi|kitna|paisa|batao|chahiye|karna|kahan)\b/i;
// Script decides first (Telugu, Malayalam, Devanagari), then Hinglish words; a full English sentence → English;
// otherwise (short text, quick replies) keep the caller's chosen language.
export function detectLang(text, preferred) {
  if (/[ఀ-౿]/.test(text)) return 'te';
  if (/[ഀ-ൿ]/.test(text)) return 'ml';
  if (/[ऀ-ॿ]/.test(text) || HINGLISH.test(text)) return 'hi';
  if (text.trim().split(/\s+/).length >= 4) return 'en';
  return preferred || 'en';
}

const sessions = new Map();

function pick(map, lang) { return map[lang] || map.en; }

function answerBlocks(key, lang) {
  const a = ANSWERS[key];
  const blocks = [{ type: 'text', text: pick(a, lang), sources: a.sources }];
  if (a.quick) blocks.push(quick(a.quick, lang));
  return blocks;
}

function handoff(s, lang) {
  s.failed = 0;
  return [{ type: 'handoff', online: AGENTS_ONLINE, text: pick(AGENTS_ONLINE ? TEXT.connecting : TEXT.offline, lang) }];
}

function grievanceStart(s, lang) {
  s.grievance = { step: 'category', ref: s.ref };
  return [{ type: 'text', text: pick(TEXT.grievanceCategory, lang) }, quick(CATEGORIES, lang)];
}

export const backend = {
  agentsOnline: AGENTS_ONLINE,

  async startSession({ tenant, language = 'en' }) {
    await wait(250);
    const id = `s_c_${Math.random().toString(36).slice(2, 8)}`;
    sessions.set(id, { tenant, failed: 0, auth: 0, pending: null, grievance: null, withAgent: false, lang: language });
    return {
      sessionId: id,
      greeting: TEXT.greeting,
      quick: (lang) => quick([...START_QUICK, 'Call the assistant'], lang),
    };
  },

  // Restores a session after a page refresh (the real server keeps it in Redis).
  resume(sessionId, state) {
    if (!sessions.has(sessionId)) sessions.set(sessionId, state || { failed: 0, auth: 0, pending: null, grievance: null, withAgent: false, lang: 'en' });
  },

  snapshot(sessionId) { return sessions.get(sessionId); },

  // opts.quick: the text came from a quick-reply button, so answer in the caller's chosen language.
  async sendTurn(sessionId, text, preferredLang, opts = {}) {
    const s = sessions.get(sessionId);
    const lang = opts.quick ? preferredLang : detectLang(text, preferredLang);
    s.lang = lang;
    await wait(350 + Math.random() * 300);

    if (s.withAgent) {
      await wait(900);
      return { lang, blocks: [{ type: 'agent', name: AGENT, text: 'Thank you. I can see your details and the AI summary. Let me check this for you.' }] };
    }

    // Grievance slot filling in progress.
    if (s.grievance && s.grievance.step === 'details') {
      s.grievance.details = text.slice(0, 300);
      s.grievance.step = 'confirm';
      return {
        lang,
        blocks: [{
          type: 'confirm',
          title: pick(TEXT.confirmTitle, lang),
          rows: [['Category', s.grievance.category], [AUTH.rowLabel, s.grievance.ref || 'Not provided'], ['Details', s.grievance.details]],
          action: 'submit_grievance',
        }],
      };
    }
    if (s.grievance && s.grievance.step === 'category') {
      s.grievance.category = CATEGORIES.find((c) => c.toLowerCase() === text.toLowerCase()) || text.slice(0, 60);
      s.grievance.step = 'details';
      return { lang, blocks: [{ type: 'text', text: pick(TEXT.grievanceDetails, lang) }] };
    }

    const intent = (ROUTES.find(([, re]) => re.test(text)) || ['unknown'])[0];

    switch (intent) {
      case 'injection':
        s.failed += 1;
        return { lang, blocks: [{ type: 'text', text: pick(TEXT.refuse, lang) }] };
      case 'call':
        return { lang, blocks: [{ type: 'text', text: pick(TEXT.call, lang) }, { type: 'call' }] };
      case 'human':
        return { lang, blocks: handoff(s, lang) };
      case 'status':
        if (s.auth < 1) { s.pending = 'status'; return { lang, blocks: [{ type: 'text', text: pick(TEXT.authNeeded, lang) }, { type: 'otp' }] }; }
        return { lang, blocks: [{ type: 'status', record: lookupRecord(s.ref) }] };
      case 'grievance':
        if (s.auth < 1) { s.pending = 'grievance'; return { lang, blocks: [{ type: 'text', text: pick(TEXT.authNeeded, lang) }, { type: 'otp' }] }; }
        return { lang, blocks: grievanceStart(s, lang) };
      case 'thanks':
        s.failed = 0;
        return { lang, blocks: [{ type: 'text', text: pick(TEXT.thanks, lang) }] };
      case 'unknown':
        s.failed += 1;
        if (s.failed >= 2) return { lang, blocks: [{ type: 'text', text: pick(TEXT.offerHuman, lang) }, ...handoff(s, lang)] };
        return { lang, blocks: [{ type: 'text', text: pick(TEXT.clarify, lang) }, quick([...CLARIFY_QUICK, 'Talk to an officer'], lang)] };
      default:
        s.failed = 0;
        return { lang, blocks: answerBlocks(intent, lang) };
    }
  },

  async sendOtp(sessionId, ref, mobile) {
    await wait(500);
    if (!AUTH.pattern.test(ref)) return { ok: false, error: AUTH.error };
    if (!/^\d{10}$/.test(mobile)) return { ok: false, error: 'Enter the 10-digit mobile number.' };
    sessions.get(sessionId).ref = ref;
    return { ok: true, hint: `OTP sent to ******${mobile.slice(-4)}. Demo OTP: ${DEMO_OTP}` };
  },

  async verifyOtp(sessionId, otp) {
    await wait(400);
    const s = sessions.get(sessionId);
    if (otp !== DEMO_OTP) return { ok: false, error: 'That OTP is not correct. Please try again.' };
    s.auth = 1;
    const next = s.pending;
    s.pending = null;
    if (next === 'grievance') return { ok: true, blocks: grievanceStart(s, s.lang) };
    return { ok: true, blocks: [{ type: 'status', record: lookupRecord(s.ref) }] };
  },

  async confirmAction(sessionId, action, confirmed) {
    await wait(600);
    const s = sessions.get(sessionId);
    if (action !== 'submit_grievance') return { blocks: [] };
    if (!confirmed) { s.grievance = null; return { blocks: [{ type: 'text', text: pick(TEXT.cancelled, s.lang) }] }; }
    const ticket = `G-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    s.grievance = null;
    return { ticket, blocks: [{ type: 'text', text: pick(TEXT.registered, s.lang)(ticket) }] };
  },

  async editGrievance(sessionId) {
    const s = sessions.get(sessionId);
    return { blocks: grievanceStart(s, s.lang) };
  },

  async connectAgent(sessionId) {
    await wait(2200);
    sessions.get(sessionId).withAgent = true;
    return { name: AGENT, text: 'Namaste, I am Sunita. I have read your conversation with the assistant. How can I help?' };
  },

  async scheduleCallback(sessionId, slot) {
    await wait(500);
    return { ref: `CB-${Math.floor(10000 + Math.random() * 90000)}`, slot };
  },

  async feedback() { await wait(100); return { ok: true }; },
};
