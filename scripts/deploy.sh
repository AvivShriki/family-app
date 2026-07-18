#!/bin/bash
# Deploy family-app to GitHub Pages (gh-pages branch).
# Encapsulates the whole manual ritual with safety gates, so no step can be
# forgotten. Run from anywhere: scripts/deploy.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

echo "== Safety gates =="

# Gate 1: DEMO_MODE must be off — shipping demo mode broke login once already
if ! grep -q "export const DEMO_MODE = false" src/hooks/useCollection.ts; then
  echo "BLOCKED: DEMO_MODE is not false in src/hooks/useCollection.ts" >&2
  exit 1
fi
echo "ok: DEMO_MODE is off"

# Gate 2: unit tests must pass
npm test >/dev/null 2>&1 || { echo "BLOCKED: unit tests failed (run: npm test)" >&2; exit 1; }
echo "ok: unit tests pass"

# Gate 3: clean type-check
npx tsc --noEmit || { echo "BLOCKED: type errors" >&2; exit 1; }
echo "ok: types clean"

echo "== Build =="
rm -rf dist
npx expo export -p web

echo "== Path fixes for the /family-app subdirectory =="
sed -i '' 's|href="/favicon.ico"|href="favicon.ico"|; s|src="/_expo|src="_expo|' dist/index.html
sed -i '' 's|"/assets/|"assets/|g' dist/_expo/static/js/web/*.js
# Guard against horizontal rubber-band scroll on mobile Safari
sed -i '' '/overflow: hidden;/a\
        overscroll-behavior-x: none;
' dist/index.html

# Verify the fixes actually landed
grep -q 'src="_expo' dist/index.html || { echo "BLOCKED: index.html script path not fixed" >&2; exit 1; }
[ "$(grep -c '"/assets/' dist/_expo/static/js/web/*.js || true)" = "0" ] || { echo "BLOCKED: bundle still has absolute /assets/ paths" >&2; exit 1; }
grep -q "overscroll-behavior-x" dist/index.html || { echo "BLOCKED: overscroll CSS missing" >&2; exit 1; }
echo "ok: paths fixed"

echo "== Deploy to gh-pages =="
GHP="$(mktemp -d)/ghp"
git fetch origin gh-pages
git worktree add "$GHP" gh-pages
trap 'git worktree remove --force "$GHP" 2>/dev/null || true' EXIT
cd "$GHP"
git reset --hard origin/gh-pages -q
git rm -rq . 2>/dev/null || true
cp -R "$REPO/dist/." "$GHP/"
touch .nojekyll   # Gate 4: without it Pages ignores the _expo directory — broke the site once
git add -A
MSG="${1:-deploy: $(git -C "$REPO" log -1 --pretty=%s master)}"
git commit -qm "$MSG"
git push origin gh-pages
cd "$REPO"
git worktree remove "$GHP"
trap - EXIT

BUNDLE="$(basename dist/_expo/static/js/web/index-*.js)"
echo "== Done. Deployed bundle: $BUNDLE =="
echo "Verify: https://avivshriki.github.io/family-app/"
