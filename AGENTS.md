# AGENTS.md

## Cursor Cloud specific instructions

This is a single **Next.js 15 (App Router) + TypeScript** full-stack app ("Youngeun Office", a meeting-room reservation system). It uses **Prisma** with a local **SQLite** file (`prisma/dev.db`) — there is no separate database server. Standard commands live in `package.json` scripts and the setup flow in `README.md`.

### Environment / startup notes (non-obvious)

- A local `.env` is required and is git-ignored. It must define `DATABASE_URL="file:./dev.db"` and a `SESSION_SECRET` (any ~32-char string); `PORT` defaults to 3000. The update script creates `.env` from `.env.example` only if it is missing.
- The SQLite DB and seed data are NOT committed (git-ignored). After the update script runs, initialize the DB with `npm run db:setup` (runs `prisma db push` + seeds an ADMIN and default rooms) before first run. Re-running is safe (idempotent upserts). If you hit data/schema conflicts, delete `prisma/dev.db` and re-run `npm run db:setup`.
- Seeded admin login: Name `Youngeun Admin`, PIN `0000` (redirects to `/admin`). Login is name + PIN (no email).
- **SMS runs in dev mode** unless `SMS_*` env vars are set: phone-verification codes are printed to the server console / shown on screen, so registration and account-recovery flows are fully testable without real SMS credentials.
- Run the dev server with `npm run dev` (http://localhost:3000). Build with `npm run build` (runs `prisma generate` first). `postinstall` also runs `prisma generate`, so the Prisma client is regenerated on every `npm install`.

### Lint caveat

`npm run lint` (`next lint`) is **interactive** and will fail/prompt because the repo has no committed ESLint config — it asks how to configure ESLint. There is no automated test suite in this repo.
