# AGENTS.md

## Repo reality check (don’t guess)
- This is a **single Cloudflare Worker** project (not a monorepo).
- Runtime entrypoint is `src/index.ts` (also configured as `main` in `wrangler.toml`).
- Worker stack: **Hono + KV**.

## Commands that actually exist
- Local dev: `npm run dev` (same as `npm run start`, both call `wrangler dev`).
- Deploy: `npm run deploy`.
- Tests: `npm test`.
- Regenerate Worker env types after binding changes: `npm run cf-typegen`.
- There is **no** `lint` or `typecheck` script in `package.json`.

## Architecture and flow (high-signal only)
- `GET /` returns an inline HTML form (all markup/CSS/JS is embedded in `src/index.ts`).
- `POST /` validates a submitted URL, generates a random slug, checks KV collisions, stores `slug -> long URL`, and returns `${HOST_URL}/${slug}`.
- `GET /:slug` reads from `SHORTENER_KV` and redirects only if protocol is `http:` or `https:`.

## Cloudflare bindings and env
- Required KV binding: `SHORTENER_KV` (declared in `wrangler.toml`).
- Required var: `HOST_URL` in `[vars]` (used to build returned short URLs).
- `.dev.vars` is gitignored; if you add secrets/local vars, keep them there.

## Testing + CI gotchas you will miss if you rush
- Current test file (`test/index.spec.ts`) is still scaffold-style (“Hello World”) and does not match current app behavior.
- `npm test -- --run` currently fails in this repo with a `@cloudflare/vitest-pool-workers`/`vitest` compatibility issue (`vitest@1.6.1` vs officially supported `1.3.x - 1.5.x`, plus `readFileSync() is not yet implemented in Workers`).
- CI workflows under `.github/workflows/` are mostly template defaults (CodeQL + Snyk container); Snyk workflow expects a Dockerfile (`docker build ...`) but no Dockerfile exists in repo.

## Style/conventions verified from config
- Formatting style is tab-indented (`.editorconfig`, `.prettierrc`) with single quotes and semicolons.
- Keep edits small and focused in `src/index.ts`; this repo is intentionally minimal.
