// What the assistant knows on the UMANG demo site: answers grounded in the demo knowledge base,
// the intents that pick them, the application-status lookup and complaint categories.
// Summarised from public UMANG information for the demo; check it against the official help pages before showing.
export const SITE = { name: 'UMANG', tenant: 'umang-demo' };

// The reference a citizen gives (with an OTP) before the assistant shares personal details.
export const AUTH = {
  label: { en: 'Application number', hi: 'आवेदन संख्या', te: 'దరఖాస్తు సంఖ్య', ml: 'അപേക്ഷ നമ്പർ' },
  example: 'UM2610078812',
  pattern: /^UM\d{10}$/,
  error: 'The application number is UM followed by 10 digits, for example UM2610078812.',
  rowLabel: 'Application no.',
};

const SRC = {
  guide: (page) => ({ title: 'UMANG user guide (demo KB)', page }),
  dir: (page) => ({ title: 'UMANG services directory (demo KB)', page }),
};

export const QUICK = {
  'What is UMANG?': { hi: 'UMANG क्या है?', te: 'UMANG అంటే ఏమిటి?', ml: 'UMANG എന്താണ്?' },
  'Check EPF balance': { hi: 'EPF बैलेंस देखें', te: 'EPF బ్యాలెన్స్ చూడండి', ml: 'EPF ബാലൻസ് നോക്കുക' },
  'Raise an EPF claim': { hi: 'EPF क्लेम करें', te: 'EPF క్లెయిమ్ చేయండి', ml: 'EPF ക്ലെയിം നൽകുക' },
  'How to register': { hi: 'पंजीकरण कैसे करें', te: 'ఎలా నమోదు చేసుకోవాలి', ml: 'എങ്ങനെ രജിസ്റ്റർ ചെയ്യാം' },
  'Payment failed': { hi: 'भुगतान विफल', te: 'చెల్లింపు విఫలమైంది', ml: 'പേയ്‌മെന്റ് പരാജയപ്പെട്ടു' },
  'Forgot MPIN': { hi: 'MPIN भूल गए', te: 'MPIN మర్చిపోయాను', ml: 'MPIN മറന്നു' },
  'Popular services': { hi: 'लोकप्रिय सेवाएँ', te: 'ప్రముఖ సేవలు', ml: 'ജനപ്രിയ സേവനങ്ങൾ' },
  'Where can I use UMANG?': { hi: 'UMANG कहाँ इस्तेमाल करें?', te: 'UMANG ఎక్కడ ఉపయోగించాలి?', ml: 'UMANG എവിടെ ഉപയോഗിക്കാം?' },
  'Payment deducted, service failed': { hi: 'पैसा कटा, सेवा नहीं मिली', te: 'డబ్బు కట్ అయింది, సేవ రాలేదు', ml: 'പണം പോയി, സേവനം ലഭിച്ചില്ല' },
  'Application stuck': { hi: 'आवेदन अटका है', te: 'దరఖాస్తు ఆగిపోయింది', ml: 'അപേക്ഷ കുടുങ്ങി' },
  'Login / MPIN problem': { hi: 'लॉगिन / MPIN समस्या', te: 'లాగిన్ / MPIN సమస్య', ml: 'ലോഗിൻ / MPIN പ്രശ്നം' },
};

export const START_QUICK = ['Check EPF balance', 'Payment failed', 'Check my status', 'Talk to an officer'];
export const CLARIFY_QUICK = ['What is UMANG?', 'Popular services'];
export const CATEGORIES = ['Payment deducted, service failed', 'Application stuck', 'Login / MPIN problem', 'Other'];

export const ANSWERS = {
  about: {
    en: 'UMANG (Unified Mobile Application for New-age Governance) is built by MeitY and the National e-Governance Division. It brings services from central, state and local departments into one app, such as EPFO, Aadhaar, DigiLocker, PAN and gas booking.',
    hi: 'UMANG (Unified Mobile Application for New-age Governance) को MeitY और राष्ट्रीय ई-गवर्नेंस प्रभाग ने बनाया है। इसमें केंद्र, राज्य और स्थानीय विभागों की सेवाएँ एक ही ऐप में मिलती हैं, जैसे EPFO, आधार, DigiLocker, PAN और गैस बुकिंग।',
    te: 'UMANG (Unified Mobile Application for New-age Governance) ను MeitY మరియు జాతీయ ఇ-గవర్నెన్స్ విభాగం రూపొందించాయి. ఇందులో కేంద్ర, రాష్ట్ర, స్థానిక శాఖల సేవలు ఒకే యాప్‌లో ఉంటాయి, ఉదాహరణకు EPFO, ఆధార్, DigiLocker, PAN మరియు గ్యాస్ బుకింగ్.',
    ml: 'UMANG (Unified Mobile Application for New-age Governance) MeitY-യും ദേശീയ ഇ-ഗവേണൻസ് ഡിവിഷനും ചേർന്ന് നിർമ്മിച്ചതാണ്. കേന്ദ്ര, സംസ്ഥാന, തദ്ദേശ വകുപ്പുകളുടെ സേവനങ്ങൾ ഒരൊറ്റ ആപ്പിൽ ലഭിക്കും, ഉദാഹരണത്തിന് EPFO, ആധാർ, DigiLocker, PAN, ഗ്യാസ് ബുക്കിംഗ്.',
    sources: [SRC.guide(2)],
    quick: ['How to register', 'Popular services'],
  },
  register: {
    en: 'To register: 1) enter your mobile number, 2) verify it with the OTP, 3) set an MPIN. After that you can sign in with the MPIN or an OTP. Some services also ask you to link your Aadhaar.',
    hi: 'पंजीकरण के लिए: 1) मोबाइल नंबर डालें, 2) OTP से पुष्टि करें, 3) MPIN बनाएँ। इसके बाद आप MPIN या OTP से लॉगिन कर सकते हैं। कुछ सेवाओं के लिए आधार जोड़ना भी होता है।',
    te: 'నమోదు చేసుకోవడానికి: 1) మొబైల్ నంబర్ నమోదు చేయండి, 2) OTP తో ధృవీకరించండి, 3) MPIN సెట్ చేయండి. తర్వాత MPIN లేదా OTP తో లాగిన్ అవ్వవచ్చు. కొన్ని సేవలకు ఆధార్ లింక్ చేయాలి.',
    ml: 'രജിസ്റ്റർ ചെയ്യാൻ: 1) മൊബൈൽ നമ്പർ നൽകുക, 2) OTP ഉപയോഗിച്ച് സ്ഥിരീകരിക്കുക, 3) MPIN സജ്ജമാക്കുക. തുടർന്ന് MPIN അല്ലെങ്കിൽ OTP ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം. ചില സേവനങ്ങൾക്ക് ആധാർ ലിങ്ക് ചെയ്യണം.',
    sources: [SRC.guide(4)],
    quick: ['Check EPF balance', 'Forgot MPIN'],
  },
  platforms: {
    en: 'UMANG works on Android and iOS phones and on the web at web.umang.gov.in. You can also give a missed call to 97183-97183 to get the download link by SMS.',
    hi: 'UMANG, Android और iOS फ़ोन पर और वेब पर web.umang.gov.in पर चलता है। डाउनलोड लिंक SMS से पाने के लिए 97183-97183 पर मिस्ड कॉल भी दे सकते हैं।',
    te: 'UMANG, Android మరియు iOS ఫోన్లలో, వెబ్‌లో web.umang.gov.in లో పనిచేస్తుంది. డౌన్‌లోడ్ లింక్ SMS ద్వారా పొందడానికి 97183-97183 కు మిస్డ్ కాల్ ఇవ్వవచ్చు.',
    ml: 'UMANG, Android, iOS ഫോണുകളിലും വെബിൽ web.umang.gov.in-ലും പ്രവർത്തിക്കും. ഡൗൺലോഡ് ലിങ്ക് SMS ആയി ലഭിക്കാൻ 97183-97183 എന്ന നമ്പറിലേക്ക് മിസ്ഡ് കോൾ നൽകാം.',
    sources: [SRC.guide(6)],
  },
  epfBalance: {
    en: 'Open EPFO in UMANG, choose View Passbook, enter your UAN and verify the OTP sent to your UAN-linked mobile. You will see your balance and each month’s contribution.',
    hi: 'UMANG में EPFO खोलें, View Passbook चुनें, अपना UAN डालें और UAN से जुड़े मोबाइल पर आए OTP से पुष्टि करें। आपको बैलेंस और हर महीने का योगदान दिखेगा।',
    te: 'UMANG లో EPFO తెరిచి, View Passbook ఎంచుకోండి, మీ UAN నమోదు చేసి UAN కు లింక్ అయిన మొబైల్‌కు వచ్చిన OTP తో ధృవీకరించండి. మీ బ్యాలెన్స్ మరియు ప్రతి నెల జమ కనిపిస్తాయి.',
    ml: 'UMANG-ൽ EPFO തുറന്ന്, View Passbook തിരഞ്ഞെടുത്ത്, UAN നൽകി UAN-മായി ലിങ്ക് ചെയ്ത മൊബൈലിലേക്ക് വരുന്ന OTP ഉപയോഗിച്ച് സ്ഥിരീകരിക്കുക. ബാലൻസും ഓരോ മാസത്തെ വിഹിതവും കാണാം.',
    sources: [SRC.guide(9)],
    quick: ['Raise an EPF claim', 'Check my status'],
  },
  epfClaim: {
    en: 'In EPFO, choose Raise Claim, enter your UAN and OTP, pick the claim type and confirm your bank account. Your KYC (Aadhaar, bank, PAN) must already be approved by your employer. Claims are usually settled within 20 days.',
    hi: 'EPFO में Raise Claim चुनें, UAN और OTP डालें, क्लेम का प्रकार चुनें और बैंक खाते की पुष्टि करें। आपका KYC (आधार, बैंक, PAN) पहले से नियोक्ता द्वारा स्वीकृत होना चाहिए। क्लेम आमतौर पर 20 दिनों में निपट जाता है।',
    te: 'EPFO లో Raise Claim ఎంచుకుని, UAN మరియు OTP నమోదు చేసి, క్లెయిమ్ రకం ఎంచుకుని బ్యాంక్ ఖాతాను నిర్ధారించండి. మీ KYC (ఆధార్, బ్యాంక్, PAN) ను యజమాని ముందే ఆమోదించి ఉండాలి. క్లెయిమ్‌లు సాధారణంగా 20 రోజుల్లో పరిష్కారమవుతాయి.',
    ml: 'EPFO-യിൽ Raise Claim തിരഞ്ഞെടുത്ത്, UAN-ഉം OTP-യും നൽകി, ക്ലെയിം തരം തിരഞ്ഞെടുത്ത് ബാങ്ക് അക്കൗണ്ട് സ്ഥിരീകരിക്കുക. നിങ്ങളുടെ KYC (ആധാർ, ബാങ്ക്, PAN) തൊഴിലുടമ മുൻകൂട്ടി അംഗീകരിച്ചിരിക്കണം. ക്ലെയിമുകൾ സാധാരണയായി 20 ദിവസത്തിനുള്ളിൽ തീർപ്പാകും.',
    sources: [SRC.guide(9)],
    quick: ['Check my status', 'Talk to an officer'],
  },
  paymentFailed: {
    en: 'If money was deducted but the service failed, it is usually refunded to the same account within 5 to 7 working days. If it has not come back by then, I can register a complaint with your transaction details.',
    hi: 'अगर पैसा कट गया लेकिन सेवा नहीं मिली, तो आमतौर पर 5 से 7 कार्य दिवसों में उसी खाते में वापस आ जाता है। तब तक न आए तो मैं लेन-देन की जानकारी के साथ शिकायत दर्ज कर सकता हूँ।',
    te: 'డబ్బు కట్ అయి సేవ విఫలమైతే, సాధారణంగా 5 నుండి 7 పని దినాల్లో అదే ఖాతాకు తిరిగి వస్తుంది. అప్పటికీ రాకపోతే, లావాదేవీ వివరాలతో నేను ఫిర్యాదు నమోదు చేయగలను.',
    ml: 'പണം പോയെങ്കിലും സേവനം പരാജയപ്പെട്ടാൽ, സാധാരണയായി 5 മുതൽ 7 പ്രവൃത്തി ദിവസത്തിനുള്ളിൽ അതേ അക്കൗണ്ടിലേക്ക് തിരികെ വരും. അപ്പോഴും വന്നില്ലെങ്കിൽ, ഇടപാട് വിവരങ്ങളോടെ ഞാൻ പരാതി രജിസ്റ്റർ ചെയ്യാം.',
    sources: [SRC.guide(15)],
    quick: ['Register a complaint', 'Check my status'],
  },
  mpin: {
    en: 'On the login screen choose “Forgot MPIN”, verify the OTP sent to your registered mobile and set a new MPIN. Never share your MPIN or OTP with anyone, including officers.',
    hi: 'लॉगिन स्क्रीन पर “Forgot MPIN” चुनें, दर्ज मोबाइल पर आए OTP से पुष्टि करें और नया MPIN बनाएँ। अपना MPIN या OTP किसी को न बताएँ, अधिकारियों को भी नहीं।',
    te: 'లాగిన్ స్క్రీన్‌లో “Forgot MPIN” ఎంచుకుని, నమోదైన మొబైల్‌కు వచ్చిన OTP తో ధృవీకరించి కొత్త MPIN సెట్ చేయండి. మీ MPIN లేదా OTP ను ఎవరితోనూ, అధికారులతో కూడా పంచుకోవద్దు.',
    ml: 'ലോഗിൻ സ്ക്രീനിൽ “Forgot MPIN” തിരഞ്ഞെടുത്ത്, രജിസ്റ്റർ ചെയ്ത മൊബൈലിലേക്ക് വരുന്ന OTP സ്ഥിരീകരിച്ച് പുതിയ MPIN സജ്ജമാക്കുക. MPIN അല്ലെങ്കിൽ OTP ആരുമായും, ഉദ്യോഗസ്ഥരുമായി പോലും, പങ്കിടരുത്.',
    sources: [SRC.guide(5)],
    quick: ['Talk to an officer'],
  },
  services: {
    en: 'Popular services on UMANG include EPFO, Aadhaar, DigiLocker, PAN, Ayushman Bharat, LPG cylinder booking, NPS and ration card services. You can browse by category or by state.',
    hi: 'UMANG की लोकप्रिय सेवाओं में EPFO, आधार, DigiLocker, PAN, आयुष्मान भारत, LPG सिलेंडर बुकिंग, NPS और राशन कार्ड सेवाएँ हैं। आप श्रेणी या राज्य के अनुसार देख सकते हैं।',
    te: 'UMANG లో ప్రముఖ సేవలు: EPFO, ఆధార్, DigiLocker, PAN, ఆయుష్మాన్ భారత్, LPG సిలిండర్ బుకింగ్, NPS మరియు రేషన్ కార్డ్ సేవలు. వర్గం లేదా రాష్ట్రం వారీగా చూడవచ్చు.',
    ml: 'UMANG-ലെ ജനപ്രിയ സേവനങ്ങൾ: EPFO, ആധാർ, DigiLocker, PAN, ആയുഷ്മാൻ ഭാരത്, LPG സിലിണ്ടർ ബുക്കിംഗ്, NPS, റേഷൻ കാർഡ് സേവനങ്ങൾ. വിഭാഗം അല്ലെങ്കിൽ സംസ്ഥാനം തിരിച്ച് കാണാം.',
    sources: [SRC.dir(1)],
    quick: ['Check EPF balance', 'Where can I use UMANG?'],
  },
  gas: {
    en: 'Open the LPG service in UMANG, choose your gas company, sign in with your registered mobile or consumer number, and book a refill. You can pay online and track delivery there.',
    hi: 'UMANG में LPG सेवा खोलें, अपनी गैस कंपनी चुनें, दर्ज मोबाइल या उपभोक्ता संख्या से लॉगिन करें और रिफ़िल बुक करें। वहीं ऑनलाइन भुगतान और डिलीवरी ट्रैक कर सकते हैं।',
    te: 'UMANG లో LPG సేవను తెరిచి, మీ గ్యాస్ కంపెనీని ఎంచుకుని, నమోదైన మొబైల్ లేదా కన్స్యూమర్ నంబర్‌తో లాగిన్ అయి రీఫిల్ బుక్ చేయండి. అక్కడే ఆన్‌లైన్‌లో చెల్లించి డెలివరీ ట్రాక్ చేయవచ్చు.',
    ml: 'UMANG-ൽ LPG സേവനം തുറന്ന്, ഗ്യാസ് കമ്പനി തിരഞ്ഞെടുത്ത്, രജിസ്റ്റർ ചെയ്ത മൊബൈൽ അല്ലെങ്കിൽ കൺസ്യൂമർ നമ്പർ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്ത് റീഫിൽ ബുക്ക് ചെയ്യുക. അവിടെ തന്നെ ഓൺലൈനായി പണമടച്ച് ഡെലിവറി ട്രാക്ക് ചെയ്യാം.',
    sources: [SRC.dir(1)],
    quick: ['Payment failed'],
  },
};

// Status words specific to this site (the shared router already knows "status" / "track").
export const STATUS_RE = /my application|application status|claim status|आवेदन की स्थिति|क्लेम की स्थिति|దరఖాస్తు స్థితి|అప్లికేషన్|അപേക്ഷയുടെ സ്ഥിതി/;

// Answer intents, checked in order after the shared safety, call, handoff, status and complaint rules.
export const INTENTS = [
  ['paymentFailed', /payment (failed|deducted)|money (was )?deducted|deducted|refund|paisa kat|पैसा कट|भुगतान|రిఫండ్|కట్ అయ|చెల్లింపు|പണം പോയി|റീഫണ്ട്|പേയ്‌മെന്റ്/i],
  ['mpin', /mpin|pin|password|forgot|bhool|भूल|మర్చిపో|മറന്ന/i],
  ['epfClaim', /claim|withdraw|advance|क्लेम|निकासी|క్లెయిమ్|ക്ലെയിം/i],
  ['epfBalance', /epf|pf balance|passbook|uan|बैलेंस|पासबुक|బ్యాలెన్స్|పాస్‌బుక్|ബാലൻസ്|പാസ്ബുക്ക്/i],
  ['gas', /gas|lpg|cylinder|गैस|सिलेंडर|గ్యాస్|సిలిండర్|ഗ്യാസ്|സിലിണ്ടർ/i],
  ['platforms', /where can i use|download|android|ios|iphone|web\b|missed call|app kahan|डाउनलोड|డౌన్‌లోడ్|ഡൗൺലോഡ്|എവിടെ ഉപയോഗിക്കാം|ఎక్కడ ఉపయోగించ|कहाँ इस्तेमाल/i],
  ['register', /register|sign ?up|sign ?in|log ?in|create (an )?account|पंजीकरण|लॉगिन|నమోదు|లాగిన్|രജിസ്റ്റർ|ലോഗിൻ/i],
  ['services', /services|popular|digilocker|aadhaar|pan\b|ayushman|nps|ration|passport|सेवाएँ|सेवा|సేవలు|സേവനങ്ങൾ/i],
  ['about', /what is (umang|this)|about umang|umang (kya|क्या|అంటే|എന്താണ്)/i],
];

function mask(name) { return name.split(' ').map((w) => `${w[0]}***`).join(' '); }

// Mock of the get_request_status tool (the real one reads the service-requests table after OTP).
export function lookupRecord(ref) {
  const known = {
    UM2610078812: { name: 'Ramesh Kumar', service: 'EPF final settlement claim', dept: 'EPFO', status: 'Under processing', filed: '09 Oct 2026', next: 'Settlement within 20 days of filing' },
    UM2610033190: { name: 'Lakshmi Reddy', service: 'LPG cylinder booking refund', dept: 'Oil marketing company', status: 'Refund initiated', filed: '17 Oct 2026', next: 'Credit in 5–7 working days' },
    UM2610054417: { name: 'Anil Kumar Nair', service: 'Ration card member addition', dept: 'Civil Supplies (Kerala)', status: 'Documents requested', filed: '12 Oct 2026', next: 'Upload a birth certificate in the service' },
  };
  const r = known[ref] || { name: 'Demo Citizen', service: 'Pension status update', dept: 'Department of Pension', status: 'Submitted', filed: '19 Oct 2026', next: 'Department reviews within 10 working days' };
  return {
    title: 'Application status',
    rows: [['Application no.', ref], ['Name', mask(r.name)], ['Service', r.service], ['Department', r.dept], ['Status', r.status], ['Filed on', r.filed], ['Next step', r.next]],
  };
}
