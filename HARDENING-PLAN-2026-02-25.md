# Hafaloha V2 Hardening Plan

Date: 2026-02-25  
Scope: `hafaloha/` (V2 monorepo)  
Source: Architecture/code review of V2 + comparison against legacy V1 (`_archive/old-system`) patterns

## Goals

1. Eliminate paid-but-inconsistent checkout outcomes.
2. Prevent oversell/stock drift under concurrency.
3. Make order numbering deterministic and collision-safe.
4. Tighten production security/config defaults.
5. Add enforceable tests for critical business invariants.

## Non-Goals

- Re-introducing V1 multi-tenant design (`restaurant_id`, tenant scoping, etc.).
- Carrying forward deprecated dual variant systems from V1.
- Broad refactors unrelated to checkout/inventory correctness.

## Priority Summary

### P0 (Do first - release blocking)

1. **Atomic checkout flow**
   - Wrap order persistence + inventory deduction + cart clear in a DB transaction.
   - Ensure failure in any step rolls back state consistently.
   - Add payment reconciliation path for "payment succeeded but order failed" scenarios.

2. **Concurrency-safe stock commit at finalization**
   - Keep pre-check validation for UX, but re-check availability inside locked commit path.
   - Lock inventory rows (`with_lock`) before decrement + audit write.
   - Return a clear 422 when stock is no longer available at final commit.

3. **Order number collision safety**
   - Replace read-last-then-increment race-prone approach with a collision-safe strategy.
   - Required: preserve business prefix by order type (`HAF-R`, `HAF-A`, `HAF-W`).
   - Resolve/clarify final canonical format (project docs currently mention 6-digit suffix style).

### P1 (Do next)

4. **Remove hardcoded privileged defaults**
   - Remove default admin emails in code for production paths.
   - Require env-provided admin list in production.

5. **Production config guardrails**
   - Fail fast at boot in production when required CORS/env config is missing.
   - Add startup validation for critical env values.

6. **API response contract consistency**
   - Standardize success/error envelope where practical for new/updated endpoints.
   - Document any intentional endpoint-specific variations.

### P2 (Quality and maintainability)

7. **Strengthen test suite for invariants**
   - Add backend request/model specs for:
     - concurrent checkout against limited stock,
     - transaction rollback behavior,
     - order number uniqueness under concurrency.
   - Keep E2E tests, but move race-condition assertions from "documentation style" to strict pass/fail checks.

8. **Document migration-safe patterns from V1**
   - Preserve: lock-based inventory updates, cancel/refund stock restoration, immutable order item snapshots, inventory audit trails.
   - Avoid: tenant-only assumptions and duplicated numbering strategies.

---

## Execution Plan

## Phase 1 - Checkout Correctness (P0)

### Work Items

- [ ] Refactor checkout create flow in `api/app/controllers/api/v1/orders_controller.rb`.
- [ ] Introduce a clear service boundary for "finalize order" if controller logic remains too large.
- [ ] Ensure `order.save`, inventory deduction, audit creation, and cart clear are transactionally bound.
- [ ] Add explicit handling for payment-verified-but-order-failed outcomes (log + reconciliation action).

### Acceptance Criteria

- [ ] A forced exception after payment verification does not leave partial persisted order/inventory state.
- [ ] Inventory cannot be decremented without successful order persistence.
- [ ] Cart clear only happens on fully successful order finalize.
- [ ] Error response to client is deterministic and actionable.

### Verification

- [ ] Add backend automated tests for rollback on mid-flow failure.
- [ ] Add at least one simulated concurrent checkout test (single unit in stock, two buyers).

---

## Phase 2 - Inventory Concurrency & Numbering (P0)

### Work Items

- [ ] Re-validate stock inside locked commit path (not only pre-payment validation).
- [ ] Keep and verify `InventoryAudit` creation in the same atomic commit scope.
- [ ] Implement order number generation strategy that is safe under parallel requests.
- [ ] Align order number format with business rule and docs in one canonical source.

### Acceptance Criteria

- [ ] Under parallel purchase attempts for stock=1, max one order succeeds.
- [ ] No negative stock quantities are possible.
- [ ] No duplicate order numbers are generated under concurrent creation.
- [ ] Order number format matches agreed rule for each order type.

### Verification

- [ ] Backend concurrency spec with thread/process simulation.
- [ ] Re-run relevant E2E order flows (retail, acai, fundraiser).

---

## Phase 3 - Security & Config Hardening (P1)

### Work Items

- [ ] Update `api/app/controllers/concerns/authenticatable.rb` to remove hardcoded production admin defaults.
- [ ] Add production startup validation for required env vars (including CORS origins).
- [ ] Confirm admin role assignment behavior is intentional and documented.

### Acceptance Criteria

- [ ] Production boot fails with clear error when required env values are missing.
- [ ] No privileged email defaults exist in production code path.
- [ ] Existing admin auth behavior remains functional for configured users.

### Verification

- [ ] Add/request specs for auth expectations.
- [ ] Smoke-test admin endpoints with manager/admin/staff role boundaries.

---

## Phase 4 - Contract & Test Hardening (P1/P2)

### Work Items

- [ ] Standardize response envelope strategy across high-traffic endpoints.
- [ ] Add backend request specs for order create edge cases and 422 payload shape.
- [ ] Upgrade E2E race-condition tests to real assertions (not only logs/screenshots).

### Acceptance Criteria

- [ ] Frontend can rely on stable success/error fields for checkout-critical APIs.
- [ ] CI fails on regressions for stock, checkout atomicity, or numbering uniqueness.

### Verification

- [ ] Run backend spec files added/modified.
- [ ] Run targeted Playwright flows:
  - `e2e/comprehensive/retail-order-flow.spec.ts`
  - `e2e/comprehensive/acai-order-flow.spec.ts`
  - `e2e/comprehensive/fundraiser-flow.spec.ts`
  - `e2e/comprehensive/race-conditions.spec.ts`

---

## Work Breakdown by File Area

### Backend (Rails API)

- `api/app/controllers/api/v1/orders_controller.rb`  
  Main checkout transaction/refactor, stock commit sequencing, error handling.

- `api/app/models/order.rb`  
  Order number generation hardening; maintain cancellation restore behavior.

- `api/app/controllers/concerns/authenticatable.rb`  
  Admin email/env hardening.

- `api/config/initializers/cors.rb`  
  Production fail-fast validation on origins.

- `api/spec/requests/*` and `api/spec/models/*`  
  New invariants tests for checkout atomicity/concurrency/numbering.

### Frontend (React)

- `web/e2e/comprehensive/race-conditions.spec.ts`  
  Convert narrative checks into strict assertions.

- `web/e2e/comprehensive/inventory-stock.spec.ts`  
  Add stronger deterministic checks for stock-related outcomes.

---

## Legacy-to-V2 Guidance (What to Keep vs Avoid)

### Keep

- Lock-based inventory updates (`with_lock`).
- Inventory restoration on cancellation/refund.
- Inventory audit trail on all stock-affecting events.
- Immutable order item snapshots for historical accuracy.

### Avoid

- Tenant-scoped architecture from V1.
- Multiple overlapping numbering systems.
- Parallel legacy/new variant systems in the same flow.

---

## Delivery Sequence

1. Phase 1 + Phase 2 in one hardening PR (P0 blockers).
2. Phase 3 in follow-up security/config PR.
3. Phase 4 in test-contract stabilization PR.

If needed, split Phase 1 and 2 into separate PRs only if checkout refactor gets too large.

---

## Definition of Done

- [ ] No known path where payment can succeed while order finalize fails silently.
- [ ] Concurrency tests prove no oversell and no duplicate order numbers.
- [ ] Production env validation prevents invalid deploy config.
- [ ] Admin privilege defaults are not hardcoded for production.
- [ ] Critical E2E + backend tests pass and are reproducible.
