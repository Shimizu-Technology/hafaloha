# Development Guide — Hafaloha V2 Frontend

> **Project:** Hafaloha V2 Frontend (Shopify replacement — long-term product)
> **Stack:** React 19 · Vite 7 · TypeScript · Tailwind · Clerk auth
> **API:** Expects V2 API at configured API URL
> **Plane Board:** HAF (Hafaloha Orders)

---

## Quick Start

```bash
git clone git@github.com:Shimizu-Technology/hafaloha-web.git
cd hafaloha-web
npm install
cp .env.example .env   # Add Clerk key + API URL
npm run dev             # → http://localhost:5173
```

> Requires `.env` with Clerk publishable key and API URL.

---

## Gate Script

**Every PR must pass the gate before submission.**

```bash
./scripts/gate.sh
```

This runs:
1. **TypeScript check** — type errors fail the gate
2. **Vite build** — production build must succeed
3. **ESLint** — linting checks
4. **Playwright E2E tests** — 29 test files across 8 projects

❌ If the gate fails, fix the issues before creating a PR. No exceptions.

### Pre-Existing Issues (Known Debt)

These exist in the codebase and are **not** blockers for new PRs:
- **64 ESLint errors** — mostly `no-explicit-any` violations
- **27 ESLint warnings** — being cleaned up incrementally
- **1.5MB JS bundle** — needs code-splitting work (tracked)

The gate script accounts for these. New code must not introduce *additional* issues.

---

## Development Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Start dev server | `npm run dev` |
| Build for prod | `npm run build` |
| Type check | `npx tsc --noEmit` |
| Lint | `npx eslint .` |
| Run E2E tests | `npx playwright test` |
| Run gate | `./scripts/gate.sh` |

---

## Environment Variables

Required in `.env`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_BASE_URL=http://localhost:3000
```

---

## ⚠️ Known Issue: Clerk Instance Mismatch

**See HAF-85.** There is a Clerk instance mismatch between local development and the Netlify staging deployment. Local dev and staging use different Clerk instances, which means:
- Users created locally won't exist on staging (and vice versa)
- Auth tokens are not interchangeable

Be aware of this when testing auth flows.

---

## Closed-Loop Development Workflow

We use a "close the loop" approach where agents verify their own work before human review:

### Three Gates

1. **Sub-Agent Gate (automated)** — `./scripts/gate.sh` must pass (tsc + build + ESLint + Playwright)
2. **Jerry Visual QA (real browser)** — Navigate pages, take screenshots, verify flows work
3. **Leon Final Review (human)** — Review PR + screenshots, approve/reject

Leon shifts from "test everything" to "approve verified work." The gate script is the first line of defense — no PR without a green gate.

### Branch Strategy

- All feature work branches from `staging`
- All PRs target `staging` (never `main` directly)
- `main` only gets updated when Leon approves merging staging
- Feature branches: `feature/<TICKET-ID>-description`

```bash
git checkout staging && git pull
git checkout -b feature/HAF-30-add-product-filters
```

### PR Process

- **Title:** `HAF-30: Add product filter sidebar`
- **Body includes:** what changed, gate results, screenshots
- After creating PR:
  1. Move Plane ticket (HAF board) to **QA / Testing**
  2. Add PR link to the ticket

### Ticket Tracking

All work is tracked on the **HAF** board in [Plane](https://plane.shimizu-technology.com).

---

## Architecture Notes

- **Auth:** Clerk (React SDK `@clerk/clerk-react`)
- **Port:** Dev server runs on 5173
- **This is the long-term product** — replaces Shopify for Hafaloha's ordering needs
- Paired with [hafaloha-api](../hafaloha-api/DEVELOPMENT.md)
