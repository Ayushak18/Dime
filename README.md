# Dime

A real-time stock market platform, built incrementally from a simple stock dashboard into an event-driven system — simulator, WebSockets, Redis, paper trading, a matching engine, and Kafka — each piece introduced only once a real problem calls for it.

## Status

Early-stage, actively being built. So far:

- REST API with a Postgres-backed stock list (`GET /api/v1/stocks`)
- Full auth flow: signup, login, logout, and refresh-token rotation, using `httpOnly` cookies
- Next.js frontend scaffolded, not yet wired to the API

Not yet built: market simulator, WebSockets, Redis, paper trading, matching engine, Kafka, deployment.

## Tech stack

- **API** — Node, Express 5, TypeScript (native ESM), Prisma, PostgreSQL
- **Web** — Next.js (App Router), React Compiler, Tailwind
- **Infra (local)** — Docker Compose (Postgres)
- **Auth** — JWT access tokens + rotating refresh tokens, both as `httpOnly` cookies

## Architecture at a glance

```
apps/
  api/   Express API — routes -> services -> Prisma -> Postgres
  web/   Next.js frontend (not yet connected to the API)
```

The API is versioned under `/api/v1`. `app.ts` builds and exports the configured Express app; `server.ts` only starts it listening — kept separate so the app can be tested without binding a port.

## Getting started

This is a monorepo without npm workspaces, so dependencies are installed per app.

**1. Start Postgres:**
```bash
docker compose up -d
```

**2. Install dependencies:**
```bash
npm install                 # root (just concurrently, for running both apps)
cd apps/api && npm install
cd ../web && npm install
```

**3. Configure environment variables:**
```bash
cp .env.example .env                  # root — Postgres credentials for Docker Compose
cp apps/api/.env.example apps/api/.env  # API — DATABASE_URL, JWT_SECRET, etc.
```

**4. Apply migrations and seed data:**
```bash
cd apps/api
npx prisma migrate dev
npm run db:seed
```

**5. Run both apps:**
```bash
# from the repo root
npm run dev
```

API runs on `http://localhost:4000`, web on `http://localhost:3000`.

## API

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/stocks` | List stocks |
| POST | `/api/v1/auth/signup` | Create an account |
| POST | `/api/v1/auth/login` | Log in, sets auth cookies |
| POST | `/api/v1/auth/refresh` | Rotate the refresh token, issue a new access token |
| POST | `/api/v1/auth/logout` | Invalidate the refresh token, clear cookies |

A ready-to-import Postman collection is at [`postman/Dime.postman_collection.json`](postman/Dime.postman_collection.json).

## Roadmap

1. **Live dashboard** — DB-backed stocks (done) → auth (done) → market simulator → WebSocket price feed → Redis pub/sub → frontend → deploy
2. **Paper trading** — orders, holdings, P&L, an in-memory matching engine
3. **Kafka + alerts** — event-driven fan-out once there are real producers/consumers
4. **Proof** — load testing, metrics, CI, a full architecture write-up

## License

ISC
