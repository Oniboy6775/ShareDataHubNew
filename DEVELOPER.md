# Affiliate Platform — Developer Guide

A white-label reseller platform built on top of a main data/airtime provider. Each deployed instance is one client's branded site. Users buy data, airtime, and electricity; the platform earns the margin between cost price and selling price.

---

## Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Backend          | Node.js + Express, CommonJS                                           |
| Database         | MongoDB via Mongoose                                                  |
| Frontend         | React 19, Vite, Tailwind CSS v3                                       |
| State / fetching | TanStack Query v5                                                     |
| Auth tokens      | JWT (30-day) + `x-auth-token` header                                  |
| API auth         | Bearer token looked up against `user.apiToken`                        |
| Payments         | Monnify (card/bank transfer) + BillStack (dedicated virtual accounts) |
| Notifications    | In-app + optional SMTP email                                          |
| Icons            | lucide-react                                                          |
| Toasts           | react-hot-toast                                                       |

---

## Repository Structure

```
affiliate/
├── backend/
│   ├── Controllers/
│   │   ├── adminController.js     — all admin logic (dashboard, plans, settings, analytics)
│   │   ├── authController.js      — register, login, profile, password reset
│   │   ├── planController.js      — list plans (user-facing)
│   │   ├── purchaseController.js  — buy data, airtime, electricity, cable
│   │   └── walletController.js    — fund wallet, Monnify webhook
│   ├── Middleware/
│   │   ├── auth.js                — JWT + API token auth middleware
│   │   └── isAdmin.js             — admin guard middleware
│   ├── Models/
│   │   ├── userModel.js           — users, balances, referrals, account numbers
│   │   ├── planModel.js           — data/airtime plans with multi-tier pricing
│   │   ├── transactionModel.js    — every purchase record
│   │   ├── settingsModel.js       — singleton site config (payment keys, theme, SMTP)
│   │   ├── notificationModel.js   — per-user notifications
│   │   ├── broadcastModel.js      — site-wide banners
│   │   └── couponModel.js         — discount coupons
│   ├── Routes/
│   │   ├── authRoutes.js
│   │   ├── planRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── walletRoutes.js
│   │   └── adminRoutes.js
│   ├── Utils/
│   │   ├── generateReceipt.js
│   │   ├── notify.js              — create in-app notification helper
│   │   └── sendEmail.js           — SMTP email helper
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── networks/              — place mtn.png, glo.png, airtel.png, 9mobile.png here
    └── src/
        ├── main.jsx               — providers: QueryClient > ThemeProvider > AuthProvider
        ├── App.jsx                — all routes, PrivateRoute / AdminRoute guards
        ├── theme.config.js        — reads VITE_* env vars, fallbacks to defaults
        ├── index.css              — CSS custom properties + Tailwind base + keyframe animations
        ├── context/
        │   ├── AuthContext.jsx    — user state, login/logout, isAdmin flag
        │   └── ThemeContext.jsx   — applies theme to CSS vars + fetches DB overrides
        ├── services/
        │   ├── api.js             — axios instance, naira() formatter
        │   ├── auth.service.js    — auth API calls
        │   ├── plan.service.js    — plan API calls
        │   └── admin.service.js   — admin API calls
        ├── hooks/
        │   └── useContactPicker.js — Web Contact Picker API (Android Chrome only)
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.jsx     — sidebar + topbar shell
        │   │   └── Sidebar.jsx    — nav links (userNav + adminNav arrays)
        │   └── ui/
        │       ├── Card.jsx
        │       ├── Badge.jsx
        │       ├── Spinner.jsx
        │       ├── PhoneInput.jsx — phone input with optional contact-picker button
        │       └── ...
        └── pages/
            ├── landing/           — Landing, Privacy, Terms, DataDeletion
            ├── auth/              — Login, Register, ForgotPassword, ResetPassword
            ├── user/              — Dashboard, BuyData, BuyAirtime, BuyElectricity,
            │                        Transactions, Profile, FundWallet, Earnings, ApiDocs
            └── admin/             — AdminDashboard, AdminUsers, AdminTransactions,
                                     AdminPlans, AdminCoupons, AdminNotifications,
                                     AdminSettings, AdminUserPricing, AdminBroadcast
```

---

## Local Development

### 1. Install dependencies

```bash
# from affiliate/backend/
npm install

# installs frontend deps too
npm run install-client
```

### 2. Create `affiliate/backend/.env`

```env
PORT=5001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/affiliate

JWT_SECRET=any_long_random_string
ADMIN_ID=<MongoDB _id of the admin user>

# Main platform — where plans are purchased wholesale
MAIN_PLATFORM_URL=https://datareloaded.com/api/v1
MAIN_PLATFORM_API_KEY=<your reseller key from the main platform>

# Monnify (card / bank transfer funding)
MONNIFY_API_KEY=
MONNIFY_SECRET_KEY=
MONNIFY_CONTRACT_CODE=
MONNIFY_BASE_URL=https://sandbox.monnify.com   # use api.monnify.com in production

# BillStack (dedicated virtual account numbers)
BILLSTACK_API=https://billstack.ng/api/v1
BILLSTACK_SECRET=

# Email (optional — can also be set in Admin > Settings)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@yourdomain.com

FRONTEND_URL=http://localhost:5173
```

### 3. Create `affiliate/frontend/.env` (optional for local theming)

```env
VITE_SITE_NAME=My Data Hub
VITE_COLOR_PRIMARY=#6366f1
VITE_COLOR_SECONDARY=#8b5cf6
VITE_COLOR_DARK=#1a2035
VITE_COLOR_DARKER=#101320
VITE_COLOR_LIGHT=#f5f5f5
VITE_SUPPORT_WHATSAPP=2348000000000
VITE_LOGO_PATH=/logo.png
```

All `VITE_*` vars are optional — `theme.config.js` has fallback defaults.

### 4. Run

```bash
# from affiliate/backend/ — runs backend + frontend together
npm start
```

Backend: `http://localhost:5001`
Frontend: `http://localhost:5173` (Vite proxies `/api` → `5001`)

---

## Authentication

Two mechanisms, both handled by `backend/Middleware/auth.js`:

**Session users (browser)**

- Login returns a JWT, stored in localStorage as `affiliate_token`
- Every request sends `x-auth-token: <jwt>` header

**API users (external integrations)**

- User generates an `apiToken` from the API Docs page
- Requests send `Authorization: Bearer <apiToken>`
- Middleware looks up the token in the `User` collection, mints a temporary JWT, and proceeds

The same `auth` middleware handles both transparently.

---

## User Types & Pricing Tiers

Each user has a `userType` that determines which price they pay for a plan:

| userType   | Price field used       |
| ---------- | ---------------------- |
| `user`     | `plan.sellingPrice`    |
| `reseller` | `plan.resellerPrice`   |
| `api user` | `plan.apiPrice`        |
| `admin`    | cost price (no margin) |

Special pricing: if a user has `isSpecial: true`, the admin can override individual plan prices via `user.specialPrices[]`. This takes precedence over the tier price.

---

## Plan Sync

Plans come from the main platform. Admin triggers sync from **Admin > Plans > Sync**.

`adminController.syncPlans`:

- Fetches all plans from `MAIN_PLATFORM_URL/plan`
- Upserts each plan by `planId` using `$setOnInsert` for prices and `isAvailable`
- **Important:** `sellingPrice`, `resellerPrice`, `apiPrice`, and `isAvailable` are in `$setOnInsert` — they are only set on the very first insert. After that, syncing never overwrites admin-set prices or the enabled/disabled state.
- Only `costPrice`, `network`, `planName`, `planType`, `planCategory` are updated on every sync (in `$set`).

To reset a plan's selling price back to cost, manually edit it in Admin > Plans.

---

## Settings Singleton

`Settings` is a single MongoDB document (enforced by `getSingleton()`). It stores:

- **Payment credentials** — Monnify keys, BillStack keys (override `.env` values when set)
- **Theme overrides** — colors, site name, logo URL (override `VITE_*` build-time values at runtime)
- **SMTP** — email credentials
- **Commission** — per-plan commission amounts for referral earings
- **Registration bonus** — amount credited when a new user registers

`getSettings` in admin controller merges DB values with env fallbacks before returning to the frontend. The `updateSettings` function has an explicit `allowed` whitelist — add new fields there when extending the model.

---

## Theme System (Two Layers)

**Layer 1 — Build time** (`theme.config.js`)
Reads `VITE_*` env vars. Used for Render multi-client deployments — set different vars per service.

**Layer 2 — Runtime** (`/api/theme` endpoint)
`ThemeProvider` fetches the Settings document on load. Non-empty DB values override the build-time config. Admin can change colors live from Admin > Settings without redeploying.

CSS custom properties (`--color-primary`, etc.) are set on `document.documentElement` by `ThemeContext`. Tailwind is configured to use these same variables via `tailwind.config.js`.

**Rule:** always use `useTheme()` to get the real hex value when you need it in an inline `style={}` prop. Never use `var(--color-primary)` inside an inline style — it can render blank on first paint before the JS sets the variable.

---

## Multi-Client Deployment (Render)

One GitHub repo → many Render services, each with its own env vars.

**Frontend (Static Site)**

```
Build command:  npm run build
Publish dir:    dist
```

Set per-client `VITE_*` env vars in the Render dashboard. Each build is isolated and bakes in the correct theme.

**Backend (Web Service)**

```
Start command:  node server.js
```

Set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_ID`, payment keys, etc. per service.

When you push one commit, every Render service rebuilds automatically.

---

## API Routes Reference

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile                  — also refreshes user state
PATCH  /api/auth/profile
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/transactions
POST   /api/auth/generate-api-token
GET    /api/auth/earnings

GET    /api/plans                         — all available plans (isAvailable: true)

POST   /api/buy/data
POST   /api/buy/airtime
POST   /api/buy/electricity
// POST /api/buy/cable                    — disabled, uncomment when ready

POST   /api/wallet/fund                   — initiate Monnify payment
POST   /api/webhook/monnify              — Monnify payment webhook (no auth)

GET    /api/admin/dashboard
GET    /api/admin/analytics/profit
GET    /api/admin/users
PATCH  /api/admin/users/:id
POST   /api/admin/users/credit
PATCH  /api/admin/users/:id/special-pricing
GET    /api/admin/transactions
POST   /api/admin/transactions/refund
GET    /api/admin/plans
PATCH  /api/admin/plans/:id
POST   /api/admin/plans/sync
GET    /api/admin/settings
PATCH  /api/admin/settings
GET    /api/admin/broadcasts
POST   /api/admin/broadcasts
PATCH  /api/admin/broadcasts/:id/toggle
DELETE /api/admin/broadcasts/:id
GET    /api/broadcasts                    — public, no auth, active banners only
GET    /api/theme                         — public, no auth, theme overrides
```

---

## Frontend Patterns

**Adding a new page**

1. Create `src/pages/user/MyPage.jsx`
2. Import and add `<Route path="/my-page" element={<MyPage />} />` inside the `PrivateRoute` block in `App.jsx`
3. Add a nav entry in `Sidebar.jsx` `userNav` array

**Adding a new admin page**
Same but inside `AdminRoute` block and `adminNav` array.

**Data fetching**
Always use TanStack Query. The `QueryClient` is configured with `staleTime: 30_000` (30s).

```js
const { data, isLoading } = useQuery({
  queryKey: ["my-key"],
  queryFn: () => myService.getData().then((r) => r.data),
});

const mutation = useMutation({
  mutationFn: (payload) => myService.postData(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["my-key"] });
  },
});
```

**Phone input with contact picker**
Use `PhoneInput` instead of a raw `<input>` for any phone number field. On Android Chrome the user gets a contact book button automatically; on all other browsers it behaves like a normal input.

```jsx
import PhoneInput from '../../components/ui/PhoneInput'

const [phone, setPhone] = useState('')
const [contactName, setContactName] = useState('')

<PhoneInput
  label="Phone number"
  value={phone}
  onChange={e => { setPhone(e.target.value); setContactName('') }}
  contactName={contactName}
  onContactPick={({ number, name }) => { setPhone(number); setContactName(name) }}
/>
```

---

## Currently Disabled Features

| Feature                | Where to re-enable                                                        |
| ---------------------- | ------------------------------------------------------------------------- |
| Cable TV purchase page | `App.jsx` line ~75, `Sidebar.jsx` `userNav`, `Dashboard.jsx` `quickLinks` |
| Cable TV API docs      | `ApiDocs.jsx` — sidebar entry + section both commented                    |

Search for `// ` + the feature name to find all comment-out points.

---

## Common Gotchas

**`updateSettings` whitelist** — `adminController.js` has an `allowed` array that gates which fields get saved. If you add a field to `settingsModel.js`, also add its name to `allowed` or it will silently not save.

**Plan sync overwrites prices** — it doesn't, by design. Selling prices are in `$setOnInsert`. If a price looks wrong after sync, the admin must edit it manually.

**JWT vs API token** — `auth.js` first checks if the Bearer token matches `user.apiToken`. If it does, it mints a short-lived JWT on the fly. Do not confuse the two; `apiToken` is a plain UUID, the JWT is signed.

**`isAdmin` check** — `isAdmin.js` compares `req.user.userId` to `process.env.ADMIN_ID`. The `ADMIN_ID` env var must be the MongoDB `_id` string of the admin user, not the email or username.

**Theme inline styles** — use `useTheme().colors.primary` not `var(--color-primary)` in JSX `style={}` props. The CSS variable may not be set yet on first render.

**SVG chart scaling** — the profit chart SVG uses `preserveAspectRatio="none"` so it fills its container on all screen sizes. The `viewBox` is `0 0 1200 260` but the container height is set via Tailwind responsive classes (`h-[240px] sm:h-[280px] md:h-[320px]`). Tooltip positions are calculated as percentages of `W` and `H` (the viewBox dimensions), not the rendered pixel size.

---

## Adding a New Network/Provider

1. **Backend:** `purchaseController.js` — add a new route handler that calls the main platform's API with the right endpoint and parameters.
2. **Frontend:** create `src/pages/user/BuyXxx.jsx` following the pattern of `BuyData.jsx` or `BuyAirtime.jsx`.
3. Wire it up in `App.jsx`, `Sidebar.jsx`, and `Dashboard.jsx` quick links.
4. Document the endpoint in `ApiDocs.jsx`.

---

## Network Logo Images

Place PNG files at `frontend/public/networks/`:

- `mtn.png`
- `glo.png`
- `airtel.png`
- `9mobile.png`

Referenced as `/networks/mtn.png` in the buy pages. The folder exists but images must be added manually.
