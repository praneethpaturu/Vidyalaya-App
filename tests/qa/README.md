# Vidyalaya QA Test Suite

Three layers, each runnable independently:

```
tests/
├── qa/
│   ├── SCENARIOS.md       — full TC catalog (this is the truth)
│   ├── runner.py          — Python HTTP+DB suite (run on a vanilla mac)
│   ├── results.txt        — last runner.py output (text)
│   └── results.json       — last runner.py output (machine readable)
├── qa-e2e/                — Playwright UI tests (requires node)
│   ├── _helpers.ts
│   ├── 01-login.spec.ts
│   ├── 02-role-gates.spec.ts
│   ├── 03-payments-flow.spec.ts
│   ├── 04-invites-flow.spec.ts
│   ├── 05-each-page-renders.spec.ts
│   ├── 06-accessibility.spec.ts
│   ├── 07-edge-and-resilience.spec.ts
│   └── 08-content-safety.spec.ts
└── (existing Vitest unit tests — unchanged)
```

## How to run

### 1. Python HTTP+DB suite — runs from any Python 3 env (no Node needed)

```bash
pip3 install --user pg8000
python3 tests/qa/runner.py
# or: --only TC-001 TC-005   to scope
# or: --tag security          to filter by tag
```

Defaults target https://vidyalaya-app.vercel.app and the production
Supabase pooler. Override with:

```bash
VIDYALAYA_BASE=https://vidyalaya-h8azzf575-praneethpaturus-projects.vercel.app \
VIDYALAYA_DB="postgresql://..." \
VIDYALAYA_DIGEST_SECRET="..." \
RZP_WEBHOOK_SECRET="..." \
python3 tests/qa/runner.py
```

Writes `tests/qa/results.txt` + `tests/qa/results.json`. Exit 0 on all-pass.

### 2. Playwright UI suite

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test tests/qa-e2e/
# or: npx playwright test tests/qa-e2e/01-login.spec.ts --reporter=list
```

Set `VIDYALAYA_BASE` to point at preview/local instead of prod:
```bash
VIDYALAYA_BASE=http://localhost:3000 npx playwright test tests/qa-e2e/
```

### 3. Vitest unit suite (already in repo)

```bash
npm test
```

## Coverage matrix — which suite covers what

| Concern | Python | Playwright | Vitest |
|---|---|---|---|
| Pure functions (tax, vendor-tds, compliance) |  |  | ✅ |
| HTTP route auth gating | ✅ | ✅ | partial |
| Page role gates (URL bar) | ✅ | ✅ |  |
| Login + lockout + reset | ✅ | ✅ |  |
| Invite + accept flow | ✅ | ✅ |  |
| Payments order create + webhook | ✅ | ✅ (UI) |  |
| Razorpay signature verify | ✅ |  |  |
| GPS ingest + driver-token | ✅ |  |  |
| Daily digest + cron auth | ✅ |  |  |
| Tax exports (HTTP) | ✅ |  |  |
| Form 16 / 16A PDF byte structure | ✅ |  |  |
| AI provider sanity | ✅ |  |  |
| DB integrity (orphans, uniques, constraints) | ✅ |  |  |
| UI a11y (labels, landmarks) |  | ✅ |  |
| Responsive breakpoints |  | ✅ |  |
| Keyboard navigation |  | ✅ |  |
| XSS / output encoding |  | ✅ |  |
| Cookie flags (HttpOnly, Secure) |  | ✅ |  |
| Browser back/forward / refresh / cookie clear |  | ✅ |  |
| Slow / failing API resilience |  | ✅ |  |
| Header injection in form fields |  | ✅ |  |
| Path traversal | ✅ |  |  |

## Adding new scenarios

1. Add a row to `tests/qa/SCENARIOS.md` with a new TC-### ID, category, description, expected.
2. Implement in the right runner (Python or Playwright).
3. Reference the TC-ID in the test name or a comment so reports tie back.
