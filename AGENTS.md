## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Deploy（GitHub Pages）

網站以「gh-pages branch 放靜態成品」的方式部署，可同時掛多個版本供比較：

- 主版本（main）→ 網站根：`./scripts/deploy.sh`
  → https://jameschouuxreach.github.io/reach-website-v1/
- 比較版本（reach-web-v2）→ 子資料夾：`./scripts/deploy.sh v2`
  → https://jameschouuxreach.github.io/reach-website-v1/v2/

腳本會自動 build、用 `scripts/prefix-base.mjs` 補上 Pages 子路徑前綴、把成品同步進 gh-pages 對應位置後 push。原始碼一律維持根路徑寫法（`/images/...`），不要把前綴寫進原始碼。要再多掛一個版本時，把子資料夾名加進 `scripts/deploy.sh` 的 `KEEP_DIRS`，部署時傳入該名稱即可。

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
