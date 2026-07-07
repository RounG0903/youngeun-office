#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-main}"
REMOTE="${DEPLOY_REMOTE:-origin}"
REPO="${GITHUB_REPOSITORY:-RounG0903/youngeun-office}"
WAIT_SECONDS="${DEPLOY_WAIT_SECONDS:-300}"
POLL_INTERVAL="${DEPLOY_POLL_INTERVAL:-15}"

echo "==> Building before deploy"
npm run build

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "==> Switching to $BRANCH"
  git checkout "$BRANCH"
  git pull "$REMOTE" "$BRANCH"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: uncommitted changes remain. Commit before deploying." >&2
  exit 1
fi

echo "==> Pushing to $REMOTE/$BRANCH"
git push "$REMOTE" "$BRANCH"

if ! command -v gh >/dev/null 2>&1; then
  echo "==> Push complete. Install GitHub CLI to wait for Railway deployment status."
  exit 0
fi

echo "==> Waiting for Railway deployment"
START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DEADLINE=$((SECONDS + WAIT_SECONDS))

while [ "$SECONDS" -lt "$DEADLINE" ]; do
  DEPLOY_ID="$(gh api "repos/$REPO/deployments" \
    --jq "[.[] | select(.description==\"Deployed to Railway\" and .created_at >= \"$START_TS\")][0].id" 2>/dev/null || true)"

  if [ -n "$DEPLOY_ID" ] && [ "$DEPLOY_ID" != "null" ]; then
    STATE="$(gh api "repos/$REPO/deployments/$DEPLOY_ID/statuses" --jq '.[0].state' 2>/dev/null || true)"
    case "$STATE" in
      success)
        echo "==> Railway deployment succeeded (deployment #$DEPLOY_ID)"
        exit 0
        ;;
      failure|error)
        echo "Error: Railway deployment failed (deployment #$DEPLOY_ID)" >&2
        exit 1
        ;;
      *)
        echo "   ... deployment in progress ($STATE)"
        ;;
    esac
  else
    echo "   ... waiting for deployment to start"
  fi

  sleep "$POLL_INTERVAL"
done

echo "Warning: timed out waiting for Railway deployment confirmation." >&2
exit 0
