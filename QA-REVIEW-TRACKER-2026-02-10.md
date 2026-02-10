# Hafaloha Review Tracker (2026-02-10)

This document tracks code-review findings and real-world verification status before implementation.

## Scope

- Current system: `hafaloha/api` and `hafaloha/web`
- Legacy comparison: `_archive/old-system`
- Goal: confirm which findings are reproducible in running environments

## Status Legend

- `pending` = not tested yet
- `confirmed` = reproduced and validated as real issue
- `not_reproduced` = attempted but not observed
- `needs_more_data` = partial evidence, needs deeper validation

## Findings Backlog

| ID | Severity | Area | Finding | Source Paths | Verification Status | Notes |
|---|---|---|---|---|---|---|
| F-001 | critical | API Security | Public order detail endpoint exposes order data by id/order number without ownership check | `api/app/controllers/api/v1/orders_controller.rb` | confirmed | `GET /api/v1/orders/1` and `/api/v1/orders/HAF-R-...` returned 200 with customer email/phone unauthenticated |
| F-002 | critical | Fundraiser Checkout | Frontend/backend contract mismatch for fundraiser order fields and payment handling | `web/src/pages/fundraiser/FundraiserCheckoutPage.tsx`, `api/app/controllers/api/v1/fundraisers/orders_controller.rb` | confirmed | Frontend-style payload returned 422; logs show unpermitted `email`, `phone`, `payment_intent_id` |
| F-003 | critical | Auth | JWT decode without signature verification | `api/app/controllers/concerns/authenticatable.rb` | confirmed | Unsigned forged JWT (`alg:none`) successfully authenticated and returned admin `GET /api/v1/me` |
| F-004 | high | Webhooks | Stripe webhook accepts unverified events when webhook secret missing | `api/app/controllers/webhooks/stripe_controller.rb` | confirmed | On temporary server with blank webhook secret, unsigned webhook returned 200 and updated order payment status |
| F-005 | high | Webhooks/Orders | Stripe webhook does not resolve/update `FundraiserOrder` lifecycle | `api/app/controllers/webhooks/stripe_controller.rb` | confirmed | Unsigned `payment_intent.succeeded` for `pi_qa_fundraiser_123` did not change `FundraiserOrder.payment_status` |
| F-006 | high | Fundraiser Cart | Fundraiser cart uses `session` in API-only app | `api/config/application.rb`, `api/app/controllers/api/v1/fundraisers/carts_controller.rb` | confirmed | `PUT /fundraisers/:slug/cart` returned `DisabledSessionError` (500) on session write |
| F-007 | high | CI Quality | API CI does not run RSpec tests | `api/.github/workflows/ci.yml` | confirmed | Static config check |
| F-008 | high | Ops Reliability | Production ActiveJob adapter is `:async` (non-durable) | `api/config/environments/production.rb` | confirmed | Static config check |
| F-009 | medium | Auth Admin Ops | Hardcoded admin email allowlist in code | `api/app/controllers/concerns/authenticatable.rb` | confirmed | Static code check |
| F-010 | medium | Secrets Hygiene | Missing top-level `.gitignore` while backup `.env` exists at repo root | `Backups/.env`, root | confirmed | Static repository structure check |
| F-011 | medium | Frontend Auth UX | Fragmented auth token handling and no centralized 401/403 handling | `web/src/services/api.ts`, `web/src/App.tsx`, `web/src/layouts/AdminLayout.tsx`, `web/src/pages/admin/*` | confirmed | Static code review confirmed fragmentation; full browser admin-path repro remains limited by local `5181 -> 3002` CORS/auth constraints |
| F-012 | low | Logging Correctness | Incorrect string interpolation in refund inventory audit logs | `api/app/controllers/api/v1/admin/orders_controller.rb` | confirmed | Static code check |

## Fix Status (Current Branch)

- `F-001` fixed and verified: order lookup now requires ownership or matching guest email.
- `F-002` fixed and verified: fundraiser order API now accepts frontend payload aliases and payment intent flow.
- `F-003` fixed and verified: JWT now goes through Clerk token verification (forged unsigned token rejected).
- `F-004` fixed in code and partially verified: webhook secret is now mandatory in production path.
- `F-005` fixed and verified: webhook now updates `FundraiserOrder` by metadata/id fallback.
- `F-006` fixed and verified: fundraiser cart/session logic moved off disabled Rails session writes.
- `F-007` fixed in code: CI workflow now includes RSpec with Postgres service.
- `F-008` fixed in code: production job adapter now defaults to durable adapter via env-backed configuration.
- `F-009` fixed in code: admin email list now supports `ADMIN_EMAILS` env configuration.
- `F-010` fixed at workspace level: root ignore file added to avoid accidental backup/env commits.
- `F-011` fixed in code: admin pages/services now use centralized auth helpers and shared 401/403 handling.
- `F-012` fixed and verified: refund audit interpolation corrected.

## Legacy vs New System Observations

These are strategic gaps to decide on (not necessarily bugs):

- O-001: no PayPal path in new system (old system had PayPal controllers/integration)
- O-002: no real-time ActionCable channels in new system
- O-003: reduced promo/VIP tooling vs old system
- O-004: fundraiser option-group depth appears reduced vs old wholesale engine

Status: `needs_more_data` (business priority decision required)

## Verification Plan (Execution Order)

1. Bring up `api` and `web` on non-conflicting ports.
2. Validate public-order data exposure (`F-001`) via browser/API flow.
3. Validate fundraiser checkout contract (`F-002`) with test payment flow.
4. Validate auth weakness claims (`F-003`, `F-011`) with controlled token scenarios.
5. Validate webhook behaviors (`F-004`, `F-005`) with local test payloads and logs.
6. Validate fundraiser session-cart behavior in API-only mode (`F-006`).

## Remediation Queue

All tracked remediation items `F-001` through `F-012` are implemented on this branch.

Remaining work is verification quality and strategic follow-up:
- Broader authenticated browser E2E validation once local CORS/auth test environment is aligned.
- Optional hardening around currently pending backend spec coverage (model/job spec placeholders).
- Product/business decisioning for `O-001` through `O-004`.

## Execution Log

- 2026-02-10: Initial findings captured from code review.
- 2026-02-10: Started `api` on `3002` and `web` on `5181` for isolated testing.
- 2026-02-10: Applied pending migrations required for API testing.
- 2026-02-10: Seeded deterministic QA records (order, fundraiser, variant, fundraiser order).
- 2026-02-10: Confirmed `F-001` via unauthenticated curl and Agent Browser API navigation.
- 2026-02-10: Confirmed `F-002` via frontend-style fundraiser order payload (422 + unpermitted params).
- 2026-02-10: Confirmed `F-003` by forging unsigned JWT and successfully authenticating as admin.
- 2026-02-10: Confirmed `F-004` by launching temporary server on `3003` with blank webhook secret and posting unsigned webhook that mutated payment state.
- 2026-02-10: Confirmed `F-005` by showing webhook event did not update matching `FundraiserOrder`.
- 2026-02-10: Confirmed `F-006` via `DisabledSessionError` on fundraiser cart update.
- 2026-02-10: Verified production-like webhook secret behavior on main server (`3002`) rejects unsigned webhook with `400`.
- 2026-02-10: Implemented and re-tested prioritized security and checkout fixes on `staging` branch.
- 2026-02-10: Post-fix verification:
  - guest `/orders/:id` without email now `404`; with matching email `200`
  - fundraiser frontend-style payload now creates order (`201`)
  - forged unsigned JWT now returns `401` on `/api/v1/me`
  - fundraiser cart update/show with `X-Session-ID` now returns `200` and persists
  - fundraiser webhook now updates `payment_status` and `status` to `paid`
- 2026-02-10: Added backend regression request specs:
  - `spec/requests/orders_access_spec.rb` (guest order email gate)
  - `spec/requests/stripe_webhook_spec.rb` (fundraiser webhook update + production-secret rejection path)
- 2026-02-10: Ran backend tests after adding specs:
  - `bundle exec rspec spec/requests/orders_access_spec.rb spec/requests/stripe_webhook_spec.rb` => `5 examples, 0 failures`
  - `bundle exec rspec` => `35 examples, 0 failures, 20 pending`
- 2026-02-10: Strengthened frontend auth handling by attaching 401/403 interceptor to both shared API client and default axios instance in `web/src/services/api.ts`.
- 2026-02-10: Frontend verification:
  - `npm run build` succeeds after interceptor changes
  - Agent Browser smoke test of `/admin` redirects to non-admin experience without errors
- 2026-02-10: Added repository-root `.gitignore` (`hafaloha/hafaloha/.gitignore`) to prevent accidental env/backup commits.
- 2026-02-10: Retested guest order confirmation page behavior in browser:
  - API endpoint confirmed: `GET /api/v1/orders/1?email=qa-public-order@example.com` returns `200`
  - Frontend route still showed fallback error in Agent Browser due local frontend/API origin mismatch constraints (CORS/environment), so API-level verification remains source of truth for this check.
- 2026-02-10: Continued `F-011` hardening by reducing fragmented admin auth calls:
  - Added shared authenticated request helper in `web/src/services/authApi.ts`
  - Refactored `AdminOrdersPage`, `AdminUsersPage`, and `AdminProductsPage` to use helper methods (`authGet`, `authPatch`, `authPost`) instead of repeated token/header boilerplate.
- 2026-02-10: Validation after `F-011` refactor:
  - `npm run build` succeeds
  - `ReadLints` clean for touched files
  - Agent Browser smoke check of `/admin/users` still stuck on loading state in current local browser environment, consistent with existing local auth/origin constraints.
- 2026-02-10: Continued `F-011` with additional low-risk batch:
  - Refactored `AdminDashboardPage`, `AdminAnalyticsPage`, and `AdminCollectionsPage` to use `authApi` helper.
  - No behavior changes intended beyond centralizing auth header/token flow.
- 2026-02-10: Validation for latest batch:
  - `ReadLints` clean on changed files
  - `npm run build` succeeds
  - Agent Browser smoke check of `/admin` still routes to public home when unauthenticated (expected in current local browser session)
- 2026-02-10: Continued `F-011` next low-risk batch:
  - Refactored `AdminFundraisersPage`, `AdminFundraiserFormPage`, and `AdminImportPage` to use `authApi` helper calls.
  - Kept endpoint paths and payload formats unchanged to minimize risk.
- 2026-02-10: Validation for this batch:
  - `ReadLints` clean on changed files
  - `npm run build` succeeds
  - Agent Browser smoke check of `/admin/fundraisers` redirects to public home in unauthenticated local session (expected)
- 2026-02-10: Continued `F-011` incremental cleanup:
  - Refactored `AdminInventoryPage` and `AdminFundraiserProductFormPage` to use `authApi` helper.
  - Left `AdminVariantPresetsPage` unchanged this pass because it already funnels requests through a dedicated service layer.
- 2026-02-10: Validation for latest incremental cleanup:
  - `ReadLints` clean on touched files
  - `npm run build` succeeds
  - Agent Browser check of `/admin/inventory` remains in loading state in local unauthenticated browser context (same known local auth/session constraint)
- 2026-02-10: Continued `F-011` incremental cleanup:
  - Added `authPut` to shared `web/src/services/authApi.ts` to keep existing PUT semantics while centralizing token/header handling.
  - Refactored `AdminAcaiPage` and `ProductFormPage` to use `authApi` helpers (`authGet`, `authPost`, `authPut`, `authDelete`) with typed API responses.
  - Kept endpoint paths and payload structures aligned with prior behavior to minimize risk.
- 2026-02-10: Validation for latest incremental cleanup:
  - `ReadLints` clean on touched files
  - `npm run build` succeeds
  - Agent Browser smoke check of `/admin/acai` redirected to public home in current unauthenticated local session; console still shows pre-existing local `5181 -> 3002` CORS errors.
- 2026-02-10: Continued `F-011` incremental cleanup:
  - Refactored `AdminFundraiserDetailPage` (including bulk import + add participant modal API calls) to use shared `authApi` helpers (`authGet`, `authPost`, `authPatch`, `authDelete`).
  - Added local typed response interfaces to preserve type safety after helper migration.
- 2026-02-10: Validation for latest incremental cleanup:
  - `ReadLints` clean on touched files
  - `npm run build` succeeds
  - Agent Browser smoke check of `/admin/fundraisers/1?tab=participants` redirected to public home in unauthenticated local session; console still shows known local CORS/auth constraints.
- 2026-02-10: Final `F-011` consistency pass:
  - Migrated `web/src/services/variantPresets.ts` from ad-hoc token/header handling to shared `authApi` helpers.
  - Updated `AdminVariantPresetsPage` and `VariantManager` calls to pass `getToken` directly to `variantPresetsService`.
  - No endpoint path/payload changes; only auth-flow centralization and stronger token requirements.
- 2026-02-10: Validation for final `F-011` pass:
  - `ReadLints` clean on touched files
  - `npm run build` succeeds
  - Search check confirms no remaining direct admin-page inline auth/token boilerplate.
  - Agent Browser smoke check of `/admin/settings/variant-presets` redirected to public home in unauthenticated local session; local `5181 -> 3002` CORS/auth constraints remain the limiting factor for full browser validation.
- 2026-02-10: Closeout verification pass:
  - `bundle exec rspec` => `35 examples, 0 failures, 20 pending`
  - `npm run build` succeeds after final auth-centralization changes
  - Tracker updated to mark `F-011` finding as confirmed and remediation queue as completed for `F-001`..`F-012`
- 2026-02-10: Test quality follow-up pass:
  - Updated invalid `user` factory defaults to valid role/email values and added `:admin` trait.
  - Removed skip fallback in authenticated order validation spec (`spec/models/order_spec.rb`) so it now executes against a real user factory.
  - `bundle exec rspec spec/models/order_spec.rb` => `11 examples, 0 failures`
  - `bundle exec rspec` => `35 examples, 0 failures, 19 pending` (pending count reduced by 1)
- 2026-02-10: Additional model coverage pass:
  - Replaced placeholder specs in `spec/models/user_spec.rb` and `spec/models/acai_setting_spec.rb` with real validation/behavior coverage.
  - Added coverage for user role defaults/helpers/scopes and acai setting validation, price helpers, ordering gate, minimum order date, and singleton instance behavior.
  - `bundle exec rspec spec/models/user_spec.rb spec/models/acai_setting_spec.rb` => `17 examples, 0 failures`
  - `bundle exec rspec` => `50 examples, 0 failures, 17 pending` (pending count reduced by 2)
- 2026-02-10: Additional model coverage pass (batch 2):
  - Replaced placeholder specs in `spec/models/acai_pickup_window_spec.rb` and `spec/models/site_setting_spec.rb` with real validation/behavior coverage.
  - Updated related factories (`spec/factories/acai_pickup_windows.rb`, `spec/factories/site_settings.rb`) to valid defaults that match current model constraints.
  - Added coverage for pickup-window validations, display helpers, time inclusion checks, and no-op slot generation guards.
  - Added coverage for site-setting processor/mode helpers, email routing behavior, shipping-origin validation/completeness, singleton instance, and destroy protection.
  - `bundle exec rspec spec/models/acai_pickup_window_spec.rb spec/models/site_setting_spec.rb` => `20 examples, 0 failures`
  - `bundle exec rspec` => `68 examples, 0 failures, 15 pending` (pending count reduced by 2)
- 2026-02-10: Additional model coverage pass (batch 3):
  - Replaced placeholder specs in `spec/models/acai_crust_option_spec.rb` and `spec/models/acai_placard_option_spec.rb` with real validation/behavior coverage.
  - Added coverage for required name/non-negative pricing validations, price helper formatting/conversion, and `for_display` ordering/availability behavior.
  - `bundle exec rspec spec/models/acai_crust_option_spec.rb spec/models/acai_placard_option_spec.rb` => `14 examples, 0 failures`
  - `bundle exec rspec` => `80 examples, 0 failures, 13 pending` (pending count reduced by 2)
- 2026-02-10: Additional model coverage pass (batch 4 - larger batch):
  - Replaced placeholder specs in `spec/models/acai_blocked_slot_spec.rb`, `spec/models/collection_spec.rb`, `spec/models/participant_spec.rb`, `spec/models/order_item_spec.rb`, and `spec/models/product_collection_spec.rb`.
  - Added behavior coverage for blocked-slot time checks, collection slug/scopes, participant code/stats helpers, order-item callbacks, and product-collection uniqueness constraints.
  - Hardened related factories to valid defaults for current model rules:
    - `spec/factories/acai_blocked_slots.rb`
    - `spec/factories/collections.rb`
    - `spec/factories/fundraisers.rb`
    - `spec/factories/participants.rb`
    - `spec/factories/products.rb`
    - `spec/factories/product_variants.rb`
    - `spec/factories/product_collections.rb`
    - `spec/factories/order_items.rb`
  - `bundle exec rspec spec/models/acai_blocked_slot_spec.rb spec/models/collection_spec.rb spec/models/participant_spec.rb spec/models/order_item_spec.rb spec/models/product_collection_spec.rb` => `25 examples, 0 failures`
  - `bundle exec rspec` => `100 examples, 0 failures, 8 pending` (pending count reduced by 5)
- 2026-02-10: Final pending-spec completion pass:
  - Replaced remaining placeholder specs:
    - `spec/jobs/send_admin_notification_email_job_spec.rb`
    - `spec/jobs/send_order_confirmation_email_job_spec.rb`
    - `spec/models/fundraiser_spec.rb`
    - `spec/models/import_spec.rb`
    - `spec/models/page_spec.rb`
    - `spec/models/product_image_spec.rb`
    - `spec/models/product_spec.rb`
    - `spec/models/product_variant_spec.rb`
  - Added supporting factory quality improvements for realistic/valid defaults:
    - `spec/factories/imports.rb`
    - `spec/factories/pages.rb`
    - `spec/factories/product_images.rb`
  - Targeted run:
    - `bundle exec rspec spec/jobs/send_admin_notification_email_job_spec.rb spec/jobs/send_order_confirmation_email_job_spec.rb spec/models/fundraiser_spec.rb spec/models/import_spec.rb spec/models/page_spec.rb spec/models/product_image_spec.rb spec/models/product_spec.rb spec/models/product_variant_spec.rb` => `44 examples, 0 failures`
  - Full run:
    - `bundle exec rspec` => `136 examples, 0 failures`
  - Result: pending spec count reduced to `0` for current API suite.
- 2026-02-10: Final cleanup pass:
  - Normalized remaining placeholder factory values in:
    - `spec/factories/acai_settings.rb`
    - `spec/factories/acai_crust_options.rb`
    - `spec/factories/acai_placard_options.rb`
  - Verified no remaining placeholder literals (`MyString`/`MyText`) in `spec/factories`.
  - Re-ran full suite:
    - `bundle exec rspec` => `136 examples, 0 failures`
- 2026-02-10: Final release-readiness checklist pass:
  - Backend verification: `bundle exec rspec` => `136 examples, 0 failures`.
  - Frontend verification: `npm run build` succeeds.
  - CI verification: backend CI workflow includes RSpec + RuboCop + Brakeman + bundler-audit (`api/.github/workflows/ci.yml`).
  - Ops/config review:
    - Production queue adapter is durable by default (`ACTIVE_JOB_QUEUE_ADAPTER` default `solid_queue`).
    - Stripe webhook verification is enforced in production path; unsigned events rejected when secret is missing.
    - CORS is environment-driven and must include deployed frontend origin(s) via `ALLOWED_ORIGINS`.
  - Residual release risk notes:
    - Browser-based authenticated admin flow verification remains environment-dependent (local `5181 -> 3002` CORS/auth context differs from production-like setup).
    - Frontend build reports large JS chunk warning (non-blocking, performance follow-up item).

