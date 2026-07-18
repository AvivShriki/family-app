#!/usr/bin/env bash
# פריסת גרסת הווב ל-GitHub Pages — מחליף את התהליך הידני רב-השלבים.
# שימוש: npm run deploy:web            (בנייה + פריסה)
#        npm run deploy:web -- --build-only   (בנייה ותיקוני נתיבים בלבד, בלי push)
set -euo pipefail
cd "$(dirname "$0")/.."

# --- שערי בטיחות (רשימת הרגרסיה של מור, TESTING.md) ---------------------
# 1: מצב דמו חייב להיות כבוי — פעם שנשכח דלוק, ההתחברות נעלמה מהאתר החי
if ! grep -q "export const DEMO_MODE = false" src/hooks/useCollection.ts; then
  echo "!! עצירה: DEMO_MODE אינו false ב-src/hooks/useCollection.ts" >&2
  exit 1
fi
echo "==> שער 1: מצב דמו כבוי"

# 2: בדיקות יחידה
npm test >/dev/null 2>&1 || { echo "!! עצירה: בדיקות נכשלו (npm test)" >&2; exit 1; }
echo "==> שער 2: הבדיקות עוברות"

# 3: טיפוסים נקיים
npx tsc --noEmit || { echo "!! עצירה: שגיאות טיפוסים" >&2; exit 1; }
echo "==> שער 3: טיפוסים נקיים"

echo "==> בונה גרסת ווב (expo export)"
rm -rf dist
npx expo export -p web

# GitHub Pages מגיש את האתר מתת-נתיב /family-app — נתיבים אבסולוטיים נשברים שם.
echo "==> מתקן נתיבים אבסולוטיים ב-dist"
sed -i '' 's|href="/favicon.ico"|href="favicon.ico"|' dist/index.html
sed -i '' 's|src="/_expo|src="_expo|' dist/index.html
find dist/_expo/static/js/web -name '*.js' -exec sed -i '' 's|"/assets/|"assets/|g' {} +

# הגנה מפני גלילה אלסטית אופקית בספארי במובייל
sed -i '' '/overflow: hidden;/a\
        overscroll-behavior-x: none;
' dist/index.html
grep -q "overscroll-behavior-x" dist/index.html || { echo "!! עצירה: הזרקת ה-CSS נכשלה" >&2; exit 1; }

# שסתום בטיחות: אם נשאר נתיב אבסולוטי ב-index.html — עוצרים לפני שדוחפים אתר שבור
if grep -qE '(href|src)="/' dist/index.html; then
  echo "!! נשארו נתיבים אבסולוטיים ב-dist/index.html — עצירה" >&2
  exit 1
fi

if [[ "${1:-}" == "--build-only" ]]; then
  echo "==> מצב build-only: הבנייה תקינה, לא נדחף כלום"
  exit 0
fi

echo "==> פורס ל-gh-pages דרך worktree זמני (master לא נגוע)"
git fetch origin gh-pages
WORKTREE=$(mktemp -d)
git worktree add -B gh-pages "$WORKTREE" origin/gh-pages
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R dist/. "$WORKTREE"/
# בלי הקובץ הזה Jekyll של GitHub Pages מתעלם מתיקיות שמתחילות בקו תחתון (_expo)
touch "$WORKTREE/.nojekyll"
git -C "$WORKTREE" add -A
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "==> אין שינויים לפריסה"
else
  git -C "$WORKTREE" commit -m "deploy: עדכון אתר gh-pages"
  # הגיט המקומי ישן (2.21.1) ולעיתים נכשל בדחיפות גדולות על HTTP/2 — ניסיון שני עם עקיפה
  git -C "$WORKTREE" push origin gh-pages || \
    git -C "$WORKTREE" -c http.postBuffer=157286400 -c http.version=HTTP/1.1 push origin gh-pages
fi
git worktree remove --force "$WORKTREE"
echo "==> בוצע: http://avivshriki.github.io/family-app/"
