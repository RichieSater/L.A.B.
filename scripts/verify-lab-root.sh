#!/bin/bash
set -euo pipefail

EXPECTED_ROOT="/Users/richiesater/dev/L.A.B/L.A.B."
EXPECTED_PROJECT_NAME="lab"
EXPECTED_PROJECT_ID="prj_r91dfgoKVHRCst7u85IqmDHUL7wd"
CANONICAL_PRODUCTION_ALIAS="lab-three-alpha.vercel.app"
CANONICAL_PRODUCTION_URL="https://lab-three-alpha.vercel.app/"
PARENT_LINK_PATH="/Users/richiesater/dev/L.A.B/.vercel/project.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

fail() {
  echo -e "${RED}$1${NC}" >&2
  exit 1
}

if [ "$(pwd)" != "$EXPECTED_ROOT" ]; then
  fail "Run this command from $EXPECTED_ROOT."
fi

GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ "$GIT_ROOT" != "$EXPECTED_ROOT" ]; then
  fail "Git root mismatch. Expected $EXPECTED_ROOT but found ${GIT_ROOT:-<none>}."
fi

if [ ! -f ".vercel/project.json" ]; then
  fail "Missing .vercel/project.json in LAB repo root."
fi

PROJECT_NAME="$(node --input-type=module -e "import fs from 'node:fs'; const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8')); process.stdout.write(project.projectName ?? '');")"
PROJECT_ID="$(node --input-type=module -e "import fs from 'node:fs'; const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8')); process.stdout.write(project.projectId ?? '');")"

if [ "$PROJECT_NAME" != "$EXPECTED_PROJECT_NAME" ]; then
  fail "Vercel project mismatch. Expected $EXPECTED_PROJECT_NAME but found ${PROJECT_NAME:-<none>}."
fi

if [ "$PROJECT_ID" != "$EXPECTED_PROJECT_ID" ]; then
  fail "Vercel project id mismatch. Expected $EXPECTED_PROJECT_ID but found ${PROJECT_ID:-<none>}."
fi

if [ -f "$PARENT_LINK_PATH" ]; then
  fail "Duplicate parent Vercel link detected at $PARENT_LINK_PATH. LAB must be linked only from $EXPECTED_ROOT."
fi

echo -e "${BLUE}LAB root preflight${NC}"
echo -e "${GREEN}  OK${NC} repo root: $EXPECTED_ROOT"
echo -e "${GREEN}  OK${NC} Vercel project: $EXPECTED_PROJECT_NAME ($EXPECTED_PROJECT_ID)"
echo -e "${GREEN}  OK${NC} canonical production URL: $CANONICAL_PRODUCTION_URL"
echo -e "${GREEN}  OK${NC} non-production deploys are invalid for LAB"
