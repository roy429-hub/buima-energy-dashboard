# BUIMA Energy — B.E.S.T Dashboard

Internal sales & ROI tool. **No API key required.**

## What changed from the Gemini version?
- ❌ Removed: Gemini / Google AI dependency  
- ✅ Added: **Open-Meteo API** for real solar hours (free, no key, no rate limits)
- ✅ Added: **Static regional rate tables** for grid prices + EV charging fees (covers 30+ countries)
- ✅ Removed: Market Intelligence tab (required Gemini)

## Data sources
| Data | Source |
|------|--------|
| Solar peak sun hours | Open-Meteo Archive API (real historical data) |
| Grid electricity prices | IEA / GlobalPetrolPrices 2024 averages (static table) |
| EV charging fees | Regional market rates 2024 (static table) |
| Labor costs | Regional estimates (static table) |

---

## Deploy to Vercel (5 minutes)

### Option A — Vercel CLI (recommended)

```bash
# 1. Install Node.js if you don't have it: https://nodejs.org

# 2. Install Vercel CLI
npm install -g vercel

# 3. Install dependencies
npm install

# 4. Deploy (first time)
vercel

# Follow prompts:
#  - Link to existing project? → No
#  - Project name → buima-energy (or anything)
#  - Framework → Vite
#  - Root directory → ./
#  - Done! You'll get a URL like https://buima-energy.vercel.app

# 5. Re-deploy after changes
vercel --prod
```

### Option B — GitHub + Vercel (best for teams)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → "Add New Project"
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**
5. Share the URL with your team ✅

---

## Run locally

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Build for production

```bash
npm run build
# Output is in /dist — can also deploy to Netlify by dragging this folder
```

---

## Updating rate tables

Edit `/src/locationData.js` — the `REGIONAL_RATES` array.  
Each entry has: `match[]`, `country`, `currency`, `gridPrice`, `chargingFee`, `laborCost`, `dailySessions`.

Adding a new region:
```js
{ match: ['your city', 'your country'],
  country: 'Country Name', currency: 'USD',
  gridPrice: 0.10, chargingFee: 0.35, laborCost: 1500, dailySessions: 6 },
```
