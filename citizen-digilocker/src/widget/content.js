// What the assistant knows on the DigiLocker demo site: answers grounded in the demo knowledge base,
// the intents that pick them, the request-status lookup and complaint categories.
// Summarised from public DigiLocker information for the demo; check it against the official FAQs before showing.
export const SITE = { name: 'DigiLocker', tenant: 'digilocker-demo' };

// The reference a citizen gives (with an OTP) before the assistant shares personal details.
export const AUTH = {
  label: { en: 'Request number', hi: 'अनुरोध संख्या', te: 'అభ్యర్థన సంఖ్య', ml: 'അഭ്യർത്ഥന നമ്പർ' },
  example: 'DL2610045821',
  pattern: /^DL\d{10}$/,
  error: 'The request number is DL followed by 10 digits, for example DL2610045821.',
  rowLabel: 'Request no.',
};

const SRC = {
  faq: (page) => ({ title: 'DigiLocker user FAQs (demo KB)', page }),
  notice: (page) => ({ title: 'Notice: maintenance window, 2 Nov 2026 (demo KB)', page }),
};

export const QUICK = {
  'What is DigiLocker?': { hi: 'DigiLocker क्या है?', te: 'DigiLocker అంటే ఏమిటి?', ml: 'DigiLocker എന്താണ്?' },
  'Is it valid as original?': { hi: 'क्या यह मूल जैसा मान्य है?', te: 'ఇది అసలుతో సమానమా?', ml: 'ഇത് ഒറിജിനലിന് തുല്യമാണോ?' },
  'How to sign up': { hi: 'खाता कैसे बनाएँ', te: 'ఖాతా ఎలా తెరవాలి', ml: 'എങ്ങനെ സൈൻ അപ്പ് ചെയ്യാം' },
  'Get my driving licence': { hi: 'मेरा ड्राइविंग लाइसेंस पाएँ', te: 'నా డ్రైవింగ్ లైసెన్స్ పొందండి', ml: 'എന്റെ ഡ്രൈവിംഗ് ലൈസൻസ് നേടുക' },
  'Document not fetching': { hi: 'दस्तावेज़ नहीं आ रहा', te: 'పత్రం రావడం లేదు', ml: 'രേഖ ലഭിക്കുന്നില്ല' },
  'Forgot PIN': { hi: 'PIN भूल गए', te: 'PIN మర్చిపోయాను', ml: 'PIN മറന്നു' },
  'Upload a document': { hi: 'दस्तावेज़ अपलोड करें', te: 'పత్రం అప్‌లోడ్ చేయండి', ml: 'രേഖ അപ്‌ലോഡ് ചെയ്യുക' },
  'Share a document': { hi: 'दस्तावेज़ साझा करें', te: 'పత్రం పంచుకోండి', ml: 'രേഖ പങ്കിടുക' },
  'Wrong details on document': { hi: 'दस्तावेज़ में गलत जानकारी', te: 'పత్రంలో తప్పు వివరాలు', ml: 'രേഖയിൽ തെറ്റായ വിവരങ്ങൾ' },
  'Account / PIN problem': { hi: 'खाता / PIN समस्या', te: 'ఖాతా / PIN సమస్య', ml: 'അക്കൗണ്ട് / PIN പ്രശ്നം' },
};

export const START_QUICK = ['Is it valid as original?', 'Get my driving licence', 'Check my status', 'Talk to an officer'];
export const CLARIFY_QUICK = ['What is DigiLocker?', 'Document not fetching'];
export const CATEGORIES = ['Document not fetching', 'Wrong details on document', 'Account / PIN problem', 'Other'];

export const ANSWERS = {
  about: {
    en: 'DigiLocker is a Digital India service of MeitY. It gives you a secure cloud account where you get authentic digital documents, such as your Aadhaar, driving licence and marksheets, directly from the departments that issue them.',
    hi: 'DigiLocker, MeitY की डिजिटल इंडिया सेवा है। इसमें आपको एक सुरक्षित क्लाउड खाता मिलता है, जहाँ आधार, ड्राइविंग लाइसेंस और मार्कशीट जैसे असली डिजिटल दस्तावेज़ सीधे जारी करने वाले विभागों से आते हैं।',
    te: 'DigiLocker అనేది MeitY యొక్క డిజిటల్ ఇండియా సేవ. ఇందులో మీకు సురక్షితమైన క్లౌడ్ ఖాతా లభిస్తుంది, ఆధార్, డ్రైవింగ్ లైసెన్స్, మార్కుల పత్రాలు వంటి అసలైన డిజిటల్ పత్రాలు నేరుగా జారీ చేసే శాఖల నుండి వస్తాయి.',
    ml: 'DigiLocker, MeitY-യുടെ ഡിജിറ്റൽ ഇന്ത്യ സേവനമാണ്. ഇതിൽ നിങ്ങൾക്ക് സുരക്ഷിതമായ ക്ലൗഡ് അക്കൗണ്ട് ലഭിക്കും. ആധാർ, ഡ്രൈവിംഗ് ലൈസൻസ്, മാർക്ക് ലിസ്റ്റ് തുടങ്ങിയ യഥാർത്ഥ ഡിജിറ്റൽ രേഖകൾ അവ നൽകുന്ന വകുപ്പുകളിൽ നിന്ന് നേരിട്ട് ലഭിക്കും.',
    sources: [SRC.faq(2)],
    quick: ['How to sign up', 'Is it valid as original?'],
  },
  valid: {
    en: 'Yes. Documents issued into DigiLocker by the department are treated as equal to the original physical documents, under Rule 9A of the IT (Digital Locker) Rules, 2016. Files you upload yourself are not issuer-verified.',
    hi: 'हाँ। विभाग द्वारा DigiLocker में जारी दस्तावेज़ IT (डिजिटल लॉकर) नियम, 2016 के नियम 9A के तहत मूल दस्तावेज़ के बराबर माने जाते हैं। आपके खुद अपलोड किए दस्तावेज़ सत्यापित नहीं होते।',
    te: 'అవును. శాఖ DigiLocker లోకి జారీ చేసిన పత్రాలు IT (డిజిటల్ లాకర్) నియమాలు, 2016 లోని నియమం 9A ప్రకారం అసలు పత్రాలతో సమానం. మీరే అప్‌లోడ్ చేసిన ఫైళ్లు ధృవీకరించబడవు.',
    ml: 'അതെ. വകുപ്പ് DigiLocker-ലേക്ക് നൽകുന്ന രേഖകൾ IT (ഡിജിറ്റൽ ലോക്കർ) ചട്ടങ്ങൾ, 2016-ലെ ചട്ടം 9A പ്രകാരം ഒറിജിനൽ രേഖകൾക്ക് തുല്യമാണ്. നിങ്ങൾ സ്വയം അപ്‌ലോഡ് ചെയ്യുന്ന ഫയലുകൾ പരിശോധിക്കപ്പെട്ടവയല്ല.',
    sources: [SRC.faq(3)],
    quick: ['Get my driving licence', 'Share a document'],
  },
  signup: {
    en: 'To sign up: 1) enter your mobile number, 2) verify it with the OTP, 3) set a 6-digit security PIN, 4) complete Aadhaar verification. You can then fetch documents from issuers.',
    hi: 'खाता बनाने के लिए: 1) मोबाइल नंबर डालें, 2) OTP से पुष्टि करें, 3) 6 अंकों का सुरक्षा PIN बनाएँ, 4) आधार से सत्यापन पूरा करें। फिर आप विभागों से दस्तावेज़ ले सकते हैं।',
    te: 'ఖాతా తెరవడానికి: 1) మొబైల్ నంబర్ నమోదు చేయండి, 2) OTP తో ధృవీకరించండి, 3) 6 అంకెల సెక్యూరిటీ PIN సెట్ చేయండి, 4) ఆధార్ ధృవీకరణ పూర్తి చేయండి. తర్వాత శాఖల నుండి పత్రాలు పొందవచ్చు.',
    ml: 'സൈൻ അപ്പ് ചെയ്യാൻ: 1) മൊബൈൽ നമ്പർ നൽകുക, 2) OTP ഉപയോഗിച്ച് സ്ഥിരീകരിക്കുക, 3) 6 അക്ക സെക്യൂരിറ്റി PIN സജ്ജമാക്കുക, 4) ആധാർ പരിശോധന പൂർത്തിയാക്കുക. തുടർന്ന് വകുപ്പുകളിൽ നിന്ന് രേഖകൾ നേടാം.',
    sources: [SRC.faq(5)],
    quick: ['Get my driving licence', 'Forgot PIN'],
  },
  fetch: {
    en: 'Open Search Documents, choose the issuer (for a driving licence, your state’s Transport department; for marksheets, the board such as CBSE), enter the details asked and press Get Document. It is saved in Issued Documents.',
    hi: 'Search Documents खोलें, जारी करने वाला विभाग चुनें (ड्राइविंग लाइसेंस के लिए अपने राज्य का परिवहन विभाग; मार्कशीट के लिए CBSE जैसा बोर्ड), माँगी गई जानकारी डालें और Get Document दबाएँ। दस्तावेज़ Issued Documents में सेव हो जाता है।',
    te: 'Search Documents తెరిచి, జారీ చేసే శాఖను ఎంచుకోండి (డ్రైవింగ్ లైసెన్స్ కోసం మీ రాష్ట్ర రవాణా శాఖ; మార్కుల పత్రాలకు CBSE వంటి బోర్డు), అడిగిన వివరాలు నమోదు చేసి Get Document నొక్కండి. ఇది Issued Documents లో సేవ్ అవుతుంది.',
    ml: 'Search Documents തുറന്ന്, രേഖ നൽകുന്ന വകുപ്പ് തിരഞ്ഞെടുക്കുക (ഡ്രൈവിംഗ് ലൈസൻസിന് സംസ്ഥാന ഗതാഗത വകുപ്പ്; മാർക്ക് ലിസ്റ്റിന് CBSE പോലുള്ള ബോർഡ്), ചോദിക്കുന്ന വിവരങ്ങൾ നൽകി Get Document അമർത്തുക. ഇത് Issued Documents-ൽ സേവ് ആകും.',
    sources: [SRC.faq(7)],
    quick: ['Document not fetching', 'Share a document'],
  },
  mismatch: {
    en: 'This usually means your name or date of birth with the issuer does not match your Aadhaar. Get the record corrected with the issuing department, then try again. If it still fails, I can register a complaint or check your request status.',
    hi: 'आमतौर पर इसका मतलब है कि विभाग के रिकॉर्ड में आपका नाम या जन्म तिथि आधार से मेल नहीं खाती। विभाग से रिकॉर्ड ठीक करवाएँ, फिर दोबारा कोशिश करें। फिर भी न हो तो मैं शिकायत दर्ज कर सकता हूँ या आपके अनुरोध का स्टेटस देख सकता हूँ।',
    te: 'సాధారణంగా శాఖ రికార్డులో మీ పేరు లేదా పుట్టిన తేదీ ఆధార్‌తో సరిపోలడం లేదని అర్థం. జారీ చేసిన శాఖలో రికార్డును సరిచేయించి మళ్లీ ప్రయత్నించండి. అయినా రాకపోతే, నేను ఫిర్యాదు నమోదు చేయగలను లేదా మీ అభ్యర్థన స్థితి చూడగలను.',
    ml: 'സാധാരണയായി വകുപ്പിന്റെ രേഖയിലെ നിങ്ങളുടെ പേരോ ജനനത്തീയതിയോ ആധാറുമായി പൊരുത്തപ്പെടുന്നില്ല എന്നാണ് ഇതിനർത്ഥം. വകുപ്പിൽ രേഖ തിരുത്തിച്ച് വീണ്ടും ശ്രമിക്കുക. എന്നിട്ടും ലഭിച്ചില്ലെങ്കിൽ, ഞാൻ പരാതി രജിസ്റ്റർ ചെയ്യാം അല്ലെങ്കിൽ അഭ്യർത്ഥനയുടെ സ്റ്റാറ്റസ് നോക്കാം.',
    sources: [SRC.faq(11)],
    quick: ['Check my status', 'Register a complaint'],
  },
  pin: {
    en: 'On the sign-in page choose “Forgot security PIN” and reset it with the OTP sent to your registered mobile number. Never share your PIN or OTP with anyone, including officers.',
    hi: 'साइन-इन पेज पर “Forgot security PIN” चुनें और दर्ज मोबाइल पर आए OTP से नया PIN बनाएँ। अपना PIN या OTP किसी को न बताएँ, अधिकारियों को भी नहीं।',
    te: 'సైన్-ఇన్ పేజీలో “Forgot security PIN” ఎంచుకుని, నమోదైన మొబైల్‌కు వచ్చిన OTP తో కొత్త PIN సెట్ చేయండి. మీ PIN లేదా OTP ను ఎవరితోనూ, అధికారులతో కూడా పంచుకోవద్దు.',
    ml: 'സൈൻ ഇൻ പേജിൽ “Forgot security PIN” തിരഞ്ഞെടുത്ത്, രജിസ്റ്റർ ചെയ്ത മൊബൈലിലേക്ക് വരുന്ന OTP ഉപയോഗിച്ച് പുതിയ PIN സജ്ജമാക്കുക. PIN അല്ലെങ്കിൽ OTP ആരുമായും, ഉദ്യോഗസ്ഥരുമായി പോലും, പങ്കിടരുത്.',
    sources: [SRC.faq(13)],
    quick: ['Talk to an officer'],
  },
  upload: {
    en: 'You can upload your own documents in PDF, JPG or PNG, up to 10 MB per file and 1 GB in total. Uploaded files are for your convenience; departments may still ask for the issued version.',
    hi: 'आप अपने दस्तावेज़ PDF, JPG या PNG में अपलोड कर सकते हैं, हर फ़ाइल 10 MB तक और कुल 1 GB तक। अपलोड किए दस्तावेज़ आपकी सुविधा के लिए हैं; विभाग जारी किया गया संस्करण माँग सकते हैं।',
    te: 'మీ పత్రాలను PDF, JPG లేదా PNG లో అప్‌లోడ్ చేయవచ్చు, ఒక్కో ఫైల్ 10 MB వరకు, మొత్తం 1 GB వరకు. అప్‌లోడ్ చేసిన ఫైళ్లు మీ సౌలభ్యం కోసం; శాఖలు జారీ చేసిన పత్రాన్ని అడగవచ్చు.',
    ml: 'നിങ്ങളുടെ രേഖകൾ PDF, JPG അല്ലെങ്കിൽ PNG ആയി അപ്‌ലോഡ് ചെയ്യാം, ഓരോ ഫയലും 10 MB വരെ, ആകെ 1 GB വരെ. അപ്‌ലോഡ് ചെയ്ത ഫയലുകൾ നിങ്ങളുടെ സൗകര്യത്തിനാണ്; വകുപ്പുകൾ നൽകിയ രേഖ ആവശ്യപ്പെട്ടേക്കാം.',
    sources: [SRC.faq(9)],
    quick: ['Is it valid as original?'],
  },
  share: {
    en: 'Open the document and choose Share. You can send a link that expires after the time you set, or let an organisation that asks for it see it with your consent. You can stop sharing at any time.',
    hi: 'दस्तावेज़ खोलें और Share चुनें। आप एक लिंक भेज सकते हैं जो तय समय बाद बंद हो जाता है, या माँगने वाली संस्था को अपनी सहमति से दिखा सकते हैं। आप कभी भी साझा करना बंद कर सकते हैं।',
    te: 'పత్రాన్ని తెరిచి Share ఎంచుకోండి. మీరు నిర్ణయించిన సమయం తర్వాత ముగిసే లింక్ పంపవచ్చు, లేదా అడిగిన సంస్థకు మీ అనుమతితో చూపవచ్చు. ఎప్పుడైనా పంచుకోవడం ఆపవచ్చు.',
    ml: 'രേഖ തുറന്ന് Share തിരഞ്ഞെടുക്കുക. നിങ്ങൾ നിശ്ചയിക്കുന്ന സമയത്തിന് ശേഷം കാലഹരണപ്പെടുന്ന ലിങ്ക് അയയ്ക്കാം, അല്ലെങ്കിൽ ആവശ്യപ്പെടുന്ന സ്ഥാപനത്തിന് നിങ്ങളുടെ സമ്മതത്തോടെ കാണിക്കാം. എപ്പോൾ വേണമെങ്കിലും പങ്കിടൽ നിർത്താം.',
    sources: [SRC.faq(15)],
  },
  maintenance: {
    en: 'DigiLocker will be unavailable for maintenance on 2 November 2026 from 1 am to 4 am. Documents saved offline in the app stay viewable. Fetch anything you need for an appointment before then.',
    hi: 'DigiLocker 2 नवंबर 2026 को रात 1 बजे से सुबह 4 बजे तक रखरखाव के कारण उपलब्ध नहीं रहेगा। ऐप में ऑफ़लाइन सेव दस्तावेज़ दिखते रहेंगे। ज़रूरी दस्तावेज़ पहले ही ले लें।',
    te: 'DigiLocker 2 నవంబర్ 2026 న రాత్రి 1 నుండి ఉదయం 4 వరకు నిర్వహణ కోసం అందుబాటులో ఉండదు. యాప్‌లో ఆఫ్‌లైన్‌లో సేవ్ చేసిన పత్రాలు కనిపిస్తాయి. అవసరమైనవి ముందే పొందండి.',
    ml: 'DigiLocker 2026 നവംബർ 2-ന് പുലർച്ചെ 1 മുതൽ 4 വരെ അറ്റകുറ്റപ്പണിക്കായി ലഭ്യമാകില്ല. ആപ്പിൽ ഓഫ്‌ലൈനായി സേവ് ചെയ്ത രേഖകൾ കാണാം. ആവശ്യമുള്ളവ മുൻകൂട്ടി നേടുക.',
    sources: [SRC.notice(1)],
  },
};

// Status words specific to this site (the shared router already knows "status" / "track").
export const STATUS_RE = /my request|request status|अनुरोध|request kahan|అభ్యర్థన|അഭ്യർത്ഥന/;

// Answer intents, checked in order after the shared safety, call, handoff, status and complaint rules.
export const INTENTS = [
  ['mismatch', /not fetch|cannot fetch|can'?t fetch|error|mismatch|wrong (name|details|date)|nahi aa raha|नहीं आ रहा|गलत|రావడం లేదు|తప్పు|ലഭിക്കുന്നില്ല|തെറ്റ/i],
  ['pin', /pin|password|forgot|bhool|भूल|మర్చిపో|മറന്ന/i],
  ['maintenance', /maintenance|down|unavailable|band rahega|रखरखाव|నిర్వహణ|അറ്റകുറ്റ/i],
  ['valid', /valid|original|legal|accept|maany|मान्य|मूल|అసలు|చెల్లుబాటు|ഒറിജിനൽ|സാധു/i],
  ['upload', /upload|अपलोड|అప్‌లోడ్|അപ്‌ലോഡ്|storage|size|mb/i],
  ['share', /share|send|साझा|भेज|పంచుకో|పంపు|പങ്കിട/i],
  ['signup', /sign ?up|sign ?in|log ?in|register|create (an )?account|account kaise|खाता|ఖాతా|అకౌంట్|അക്കൗണ്ട്|സൈൻ അപ്പ്/i],
  ['fetch', /licen[cs]e|marksheet|certificate|fetch|get (my )?document|which .*documents|aadhaar|insurance|health record|\bpan\b|\brc\b|लाइसेंस|मार्कशीट|प्रमाण|లైసెన్స్|మార్కుల|ലൈസൻസ്|മാർക്ക്|സർട്ടിഫിക്കറ്റ്/i],
  ['about', /what is (digi ?locker|this)|about digi ?locker|digi ?locker (kya|क्या|అంటే|എന്താണ്)/i],
];

function mask(name) { return name.split(' ').map((w) => `${w[0]}***`).join(' '); }

// Mock of the get_request_status tool (the real one reads the service-requests table after OTP).
export function lookupRecord(ref) {
  const known = {
    DL2610045821: { name: 'Ramesh Kumar', request: 'Driving licence fetch', issuer: 'Transport (Uttar Pradesh)', status: 'Pending with issuer', raised: '14 Oct 2026', next: 'Issuer to correct the date of birth' },
    DL2610091174: { name: 'Lakshmi Reddy', request: 'Class X marksheet', issuer: 'CBSE', status: 'Issued', raised: '02 Oct 2026', next: 'Saved in Issued Documents' },
    DL2610067730: { name: 'Anil Kumar Nair', request: 'Vehicle registration (RC)', issuer: 'Transport (Kerala)', status: 'Name mismatch with Aadhaar', raised: '11 Oct 2026', next: 'Correct the name with the issuer, then fetch again' },
  };
  const r = known[ref] || { name: 'Demo Citizen', request: 'Caste certificate', issuer: 'Revenue (Andhra Pradesh)', status: 'Under review', raised: '18 Oct 2026', next: 'Issuer reviews within 7 working days' };
  return {
    title: 'Request status',
    rows: [['Request no.', ref], ['Name', mask(r.name)], ['Request', r.request], ['Issuer', r.issuer], ['Status', r.status], ['Raised on', r.raised], ['Next step', r.next]],
  };
}
