# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
Hafaloha is a monorepo with two services:
- **`api/`** — Rails 8 API (Ruby 3.3.4, PostgreSQL, port 3000)
- **`web/`** — React 19 + Vite frontend (TypeScript, port 5173)

### Starting services

1. **PostgreSQL:** `sudo service postgresql start`
2. **API:** `cd /workspace/api && bin/rails server -p 3000 -d`
3. **Web:** `cd /workspace/web && npx vite --host 0.0.0.0 --port 5173 &`
4. **Health check:** `curl http://localhost:3000/health`

### Database setup (first time only)
The API `.env` must NOT set `DATABASE_URL` for local development — comment it out or remove it so Rails uses the Unix socket connection defined in `config/database.yml`.

Migration `20260225044341_add_shipping_label_fields_to_orders` has a pre-existing bug: it tries to add `shipping_country` to `orders` but that column already exists from `schema.rb`. When running `db:migrate` on a fresh database after `db:schema:load`, you must manually mark this migration as applied and add the missing columns (`tracking_url`, `shipping_label_url`) via `rails runner` or console, then continue with remaining migrations.

### Lint, test, and build commands
See `api/DEVELOPMENT.md` and `web/DEVELOPMENT.md` for the full command tables. Key commands:

| Task | API (`api/`) | Web (`web/`) |
|------|-------------|-------------|
| Lint | `bundle exec rubocop` | `npx eslint .` |
| Test | `bundle exec rspec` | `npx tsc -b --noEmit` |
| Build | n/a | `npm run build` |
| Gate | `./scripts/gate.sh` | `./scripts/gate.sh` |

### Known pre-existing lint/test issues
- **API:** ~27 RuboCop offenses (known debt), 1 Brakeman warning, 3 gem vulnerabilities — all tracked
- **Web:** ~66 ESLint errors (mostly `no-explicit-any`), ~34 warnings — all tracked
- These are documented in the respective `DEVELOPMENT.md` files and are NOT blockers

### Environment variables
- **API:** Copy `api/.env.example` to `api/.env`. Clerk keys (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`) are required for auth flows; Stripe/EasyPost/Resend/AWS keys are optional for local dev.
- **Web:** Copy `web/.env.example` to `web/.env`. Set `VITE_API_BASE_URL=http://localhost:3000` and `VITE_CLERK_PUBLISHABLE_KEY`.
- Without valid Clerk keys, auth-dependent features won't work but the app still loads and serves public content.

### Ruby PATH
Ruby 3.3.4 is installed at `$HOME/.rubies/ruby-3.3.4/bin`. This is added to PATH via `~/.bashrc`.
