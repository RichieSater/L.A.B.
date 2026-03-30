#!/bin/bash
set -e

# L.A.B. Deploy Script
# Runs checks, commits, pushes to GitHub, and triggers Vercel deploy.
# Usage: ./deploy.sh [commit message]

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== L.A.B. Deploy ===${NC}"
echo ""

# 1. Type check
echo -e "${BLUE}[1/5]${NC} Type checking..."
if ! npx tsc -b --noEmit 2>/dev/null; then
  echo -e "${RED}TypeScript errors found. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Types OK${NC}"

# 2. Run tests
echo -e "${BLUE}[2/5]${NC} Running tests..."
if ! npm run test 2>/dev/null; then
  echo -e "${RED}Tests failed. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Tests OK${NC}"

# 3. Build
echo -e "${BLUE}[3/5]${NC} Building and checking bundle budgets..."
if ! npm run build > /dev/null 2>&1; then
  echo -e "${RED}Build or bundle budget check failed. Fix before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}  Build and bundle budgets OK${NC}"

# 4. Git commit & push
echo -e "${BLUE}[4/5]${NC} Checking git status..."
if git diff --quiet && git diff --cached --quiet; then
  echo -e "${YELLOW}  No changes to commit. Pushing any unpushed commits...${NC}"
else
  MSG="${1:-Deploy $(date +%Y-%m-%d_%H:%M)}"
  git add -A
  git commit -m "$MSG"
  echo -e "${GREEN}  Committed: $MSG${NC}"
fi

echo -e "${BLUE}[5/5]${NC} Pushing to GitHub..."
git push origin main
echo -e "${GREEN}  Pushed to origin/main${NC}"

echo ""
echo -e "${GREEN}=== Deploy complete ===${NC}"
echo -e "If Vercel auto-deploy is connected, your site will update in ~1-2 minutes."
echo -e "If not, run: ${YELLOW}npx vercel --prod${YELLOW}${NC} (install Vercel CLI first: npm i -g vercel)"
echo ""
echo -e "${BLUE}Checklist:${NC}"
echo "  - Run database migrations when schema files change (for example: npm run db:migrate)"
echo "  - Use production Clerk keys in Vercel before production deploys"
echo "  - Existing user data is preserved where migrations provide defaults/backfills"
echo "  - Verify at your Vercel dashboard or production URL"
