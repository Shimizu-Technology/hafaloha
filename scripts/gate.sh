#!/usr/bin/env bash
###############################################################################
# gate.sh — Quality gate for hafaloha-web
#
# Runs: TypeScript check → ESLint → Debug-statement scan → Production build
# Optional: E2E tests (requires dev server + API running)
#
# Usage:
#   ./scripts/gate.sh          # Run all checks (skip E2E)
#   ./scripts/gate.sh --e2e    # Include E2E tests
#   ./scripts/gate.sh --fix    # Auto-fix lint issues, then gate
###############################################################################
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0
RUN_E2E=false
FIX_MODE=false

for arg in "$@"; do
  case "$arg" in
    --e2e)   RUN_E2E=true ;;
    --fix)   FIX_MODE=true ;;
  esac
done

step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

pass() { echo -e "  ${GREEN}✔ $1${NC}"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✘ $1${NC}"; FAIL=$((FAIL + 1)); }
warn() { echo -e "  ${YELLOW}⚠ $1${NC}"; WARN=$((WARN + 1)); }

# ── 1. TypeScript ───────────────────────────────────────────────────────────
step "1/5  TypeScript check (tsc -b --noEmit)"
if npx tsc -b --noEmit 2>&1; then
  pass "TypeScript — no errors"
else
  fail "TypeScript — errors found (see above)"
fi

# ── 2. ESLint ───────────────────────────────────────────────────────────────
if $FIX_MODE; then
  step "2/5  ESLint (auto-fix mode)"
  if npm run lint -- --fix 2>&1; then
    pass "ESLint — fixed & clean"
  else
    fail "ESLint — errors remain after fix (see above)"
  fi
else
  step "2/5  ESLint"
  if npm run lint 2>&1; then
    pass "ESLint — clean"
  else
    fail "ESLint — errors found (see above)"
  fi
fi

# ── 3. Debug statements ────────────────────────────────────────────────────
step "3/5  Debug statement scan"
DEBUG_HITS=$(grep -rn \
  --include='*.ts' --include='*.tsx' \
  -E '(console\.(log|debug|info|warn|error)|debugger\b)' \
  src/ 2>/dev/null || true)

if [ -z "$DEBUG_HITS" ]; then
  pass "No debug statements in src/"
else
  COUNT=$(echo "$DEBUG_HITS" | wc -l | tr -d ' ')
  warn "Found $COUNT debug statement(s) in src/:"
  echo "$DEBUG_HITS" | head -20
  if [ "$COUNT" -gt 20 ]; then
    echo "  ... and $(( COUNT - 20 )) more"
  fi
fi

# ── 4. Production build ────────────────────────────────────────────────────
step "4/5  Production build (vite build)"
if npm run build 2>&1; then
  # Show bundle size
  if [ -d dist ]; then
    SIZE=$(du -sh dist | cut -f1)
    pass "Production build — success ($SIZE)"
  else
    pass "Production build — success"
  fi
else
  fail "Production build — failed (see above)"
fi

# ── 5. E2E tests (optional) ────────────────────────────────────────────────
if $RUN_E2E; then
  step "5/5  E2E tests (Playwright)"
  if npx playwright test --project=public 2>&1; then
    pass "E2E tests — passed"
  else
    fail "E2E tests — failures (see above)"
  fi
else
  step "5/5  E2E tests — SKIPPED (use --e2e to include)"
  warn "E2E tests skipped (requires dev server + API on localhost:3000)"
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  GATE SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}  ${YELLOW}Warnings: $WARN${NC}  ${RED}Failed: $FAIL${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}❌ GATE FAILED${NC}"
  exit 1
else
  echo ""
  echo -e "  ${GREEN}✅ GATE PASSED${NC}"
  exit 0
fi
