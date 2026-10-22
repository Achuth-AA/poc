# Voice AI Agent Platform — POC frontends

Four separate React + Vite apps. They run entirely in the browser on mock data (no backend needed yet), so each one deploys to Vercel as a static site. The full design is in [docs/POC_DESIGN.md](docs/POC_DESIGN.md).

| Folder | App | Local port |
|---|---|---|
| `admin/` | Admin console (knowledge base, models, calls, evaluation) | 5173 |
| `human-assist/` | Agent console for human officers (live queue, callbacks) | 5174 |
| `citizen-digilocker/` | DigiLocker demo site with the assistant widget | 5175 |
| `citizen-umang/` | UMANG demo site with the assistant widget | 5176 |

## Run locally

Node 18 or newer.

```bash
npm run install:all     # npm install in all four apps
npm run dev:admin       # or dev:agent, dev:digilocker, dev:umang
npm run build:all       # production build of all four into <app>/dist
```

## Deploy to Vercel

Each app is its own Vercel project, all from this one repository. Do this four times, once per folder:

1. In Vercel, choose **Add New → Project** and import this repository.
2. Set **Root Directory** to the app folder (`admin`, `human-assist`, `citizen-digilocker` or `citizen-umang`).
3. Leave the build settings alone: the `vercel.json` in each folder already sets the Vite framework, `npm ci`, `npm run build` and the `dist` output, along with SPA rewrites, long-lived caching for hashed assets, `noindex` and security headers.
4. **Admin only:** add these environment variables so the sidebar links to the other apps. Leave one out to hide its link.

   | Variable | Value |
   |---|---|
   | `VITE_AGENT_CONSOLE_URL` | URL of the `human-assist` deployment |
   | `VITE_DIGILOCKER_DEMO_URL` | URL of the `citizen-digilocker` deployment |
   | `VITE_UMANG_DEMO_URL` | URL of the `citizen-umang` deployment |

   Vite inlines these at build time, so redeploy the admin project after changing them. See `admin/.env.example`.

5. Deploy.

Don't import the repository root as a project: it only holds helper scripts and has nothing to build.

### Demo switches

- Add `?agents=offline` to a citizen site URL to show the "officers offline" path (callback / email) instead of a live handoff.
- Demo OTP for the citizen widgets: `123456`. Sample references: `DL2610045821` (DigiLocker) and `UM2610078812` (UMANG).
