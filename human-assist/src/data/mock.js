// Mock data for the human-assist (agent) console. In the real build the queue and live transcript arrive
// over SSE from GET /v1/sessions/live, and suggestions come from the same knowledge base the bot uses
// (public + internal documents, lower relevance threshold, raw snippets, no LLM).
// The helpline serves both demo citizen sites: DigiLocker and UMANG.
export function createMock() {
  const officer = { name: 'Sunita Sharma', short: 'SS', role: 'Helpline officer', email: 'sunita.sharma@dic.gov.in' };

  const queue = [
    {
      id: 's_8841', channel: 'voice', lang: 'Hindi', site: 'DigiLocker', waitedSec: 42, reason: 'Caller asked for a person',
      caller: {
        label: 'Caller ••612', phone: '+91 ••••• ••612', verified: true, authLevel: 1, tickets: [],
        details: [['Request no.', 'DL26•••••821'], ['Request', 'Driving licence fetch'], ['Issuer', 'Transport (Uttar Pradesh)'], ['Status', 'Pending with issuer'], ['Raised on', '14 Oct 2026']],
      },
      summary: {
        intent: 'Driving licence will not fetch into DigiLocker; wants to know how long the fix takes.',
        points: ['Verified with OTP (keypad).', 'Request DL26•••••821 is pending: the issuer must correct the date of birth.', 'AI explained the name / date-of-birth mismatch; the issuer’s timeline is not in the knowledge base.', 'Caller then asked for a person.'],
        sentiment: 'Calm, slightly impatient',
      },
      history: [
        ['ai', 'Namaste! This is an automated assistant for DigiLocker and UMANG. Aap Hindi ya English mein baat kar sakte hain.'],
        ['citizen', 'Kya DigiLocker wala driving licence original jaisa maana jaata hai?'],
        ['ai', 'Haan. DigiLocker mein issue hue dastavez IT niyam 9A ke tahat original ke barabar maany hain.'],
        ['citizen', 'Par mera licence fetch hi nahi ho raha. Request number DL2610045821.'],
        ['system', 'OTP verified by keypad · auth level 1'],
        ['ai', 'Aapki request issuer ke paas pending hai. Transport vibhaag ko janm tithi theek karni hai.'],
        ['citizen', 'Kitne din lagenge?'],
        ['ai', 'Issuer ki samay seema mere paas nahi hai. Kya aap kisi adhikari se baat karna chahenge?'],
        ['citizen', 'Haan, kisi insaan se baat karao.'],
        ['system', 'Transferred to officer · AI summary attached'],
      ],
      // Lines that "arrive" while the officer is on the call (simulated live transcript).
      live: [
        ['citizen', 'Namaste madam. Mujhe kal interview ke liye licence chahiye, kab tak theek hoga?'],
        ['citizen', 'Kya main tab tak apna physical licence upload kar sakta hoon?'],
        ['citizen', 'Theek hai. Aur agar mera mobile number badalna ho to?'],
      ],
    },
    {
      id: 's_c_2304', channel: 'chat', lang: 'English', site: 'UMANG', waitedSec: 18, reason: 'Two answers not found',
      caller: { label: 'Web visitor', phone: '—', verified: false, authLevel: 0, tickets: [] },
      summary: {
        intent: 'Asking whether an EPF claim can be filed if the employer has not approved KYC.',
        points: ['Not verified (no personal data shared).', 'AI found no confident answer twice and handed over.', 'Likely needs the EPFO KYC approval step explained.'],
        sentiment: 'Neutral',
      },
      history: [
        ['ai', 'Namaste! I am the automated assistant for UMANG.'],
        ['citizen', 'My employer has not approved my KYC on EPFO. Can I still file a claim on UMANG?'],
        ['ai', "Sorry, I couldn't find that in the service information. Could you say it another way?"],
        ['citizen', 'claim without employer kyc approval, possible?'],
        ['ai', "I still couldn't find an answer. I don't want to guess, so let me connect you to an officer."],
        ['system', 'Transferred to officer · AI summary attached'],
      ],
      live: [['citizen', 'Hello? Is anyone there?']],
    },
    {
      id: 's_8852', channel: 'voice', lang: 'Telugu', site: 'UMANG', waitedSec: 7, reason: 'Distress detected (safety trigger)',
      priority: true,
      caller: { label: 'Caller ••318', phone: '+91 ••••• ••318', verified: false, authLevel: 0, tickets: [] },
      summary: {
        intent: 'Upset that an EPF claim for medical treatment is stuck; family member in hospital.',
        points: ['Safety trigger on distress words → immediate transfer (no AI retry).', 'Not verified yet.', 'Handle with care; check the claim status after OTP and escalate if urgent.'],
        sentiment: 'Distressed',
      },
      history: [
        ['ai', 'నమస్కారం! This is an automated assistant for UMANG.'],
        ['citizen', 'నా EPF క్లెయిమ్ ఆగిపోయింది, అమ్మ ఆసుపత్రిలో ఉంది. ఏం చేయాలో తెలియడం లేదు. (My EPF claim is stuck and my mother is in hospital. I don’t know what to do.)'],
        ['system', 'Safety trigger · transferred immediately · flagged Critical'],
      ],
      live: [['citizen', 'దయచేసి సహాయం చేయండి, డబ్బు చాలా అవసరం. (Please help, I urgently need the money.)']],
    },
  ];

  // Knowledge snippets used for suggestions. internal = officer-only documents.
  const knowledge = [
    { keys: ['licence', 'fetch', 'error', 'mismatch', 'date', 'theek'], text: 'If a document cannot be fetched, the name or date of birth with the issuer may not match Aadhaar. The issuer must correct the record; then fetch again.', source: 'DigiLocker user FAQs', page: 11 },
    { keys: ['upload', 'physical', 'scan'], text: 'Citizens can upload their own PDF, JPG or PNG (up to 10 MB each, 1 GB in total), but uploaded files are not issuer-verified and may not be accepted as originals.', source: 'DigiLocker user FAQs', page: 9 },
    { keys: ['mobile', 'number', 'badal', 'change'], text: 'The mobile number can be changed in the profile after an OTP on the old number, or by signing in again with Aadhaar OTP.', source: 'DigiLocker user FAQs', page: 14 },
    { keys: ['pin', 'mpin', 'recovery', 'sign'], text: 'Verify the caller with an OTP first. Never ask for the security PIN or MPIN. For name corrections, raise an issuer ticket.', source: 'Officer SOP: account recovery and name mismatch', page: 2, internal: true },
    { keys: ['epf', 'claim', 'kyc', 'employer', 'approved'], text: 'An EPF claim needs the member’s KYC (Aadhaar, bank, PAN) approved by the employer. Until then, the claim option stays unavailable in UMANG.', source: 'UMANG user guide', page: 9 },
    { keys: ['stuck', 'status', 'track', 'claim', 'application'], text: 'Track a request in My Applications using its request number. EPF claims are normally settled within 20 days of filing.', source: 'UMANG user guide', page: 12 },
    { keys: ['distress', 'hospital', 'urgent', 'help'], text: 'For medical-emergency claims, note the claim ID and escalate to the EPFO nodal officer for priority. Escalate to the supervisor if the caller is at risk.', source: 'Officer SOP: sensitive calls', page: 1, internal: true },
  ];

  const categories = ['Document not fetching', 'Payment deducted, service failed', 'Account / PIN problem', 'Application stuck', 'Other'];
  const dispositions = ['Information given', 'Grievance registered', 'Callback scheduled', 'Escalated to issuer / department', 'Wrong number / no response'];

  const callbacks = [
    { ref: 'CB-48213', when: 'Tomorrow · 9 am – 12 pm', lang: 'Malayalam', channel: 'chat', summary: 'DigiLocker: Class XII marksheet shows the wrong name after the board corrected it.', verified: true, status: 'scheduled' },
    { ref: 'CB-48207', when: 'Tomorrow · 12 pm – 3 pm', lang: 'Hindi', channel: 'voice', summary: 'UMANG: LPG booking refund not received after 7 working days.', verified: false, status: 'scheduled' },
    { ref: 'CB-48190', when: 'Today · 3 pm – 6 pm', lang: 'English', channel: 'chat', summary: 'UMANG: payment deducted for a gas booking that failed. Complaint G-2026-0512 already registered.', verified: true, status: 'due' },
    { ref: 'CB-48177', when: 'Yesterday', lang: 'Telugu', channel: 'voice', summary: 'DigiLocker: forgot security PIN; reset walked through on callback.', verified: false, status: 'done' },
  ];

  return { officer, queue, knowledge, categories, dispositions, callbacks };
}
