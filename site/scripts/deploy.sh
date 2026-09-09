#!/usr/bin/env bash
# 部署目前 branch 的 build 成品到 GitHub Pages（gh-pages branch）。
# 網站根是「版本入口頁」（正本在 scripts/entry/，只在部署 main 時同步到根），
# 各版本一律部署在子資料夾。checkout 好 branch 直接跑 ./scripts/deploy.sh 即可：
#   main           → /v1/   https://jameschouuxreach.github.io/reach-website/v1/
#   reach-web-v2   → /v2/   https://jameschouuxreach.github.io/reach-website/v2/
#   reach-web-v2-1 → /v2-1/ https://jameschouuxreach.github.io/reach-website/v2-1/
#   reach-web-v2-2 → /v2-2/ https://jameschouuxreach.github.io/reach-website/v2-2/
#
# 新增一個要並存的版本：在下方對應表加一行 branch↔子資料夾，
# 並在 scripts/entry/index.html 的版本清單加一張卡（在 main 上改、部署 main 生效）。
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_BASE="/reach-website"
SUBDIR_ARG="${1:-}"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHA=$(git rev-parse --short HEAD)

# branch ↔ 部署位置對應表
case "$BRANCH" in
  main)           SUBDIR="v1" ;;
  reach-web-v2)   SUBDIR="v2" ;;
  reach-web-v2-1) SUBDIR="v2-1" ;;
  reach-web-v2-2) SUBDIR="v2-2" ;;
  *)
    echo "錯誤：branch「${BRANCH}」沒有對應的部署位置。" >&2
    echo "請 checkout 到 main、reach-web-v2、reach-web-v2-1 或 reach-web-v2-2 再部署，或先在 scripts/deploy.sh 的對應表加上這個 branch。" >&2
    exit 1 ;;
esac

# 有指定參數時必須與對應表一致，避免把某版誤蓋到別版的位置
if [[ -n "$SUBDIR_ARG" && "$SUBDIR_ARG" != "$SUBDIR" ]]; then
  echo "錯誤：branch「${BRANCH}」的部署位置是「/${SUBDIR}/」，與指定的「${SUBDIR_ARG}」不符，已中止。" >&2
  exit 1
fi

echo "部署 ${BRANCH}（${SHA}）→ https://jameschouuxreach.github.io${REPO_BASE}/${SUBDIR}/"

npm run build
node scripts/prefix-base.mjs "${REPO_BASE}/${SUBDIR}" dist

# 在暫存 worktree 裡操作 gh-pages，不動到目前的工作目錄
WORKTREE="$(mktemp -d)/gh-pages"
git fetch origin gh-pages
git worktree add --quiet -B gh-pages "$WORKTREE" origin/gh-pages
trap 'git worktree remove --force "$WORKTREE" 2>/dev/null || true' EXIT

# 外接碟（exFAT）會產生 ._* AppleDouble 檔，一律排除、並清掉先前殘留的
RSYNC_OPTS=(-a --delete --exclude '.git' --exclude '._*' --exclude '.DS_Store')
mkdir -p "$WORKTREE/$SUBDIR"
rsync "${RSYNC_OPTS[@]}" dist/ "$WORKTREE/$SUBDIR"/

# 網站根的入口頁與 404（GitHub Pages 只認根目錄的 404.html）由 main 維護
if [[ "$BRANCH" == "main" ]]; then
  cp scripts/entry/index.html "$WORKTREE/index.html"
  cp scripts/entry/404.html "$WORKTREE/404.html"
fi

touch "$WORKTREE/.nojekyll"
find "$WORKTREE" -name '._*' -delete
find "$WORKTREE" -name '.DS_Store' -delete

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "gh-pages 沒有變更，跳過部署。"
else
  git commit -m "Deploy ${BRANCH} (${SHA}) to /${SUBDIR}"
  git push origin gh-pages
  echo "已部署：https://jameschouuxreach.github.io${REPO_BASE}/${SUBDIR}/"
fi
