// Console state: officer status, handoff queue, the active conversation and callbacks.
// In the real build the queue and live transcript arrive over SSE from GET /v1/sessions/live.
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { createMock } from './data/mock.js';

export const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const ticketId = () => `G-2026-${Math.floor(1000 + Math.random() * 9000)}`;
const callbackRef = () => `CB-${Math.floor(10000 + Math.random() * 90000)}`;

function draftNotes(a) {
  const tickets = a.caller.tickets.length ? ` Grievance ${a.caller.tickets.join(', ')} registered.` : '';
  const rated = Object.values(a.feedback || {});
  const fb = rated.length ? ` Rated ${rated.length} suggested answer${rated.length === 1 ? '' : 's'} (${rated.filter((f) => f.vote === 'up').length} helpful, ${rated.filter((f) => f.vote === 'down').length} not).` : '';
  return `${a.summary.intent} ${a.caller.verified ? 'Caller verified with OTP.' : 'Caller not verified.'} ${a.summary.points.slice(1, 3).join(' ')} Officer explained the next steps.${tickets}${fb}`;
}

function withActive(state, fn) {
  return state.active ? { ...state, active: fn(state.active) } : state;
}
const line = (who, text, at = now()) => ({ who, text, at });

function reducer(state, action) {
  switch (action.type) {
    case 'tick':
      return {
        ...state,
        queue: state.queue.map((q) => ({ ...q, waitedSec: q.waitedSec + 1 })),
        active: state.active && !state.active.ended ? { ...state.active, startedSec: state.active.startedSec + 1 } : state.active,
      };
    case 'status':
      return { ...state, status: action.status };
    case 'accept': {
      const item = state.queue.find((q) => q.id === action.id);
      if (!item || state.active) return state;
      return {
        ...state,
        queue: state.queue.filter((q) => q.id !== action.id),
        active: {
          ...item, caller: { ...item.caller, tickets: [...item.caller.tickets] }, startedSec: 0, muted: false, held: false, ended: false, notes: '', feedback: {},
          transcript: [...item.history.map(([who, text]) => line(who, text, '')), line('system', `${state.officer.name} joined`)],
          liveQueue: [...item.live], awaitingCitizen: true,
          lastCitizen: item.history.filter(([w]) => w === 'citizen').pop()?.[1] || '',
        },
      };
    }
    case 'line':
      return withActive(state, (a) => ({
        ...a, transcript: [...a.transcript, line(action.who, action.text)], awaitingCitizen: a.awaitingCitizen || action.who === 'officer',
      }));
    case 'live':
      return withActive(state, (a) => {
        if (!a.liveQueue.length) return a;
        const [[who, text], ...rest] = a.liveQueue;
        return {
          ...a, liveQueue: rest, awaitingCitizen: false, transcript: [...a.transcript, line(who, text)],
          lastCitizen: who === 'citizen' ? text : a.lastCitizen,
        };
      });
    case 'toggle':
      return withActive(state, (a) => {
        const next = { ...a, [action.key]: !a[action.key] };
        return action.key === 'held' ? { ...next, transcript: [...a.transcript, line('system', next.held ? 'Caller put on hold' : 'Caller resumed')] } : next;
      });
    case 'end':
      return withActive(state, (a) => {
        const ended = { ...a, ended: true, transcript: [...a.transcript, line('system', a.channel === 'voice' ? 'Call ended' : 'Chat ended')] };
        return { ...ended, notes: draftNotes(ended) };
      });
    // Officer feedback on a suggested answer: goes to the knowledge team with the snippet's source (mock).
    case 'feedback':
      return {
        ...withActive(state, (a) => ({ ...a, feedback: { ...a.feedback, [action.key]: { vote: action.vote, reason: action.reason || '' } } })),
        feedbackLog: [{ key: action.key, source: action.source, vote: action.vote, reason: action.reason || '', by: state.officer.email, session: state.active?.id }, ...(state.feedbackLog || []).filter((f) => !(f.key === action.key && f.session === state.active?.id))],
      };
    case 'notes':
      return withActive(state, (a) => ({ ...a, notes: action.notes }));
    case 'verify':
      return withActive(state, (a) => ({
        ...a, caller: { ...a.caller, verified: true, authLevel: 1 }, transcript: [...a.transcript, line('system', 'OTP sent and verified · auth level 1')],
      }));
    case 'ticket':
      return withActive(state, (a) => ({
        ...a, caller: { ...a.caller, tickets: [...a.caller.tickets, action.id] },
        transcript: [...a.transcript, line('system', `Grievance ${action.id} registered by officer (${action.category})`)],
      }));
    case 'callback': {
      const a = state.active;
      const cb = { ref: callbackRef(), when: action.slot, lang: a.lang, channel: a.channel, summary: a.summary.intent, verified: a.caller.verified, status: 'scheduled' };
      return { ...state, callbacks: [cb, ...state.callbacks], active: { ...a, transcript: [...a.transcript, line('system', `Callback booked: ${action.slot}`)] } };
    }
    case 'complete':
      return { ...state, active: null, done: state.done + 1 };
    case 'handoff':
      return { ...state, queue: [...state.queue, action.item] };
    case 'callbackDone':
      return { ...state, callbacks: state.callbacks.map((c) => (c.ref === action.ref ? { ...c, status: 'done' } : c)) };
    default:
      return state;
  }
}

const Ctx = createContext(null);

// A new handoff arrives a little after start, to show the queue updating live.
const LATE_HANDOFF = {
  id: 's_c_2311', channel: 'chat', lang: 'Hinglish', site: 'UMANG', waitedSec: 0, reason: 'Caller asked for a person',
  caller: {
    label: 'Web visitor', phone: '—', verified: true, authLevel: 1, tickets: [],
    details: [['Request no.', 'UM26•••••190'], ['Service', 'LPG cylinder booking refund'], ['Status', 'Refund initiated'], ['Raised on', '17 Oct 2026']],
  },
  summary: { intent: 'Money deducted for an LPG booking that failed; refund not received yet.', points: ['Verified with OTP (form).', 'Status shows refund initiated on 17 Oct.', 'AI explained the 5–7 working day refund window; citizen still wants a person.'], sentiment: 'Frustrated' },
  history: [['ai', 'Your refund was initiated on 17 October. It usually reaches your account in 5 to 7 working days.'], ['citizen', 'Paisa abhi tak nahi aaya, kisi se baat karni hai'], ['system', 'Transferred to officer · AI summary attached']],
  live: [['citizen', 'Bank mein bhi check kiya, kuch nahi aaya. Ab kya karun?']],
};

export function AssistProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const m = createMock();
    return { ...m, status: 'available', active: null, done: 0 };
  });

  useEffect(() => {
    const clock = setInterval(() => dispatch({ type: 'tick' }), 1000);
    const late = setTimeout(() => dispatch({ type: 'handoff', item: LATE_HANDOFF }), 20000);
    return () => { clearInterval(clock); clearTimeout(late); };
  }, []);

  const value = useMemo(() => ({ state, dispatch, ticketId }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAssist = () => useContext(Ctx);
