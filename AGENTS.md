@site/AGENTS.md

## Repo 結構

- `site/`：Astro 官網專案（原本在 repo 根目錄，2026-09-07 搬入）。`npm install`、`astro dev`、`./scripts/deploy.sh` 一律在 `site/` 內執行。
- `doc/`：官網規格、會議逐字稿、案例文案、競品研究、素材。**只存在本機、不進 git**——以 `.git/info/exclude` 排除，因為內含約 2 GB 的錄音錄影檔（m4a／webm／qta），超過 GitHub 單檔 100 MB 上限，且錄音涉及同事與受測者隱私。切勿執行 `git clean -x` 或 `-X`，會把它整個刪掉。
