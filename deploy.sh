#!/bin/bash
set -euo pipefail

# L.A.B. Deploy Script
# Verifies the canonical LAB repo root, runs release checks, and pushes main.
# Usage: ./deploy.sh

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXPECTED_ROOT="/Users/richiesater/dev/L.A.B/L.A.B."
CANONICAL_PRODUCTION_ALIAS="lab-three-alpha.vercel.app"
CANONICAL_PRODUCTION_URL="https://lab-three-alpha.vercel.app/"
EXPECTED_BRANCH="main"

block_production_only() {
  echo -e "${RED}Production-only deploy blocked:${NC} $1" >&2
  echo -e "${YELLOW}LAB does not allow preview, claim, copied-tree, temporary, or alternate Vercel deploys.${NC}" >&2
  echo -e "Deploy only to ${YELLOW}${CANONICAL_PRODUCTION_URL}${NC} from ${YELLOW}${EXPECTED_ROOT}${NC} on ${YELLOW}${EXPECTED_BRANCH}${NC} with a clean git tree." >&2
  exit 1
}

echo -e "${BLUE}=== L.A.B. Deploy ===${NC}"
echo ""

if [ "$#" -ne 0 ]; then
  block_production_only "This script takes no arguments."
fi

# 1. Repo and branch preflight
echo -e "${BLUE}[1/8]${NC} Verifying LAB repo root..."
if ! bash ./scripts/verify-lab-root.sh; then
  block_production_only "LAB repo preflight failed."
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "$EXPECTED_BRANCH" ]; then
  block_production_only "Deploys must run from branch ${EXPECTED_BRANCH}."
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  block_production_only "Deploys require a clean git tree. Commit or stash changes first."
fi

if [ "$(pwd)" != "$EXPECTED_ROOT" ]; then
  block_production_only "Deploys must run from ${EXPECTED_ROOT}."
fi
echo -e "${GREEN}  Repo root, branch, and clean-tree checks OK${NC}"

# 2. Type check
echo -e "${BLUE}[2/8]${NC} Type checking..."
if ! npx tsc -b --noEmit; then
  echo -e "${RED}TypeScript errors found. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Types OK${NC}"

# 3. Run guardrails
echo -e "${BLUE}[3/8]${NC} Running guardrail checks..."
if ! npm run test:guardrails; then
  echo -e "${RED}Guardrail checks failed. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Guardrails OK${NC}"

# 4. Run tests
echo -e "${BLUE}[4/8]${NC} Running tests..."
if ! npm run test; then
  echo -e "${RED}Tests failed. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Tests OK${NC}"

# 5. Build
echo -e "${BLUE}[5/8]${NC} Building and checking bundle budgets..."
if ! npm run build; then
  echo -e "${RED}Build or bundle budget check failed. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Build and bundle budgets OK${NC}"

# 6. Apply database migrations
echo -e "${BLUE}[6/8]${NC} Applying database migrations..."
if ! npm run db:migrate; then
  echo -e "${RED}Database migrations failed. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Database migrations OK${NC}"

# 7. Push main
echo -e "${BLUE}[7/8]${NC} Pushing to GitHub..."
git push origin main
echo -e "${GREEN}  Pushed to origin/main${NC}"

# 8. Post-push verification guidance
echo -e "${BLUE}[8/8]${NC} Canonical production target"
echo -e "${GREEN}  ${CANONICAL_PRODUCTION_URL}${NC}"

echo ""
echo -e "${GREEN}=== Deploy complete ===${NC}"
echo -e "Success means the git-driven LAB production deployment belongs at ${YELLOW}${CANONICAL_PRODUCTION_URL}${NC} and nowhere else."
echo -e "Verify the git-driven production deployment with:"
echo -e "  ${YELLOW}npx vercel inspect ${CANONICAL_PRODUCTION_ALIAS}${NC}"
echo -e "  ${YELLOW}npx vercel curl /api/bootstrap --deployment ${CANONICAL_PRODUCTION_ALIAS}${NC}"
echo -e "  ${YELLOW}npx vercel logs --environment production --since 10m --no-branch --no-follow --expand${NC}"
echo ""
echo -e "${BLUE}Checklist:${NC}"
echo "  - Deploy only from ${EXPECTED_ROOT}"
echo "  - Keep the git tree clean before running this script"
echo "  - Use git-linked LAB deploys only; do not deploy from temp copies, previews, claim URLs, or legacy repos"
echo "  - Treat ${CANONICAL_PRODUCTION_URL} as the only production entrypoint"
