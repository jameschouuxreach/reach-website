#!/usr/bin/env bash
# 部署目前 branch 的 build 成品到 GitHub Pages（gh-pages branch）。
#
# 用法：
#   ./scripts/deploy.sh        部署到網站根  → https://jameschouuxreach.github.io/reach-website-v1/
#   ./scripts/deploy.sh v2     部署到子資料夾 → https://jameschouuxreach.github.io/reach-website-v1/v2/
#
# 根部署會保留 KEEP_DIRS 列出的子資料夾（其他版本的部署不會被蓋掉）；
# 新增一個要並存的版本時，把它的子資料夾名加進 KEEP_DIRS 即可。
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_BASE="/reach-website-v1"
KEEP_DIRS=(v2)
SUBDIR="${1:-}"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHA=$(git rev-parse --short HEAD)

npm run build
node scripts/prefix-base.mjs "${REPO_BASE}${SUBDIR:+/${SUBDIR}}" dist

# 在暫存 worktree 裡操作 gh-pages，不動到目前的工作目錄
WORKTREE="$(mktemp -d)/gh-pages"
git fetch origin gh-pages
git worktree add --quiet -B gh-pages "$WORKTREE" origin/gh-pages
trap 'git worktree remove --force "$WORKTREE" 2>/dev/null || true' EXIT

# 外接碟（exFAT）會產生 ._* AppleDouble 檔，一律排除、並清掉先前殘留的
RSYNC_OPTS=(-a --delete --exclude '.git' --exclude '._*' --exclude '.DS_Store')
if [[ -z "$SUBDIR" ]]; then
  for d in "${KEEP_DIRS[@]}"; do RSYNC_OPTS+=(--exclude "/$d/"); done
  rsync "${RSYNC_OPTS[@]}" dist/ "$WORKTREE"/
else
  mkdir -p "$WORKTREE/$SUBDIR"
  rsync "${RSYNC_OPTS[@]}" dist/ "$WORKTREE/$SUBDIR"/
fi
touch "$WORKTREE/.nojekyll"
find "$WORKTREE" -name '._*' -delete
find "$WORKTREE" -name '.DS_Store' -delete

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "gh-pages 沒有變更，跳過部署。"
else
  git commit -m "Deploy ${BRANCH} (${SHA})${SUBDIR:+ to /${SUBDIR}}"
  git push origin gh-pages
  echo "已部署：https://jameschouuxreach.github.io/reach-website-v1${SUBDIR:+/${SUBDIR}}/"
fi
