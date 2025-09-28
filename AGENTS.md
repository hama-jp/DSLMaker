# Repository Guidelines

## Project Structure & Module Organization
DSL Maker runs on Next.js with TypeScript. Routes, layouts, and server actions live in `src/app`, while UI widgets are grouped in `src/components` (notably `workflow`, `settings`, `layout`, `ui`). Shared hooks, stores, and helpers reside in `src/hooks`, `src/stores`, and `src/utils`; TypeScript definitions live in `src/types`. DSL parsing, linting, and state helpers are consolidated in `src/utils/workflow-state-helpers.ts`. Static assets belong in `public/`, reference docs in `docs/`, and scripted regression flows stay at the root as `test-*.js`. Playwright specs and their artifacts live in `tests/`.

## Build, Test, and Development Commands
- `npm run dev`: start the dev server at http://localhost:3000.
- `npm run build`: produce the optimized bundle for deployment.
- `npm run start`: serve the bundle; run only after building.
- `npm run lint`: apply ESLint rules defined in `eslint.config.mjs`.
- `npm test`: execute the Vitest unit suites.
- `npx playwright test`: run browser automation from `tests/*.spec.ts` (spawns the dev server if needed).
- `node test-complete-flow.js`: optional scripted smoke test; adjust base URLs and credentials before use.

## Coding Style & Naming Conventions
Author new logic in TypeScript with functional React components. Use two-space indentation, `kebab-case` filenames, and PascalCase exports. Prefer Tailwind utility classes with `clsx` for conditional styling, and import shared modules through the `@/` alias. Replace `any` with explicit interfaces—extend `NODE_TYPES` in `src/constants/node-types.ts` when adding workflow nodes.

## Testing Guidelines
Write focused unit tests with Vitest and place them under `tests/` using the `*.test.ts` suffix. Validate shared helpers (parsing, validation, store mutations) before wiring UI behavior. Playwright specs should remain isolated: seed state through the UI, avoid global dependencies, and capture traces/screenshots for flaky runs. Store reusable fixtures in `tests/mocks/` so they can be versioned and updated centrally.

## Commit & Pull Request Guidelines
Keep commit subjects under 72 characters and write them in the imperative mood. Pull requests must summarize the change, link related issues, list verification commands (lint, unit, E2E), and include before/after screenshots for UI updates. Call out follow-up items or TODO placeholders to reassure reviewers that remaining work is intentional.

## Security & Configuration Tips
Store secrets in `.env.local` and never commit live API keys or customer data. Rotate credentials embedded in `test-*.js` scripts before sharing logs. When exercising external integrations, prefer mock servers or recorded fixtures to avoid unintended network calls.
