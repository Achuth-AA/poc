# RFP coverage: do the POC screens show what DIC asks for?

Checked against *DIC Voice AI RFP v7.2* (Tendernotice_1, 47 pages): §6 Functional Scope, §7 Scope of Work,
§11 Evaluation (presentation topics), Clause 12 SLA, Annexure 2 (technical marks), Annexure 13 (AI quality),
Annexure 14 (model change control), Annexure 15 (outbound calling) and Annexure 23 (agentic capability declaration).

Legend: **✅ Shown**: a screen demonstrates it. **🟡 Partial**: touched, but an evaluator could say "show me more".
**❌ Missing**: no screen today. "Not a screen" items (turnover, staff, VAPT reports, training) are left out.

Apps: **Citizen** = UMANG / DigiLocker demo sites with the assistant widget · **Agent** = agent console ·
**Admin** = admin console.

## Annexure 2: what is scored in the live demo

| Marks | Requirement | Status | Where it is shown |
|---|---|---|---|
| #3 · 3 | PDF / DOCX / TXT converted to agent knowledge | ✅ | Admin → Knowledge → Edit library (Files, Drive) |
| #3 · 3 | Structured data: CSV / Excel, database or API | ✅ | Admin → Edit library (Data table, API); Citizen status lookup uses it |
| #3 · 2 | Knowledge used in a live conversation, **source shown** | ✅ | Citizen chat answers carry "doc · page"; Admin → Calls shows sources per turn |
| #3 · 2 | Update knowledge without code change / redeploy | ✅ | Admin → Edit library → "Update library" publishes v8, clears cache |
| #4 · 6 | ≥2 providers each for LLM, STT, TTS, switchable by configuration | ✅ | Admin → Models & voice (primary + backup per stage, Save) |
| #4 · 7 | ≥40% caching gain vs no-cache baseline | ✅ | Admin → Overview (47% hit rate), Evaluation ("Cache gain vs no-cache") |
| #4 · 7 | Median latency < 1 s; p50 + p90 over ≥100 turns, cache/rules vs LLM | ✅ | Admin → Overview (stage budget, p50/p90 split chart), Evaluation |
| #5 · 2 | Product maturity, versioning, release history | 🟡 | Admin → Models: version pins, change control, change history; no release-notes screen |
| #5 · 2 | Modular, provider-neutral architecture | ✅ | Models & voice (provider abstraction) |
| #5 · 3 | Omnichannel (voice, web, chat) **and telephony abstraction (SIP / carrier-neutral)** | ✅ | Admin → Channels & telephony: call path, numbers, SIP/PRI trunks with failover, web widget embed |
| #5 · 3 | Advanced voice agent: **after-call actions, call recording, media processing** | ✅ | Admin → Calls: recording player (OTP tones removed, split channels), after-call actions per call |
| #5 · 2 | Low/no-code integration with REST, GraphQL, JSON | ✅ | Admin → Integrations & tools: no-code REST / GraphQL / webhook connector with test call |
| #5 · 2 | Authentication, SSO and API security | ✅ | Citizen OTP; Admin → Access & security: SSO (SAML / OIDC), MFA, OAuth client credentials, secret rotation |
| #5 · 2 | RAG and workflow intelligence | ✅ | Knowledge test, grievance workflow with confirmation, status tool |
| #5 · 2 | Security, privacy, governance, audit trail, resilience/failover | ✅ | Audit trail, masking; Access → residency, retention, redaction; Models → failover drills; Channels → trunk failover |
| #5 · 2 | Live PoC on a buyer-supplied scenario | ✅ | Upload their document in Edit library, then ask in chat or on a call |

## §6 Functional scope

| § | Requirement | Status | Notes |
|---|---|---|---|
| 6.1 | Inbound voice bot, chatbot / web assistant, agent assist on one platform | ✅ | Citizen widget (chat + call), Agent console |
| 6.1 | **Outbound AI campaigns** | ✅ | Admin → Outbound campaigns: scripts, schedule, results; TCCCPR checks gate launch (Annex 15) |
| 6.1 | Human handoff, session continuity, audit trails, analytics | ✅ | Widget handoff, chat restored on reload, Admin Calls / Overview |
| 6.1 | Configurable personas, knowledge packs, **segregation for multiple projects** | 🟡 | Helpline switcher shows one helpline ("Add a helpline (later)") |
| 6.2 | Model-agnostic; cache ≥40%; tiered latency | ✅ | See Annexure 2 #4 |
| 6.3 | Interruption, silence, retry, transfer, structured disposition | ✅ | Channels → caller can interrupt, silence timeout, failed-turn limit; Agent → transfer, outcome |
| 6.3 | Recording, transcript, summary, tagging, outcome tracking | ✅ | Calls → recording, transcript, after-call actions; Agent → summary, outcome |
| 6.3 | **Queueing, transfer, conference / whisper / consult** | ✅ | Agent → Supervisor: listen, whisper, barge in / join chat; queue assignment |
| 6.4 | Ingest FAQs, SOPs, circulars, web content; refresh controls; source attribution | ✅ | Edit library (URL refresh 7/30/90 days), sources in answers |
| 6.4 | Approved templates, business rules, human-authored fallback | 🟡 | Fallback to officer ✅; no template / rules editor |
| 6.5 | Capture fields, trigger ticket / callback / SMS, validation, confirmation | ✅ | Widget grievance with confirm card; Agent actions |
| 6.5 | Human-in-loop checkpoints for sensitive transactions | ✅ | Confirm card ("Nothing is submitted until you press Submit") |
| 6.6 | Knowledge suggestions, summaries, disposition, after-call notes | ✅ | Agent console |
| 6.6 | Sentiment-aware handling | ✅ | Distress safety trigger, sentiment chip |
| 6.6 | **Supervisor dashboards, quality monitoring** | ✅ | Agent → Supervisor: live officers and calls, service level, flagged-for-review list |
| 6.7 | English, Hindi + 2 languages, code-mixed; detection or selection | ✅ | EN / HI / TE / ML, Hinglish detection, language menu |
| 6.7 | GIGW 3.0 / WCAG 2.1 AA web assistant | ✅ | Text size, contrast, keyboard, ARIA roles |
| 6.7 | **DTMF fallback** for callers who cannot speak | ✅ | Call keypad (menu, reference, OTP) |
| 6.7 | AI identifies itself; transfer after 2 failed turns / on request / safety trigger | ✅ | Greeting, 2-fail handoff, "talk to an officer", distress trigger |
| 6.8 | **Role-based access control**, secret management, environment segregation | ✅ | Access & security: roles × permissions, users, vault-held secrets with rotation |
| 6.8 | Masking, redaction, retention controls | ✅ | Access & security: retention per data type, masking choices, citizen erasure request |
| 6.8 | Prompt-injection / jailbreak defence | ✅ | Widget refuses; Evaluation red-team table |
| 6.8 | Tool parameters validated against allowlists; irreversible actions need human confirmation | ✅ | Integrations & tools: allowed parameters, "citizen confirms", rate limits per tool |
| 6.8 | Caller verified proportionate to transaction; caller ID ≠ authentication | ✅ | OTP in chat and on the call keypad; audit note "caller ID is not authentication" |
| 6.11 | Prompts, responses and actions logged and auditable | ✅ | Admin → Calls (per-turn route, model/version, latency, tool call) |
| 6.11 | Data processed in India; hosting location of every LLM/STT/TTS disclosed | ✅ | Provider cards show region ("India") |
| 6.11 | Secondary providers with failover within 15 minutes, tested twice a year | ✅ | Models → failover drill log with time to switch, "Run drill now" |
| 6.11 | Machine-readable API export of quality, latency, usage, SLA metrics | ✅ | Export JSON (Overview, Calls) |

## Clause 12, Annexures 13 and 14

| Item | Status | Notes |
|---|---|---|
| Clause 12: response time **p95** ≤ 1 s | ✅ | Evaluation shows p95 (1,140 ms, below target), Overview shows p50/p90 |
| Clause 12: availability ≥ 99.9% | ✅ | Overview "Availability 99.95%" |
| Annex 13: accuracy ≥95%, wrong ≤2%, STT ≥85/80%, escalation ≥95%, task completion | ✅ | Admin → Evaluation |
| Annex 14: version pinning, per-interaction model/version provenance | ✅ | Models change history; Calls shows model per turn |
| Annex 14: **approval before promotion, rollback within 30 minutes** | ✅ | Models → change control: proposed → evaluated → approved → promoted, 30-minute rollback |

## Remaining gaps

- **Release notes / product "About"** screen for Annex 2 #5 product maturity (versioning is shown in Models).
- **Multiple helplines / personas** (§6.1): the helpline switcher shows one helpline.
- **Response templates and business-rules editor** (§6.4): the human fallback works, but there is no editor.

The seven additions recommended in the first version of this check (channels and telephony, call recording and after-call actions,
integrations and tools, access and security, outbound campaigns, supervisor view, model change control and failover drills)
are now built and mapped above.
