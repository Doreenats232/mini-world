#!/usr/bin/env bash
# One command: test -> build -> commit -> push -> wait until the website is live.
# Usage:  GH_TOKEN=<token> npm run deploy -- "what changed"
set -e
cd "$(dirname "$0")/.."
MSG="${1:-update}"; REPO="Doreenats232/mini-world"
[ -z "$GH_TOKEN" ] && { echo "Set GH_TOKEN first (fine-grained token, this repo only)"; exit 1; }
npm test --silent || { echo "TESTS FAILED, not deploying"; exit 1; }
npx vite build > /tmp/build.log 2>&1 || { tail -5 /tmp/build.log; echo "BUILD FAILED"; exit 1; }
git add -A; git commit -q -m "$MSG" || echo "(nothing new to commit)"
AUTH=$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 -w0)
git -c http.extraheader="Authorization: Basic $AUTH" push -q "https://github.com/$REPO.git" HEAD:main
SHA=$(git rev-parse HEAD); H="Authorization: Bearer $GH_TOKEN"
for i in $(seq 1 24); do
  sleep 10
  R=$(curl -s -H "$H" "https://api.github.com/repos/$REPO/actions/runs?head_sha=$SHA" | python3 -c "import sys,json; d=json.load(sys.stdin).get('workflow_runs',[]); print(d[0]['id'] if d else '')")
  [ -z "$R" ] && continue
  S=$(curl -s -H "$H" "https://api.github.com/repos/$REPO/actions/runs/$R/jobs" | python3 -c "import sys,json; j=[x for x in json.load(sys.stdin)['jobs'] if x['name']=='pages']; print((j[0]['conclusion'] or j[0]['status']) if j else 'waiting')")
  [ "$S" = "success" ] && { echo "LIVE: https://doreenats232.github.io/mini-world/"; exit 0; }
  [ "$S" = "failure" ] && { echo "DEPLOY FAILED: https://github.com/$REPO/actions/runs/$R"; exit 1; }
done
echo "Still deploying, check https://github.com/$REPO/actions"
