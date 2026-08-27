#!/usr/bin/env bash
# 部署目前 branch 的 build 成品到 GitHub Pages（gh-pages branch）。
# 部署位置由目前 branch 自動決定，checkout 好 branch 直接跑 ./scripts/deploy.sh 即可：
#   main         → 網站根       https://jameschouuxreach.github.io/reach-website-v1/
#   reach-web-v2 → /v2/ 子資料夾 https://jameschouuxreach.github.io/reach-website-v1/v2/
#
# 新增一個要並存的版本：在下方對應表加一行 branch↔子資料夾，
# 並把子資料夾名加進 KEEP_DIRS（根部署時不會被蓋掉的資料夾）。
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_BASE="/reach-website-v1"
KEEP_DIRS=(v2 v2-1)
SUBDIR_ARG="${1:-}"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHA=$(git rev-parse --short HEAD)

# branch ↔ 部署位置對應表
case "$BRANCH" in
  main)           SUBDIR="" ;;
  reach-web-v2)   SUBDIR="v2" ;;
  reach-web-v2-1) SUBDIR="v2-1" ;;
  *)
    echo "錯誤：branch「${BRANCH}」沒有對應的部署位置。" >&2
    echo "請 checkout 到 main 或 reach-web-v2 再部署，或先在 scripts/deploy.sh 的對應表加上這個 branch。" >&2
    exit 1 ;;
esac

# 有指定參數時必須與對應表一致，避免把某版誤蓋到別版的位置
if [[ -n "$SUBDIR_ARG" && "$SUBDIR_ARG" != "$SUBDIR" ]]; then
  echo "錯誤：branch「${BRANCH}」的部署位置是「${SUBDIR:-網站根}」，與指定的「${SUBDIR_ARG}」不符，已中止。" >&2
  exit 1
fi

echo "部署 ${BRANCH}（${SHA}）→ https://jameschouuxreach.github.io/reach-website-v1${SUBDIR:+/${SUBDIR}}/"

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
