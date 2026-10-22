// Widget interface text. English and Hindi are mandatory; Telugu and Malayalam are the POC's two
// additional Indian languages. The site name and the reference-number label come from ./content.js.
import { AUTH, SITE } from './content.js';

const n = SITE.name;
export const STRINGS = {
  en: {
    title: n, sub: 'AI assistant', subAgent: 'Chatting with an officer', launcher: `Ask ${n}`,
    placeholder: 'Type your question…', send: 'Send', open: 'Open the AI assistant', close: 'Close assistant', language: 'Language',
    voice: 'Start a voice call', callLauncher: 'Call',
    callShort: 'Call', callNow: 'Start voice call', callHint: 'Talk to the assistant', helpful: 'Was this helpful?', thanks: 'Thanks for the feedback.',
    sources: 'Source', regNo: AUTH.label.en, mobile: 'Registered mobile number', sendOtp: 'Send OTP',
    otp: 'Enter the 6-digit OTP', verify: 'Verify', submit: 'Submit', edit: 'Edit', cancel: 'Cancel',
    callback: 'Request a callback', email: 'Get the reply by email', joined: 'has joined the chat',
    callConnecting: 'Connecting to the voice assistant…', callLive: 'Connected. Speak now.', callIn: 'Speaking in',
    mute: 'Mute', unmute: 'Unmute', endCall: 'End call', backToChat: 'Back to chat',
    callNote: 'Uses your microphone in the browser. No phone needed. In this demo the screen is shown; the voice agent connects once LiveKit is set up.',
    disclaimer: 'AI can make mistakes. Answers come from the official guides. Don’t share Aadhaar numbers, PINs or OTPs here.',
  },
  hi: {
    title: n, sub: 'AI सहायक', subAgent: 'अधिकारी से बातचीत', launcher: 'सवाल पूछें',
    placeholder: 'अपना सवाल लिखें…', send: 'भेजें', open: 'AI सहायक खोलें', close: 'सहायक बंद करें', language: 'भाषा',
    voice: 'वॉइस कॉल शुरू करें', callLauncher: 'कॉल करें',
    callShort: 'कॉल', callNow: 'वॉइस कॉल शुरू करें', callHint: 'सहायक से बात करें', helpful: 'क्या यह मददगार था?', thanks: 'प्रतिक्रिया के लिए धन्यवाद।',
    sources: 'स्रोत', regNo: AUTH.label.hi, mobile: 'दर्ज मोबाइल नंबर', sendOtp: 'OTP भेजें',
    otp: '6 अंकों का OTP डालें', verify: 'पुष्टि करें', submit: 'जमा करें', edit: 'बदलें', cancel: 'रद्द करें',
    callback: 'कॉलबैक का अनुरोध', email: 'जवाब ईमेल पर पाएँ', joined: 'चैट में शामिल हुए',
    callConnecting: 'वॉइस सहायक से जोड़ रहे हैं…', callLive: 'जुड़ गए। अब बोलिए।', callIn: 'भाषा',
    mute: 'म्यूट', unmute: 'अनम्यूट', endCall: 'कॉल समाप्त करें', backToChat: 'चैट पर वापस',
    callNote: 'ब्राउज़र में आपका माइक्रोफ़ोन इस्तेमाल होता है, फ़ोन की ज़रूरत नहीं। इस डेमो में केवल स्क्रीन दिखती है; LiveKit सेट होने पर वॉइस सहायक जुड़ जाएगा।',
    disclaimer: 'AI से गलती हो सकती है। जवाब आधिकारिक गाइड से आते हैं। यहाँ आधार नंबर, PIN या OTP न लिखें।',
  },
  te: {
    title: n, sub: 'AI సహాయకుడు', subAgent: 'అధికారితో చాట్', launcher: 'ప్రశ్న అడగండి',
    placeholder: 'మీ ప్రశ్న టైప్ చేయండి…', send: 'పంపండి', open: 'AI సహాయకుడిని తెరవండి', close: 'సహాయకుడిని మూసివేయండి', language: 'భాష',
    voice: 'వాయిస్ కాల్ ప్రారంభించండి', callLauncher: 'కాల్ చేయండి',
    callShort: 'కాల్', callNow: 'వాయిస్ కాల్ ప్రారంభించండి', callHint: 'సహాయకుడితో మాట్లాడండి', helpful: 'ఇది ఉపయోగపడిందా?', thanks: 'మీ అభిప్రాయానికి ధన్యవాదాలు.',
    sources: 'మూలం', regNo: AUTH.label.te, mobile: 'నమోదైన మొబైల్ నంబర్', sendOtp: 'OTP పంపండి',
    otp: '6 అంకెల OTP నమోదు చేయండి', verify: 'ధృవీకరించండి', submit: 'సమర్పించండి', edit: 'మార్చండి', cancel: 'రద్దు చేయండి',
    callback: 'కాల్‌బ్యాక్ కోరండి', email: 'సమాధానం ఈమెయిల్‌లో పొందండి', joined: 'చాట్‌లో చేరారు',
    callConnecting: 'వాయిస్ సహాయకుడితో కలుపుతున్నాం…', callLive: 'కనెక్ట్ అయ్యింది. ఇప్పుడు మాట్లాడండి.', callIn: 'భాష',
    mute: 'మ్యూట్', unmute: 'అన్‌మ్యూట్', endCall: 'కాల్ ముగించండి', backToChat: 'చాట్‌కు తిరిగి',
    callNote: 'బ్రౌజర్‌లో మీ మైక్రోఫోన్ ఉపయోగించబడుతుంది, ఫోన్ అవసరం లేదు. ఈ డెమోలో స్క్రీన్ మాత్రమే చూపబడుతుంది; LiveKit సిద్ధమైన తర్వాత వాయిస్ సహాయకుడు కనెక్ట్ అవుతాడు.',
    disclaimer: 'AI పొరపాట్లు చేయవచ్చు. సమాధానాలు అధికారిక మార్గదర్శకాల నుండి వస్తాయి. ఇక్కడ ఆధార్ నంబర్, PIN లేదా OTP పంచుకోవద్దు.',
  },
  ml: {
    title: n, sub: 'AI സഹായി', subAgent: 'ഉദ്യോഗസ്ഥനുമായി ചാറ്റ്', launcher: 'ചോദ്യം ചോദിക്കൂ',
    placeholder: 'നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക…', send: 'അയയ്ക്കുക', open: 'AI സഹായി തുറക്കുക', close: 'സഹായി അടയ്ക്കുക', language: 'ഭാഷ',
    voice: 'വോയ്സ് കോൾ ആരംഭിക്കുക', callLauncher: 'വിളിക്കുക',
    callShort: 'കോൾ', callNow: 'വോയ്സ് കോൾ ആരംഭിക്കുക', callHint: 'സഹായിയോട് സംസാരിക്കുക', helpful: 'ഇത് സഹായകമായോ?', thanks: 'അഭിപ്രായത്തിന് നന്ദി.',
    sources: 'ഉറവിടം', regNo: AUTH.label.ml, mobile: 'രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ', sendOtp: 'OTP അയയ്ക്കുക',
    otp: '6 അക്ക OTP നൽകുക', verify: 'സ്ഥിരീകരിക്കുക', submit: 'സമർപ്പിക്കുക', edit: 'മാറ്റുക', cancel: 'റദ്ദാക്കുക',
    callback: 'കോൾബാക്ക് അഭ്യർത്ഥിക്കുക', email: 'മറുപടി ഇമെയിലിൽ നേടുക', joined: 'ചാറ്റിൽ ചേർന്നു',
    callConnecting: 'വോയ്സ് സഹായിയുമായി ബന്ധിപ്പിക്കുന്നു…', callLive: 'ബന്ധിപ്പിച്ചു. ഇപ്പോൾ സംസാരിക്കൂ.', callIn: 'ഭാഷ',
    mute: 'മ്യൂട്ട്', unmute: 'അൺമ്യൂട്ട്', endCall: 'കോൾ അവസാനിപ്പിക്കുക', backToChat: 'ചാറ്റിലേക്ക് മടങ്ങുക',
    callNote: 'ബ്രൗസറിൽ നിങ്ങളുടെ മൈക്രോഫോൺ ഉപയോഗിക്കുന്നു, ഫോൺ ആവശ്യമില്ല. ഈ ഡെമോയിൽ സ്ക്രീൻ മാത്രം കാണിക്കുന്നു; LiveKit സജ്ജമായാൽ വോയ്സ് സഹായി ബന്ധിപ്പിക്കും.',
    disclaimer: 'AI-ക്ക് തെറ്റുകൾ പറ്റാം. ഉത്തരങ്ങൾ ഔദ്യോഗിക മാർഗ്ഗനിർദ്ദേശങ്ങളിൽ നിന്നാണ്. ആധാർ നമ്പർ, PIN അല്ലെങ്കിൽ OTP ഇവിടെ പങ്കിടരുത്.',
  },
};
