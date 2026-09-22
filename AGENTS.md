# AGENTS.md

## Project

Wistia S3 Player — a Video.js-based video player library that mimics the Wistia player UI.
Published to npm as `wistia-s3-player`.

## Commands

| Command | What it does |
|---|---|
| `yarn build` | Production webpack build → `dist/js/wistia-s3-player.min.js` |
| `yarn serve` | Dev server (Webpack Dev Server). |
| `yarn demo` | Production build to `demo/` for static preview |
| `yarn test` | Runs `mocha` (no test files exist currently) |

No lint, typecheck, or formatter scripts are configured.

## Architecture

- **Entry point**: `src/main.js` → UMD bundle, global `WistiaS3Player`
- **Framework**: Vue 3 (Composition API) + Video.js
- **Build**: Webpack 5, Babel, Sass (auto-imports `common` from `src/style/`)
- **Build output**: `dist/js/wistia-s3-player.min.js`
- **Alias**: `@` → `src/`
- **Custom plugin**: `src/webpack/fontmin-webpack.js` — subsets fonts based on HTML/SHTML content

## Key quirks

- **Exports**: `default` = `init()` (auto-mounts all `.wistia_embed` elements). Named export `render(videoId)` mounts a specific player.
- **TypeScript**: `@babel/preset-typescript` is installed but no `.ts` files exist. `src/index.d.ts` provides type declarations.

## CI / Release

- Push to `main` triggers `.github/workflows/publish.yml`
- Auto-publishes to npm when `package.json` version differs from the latest git tag
- Uses Node 18, npm install (not yarn) in CI
- Tags releases as `v<version>`

## Package manager

Yarn (node-modules linker, scripts enabled). CI uses npm — both work for this repo.
