# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is two separate Node projects in one repo, each with its own `package.json` and `node_modules` — always `cd` into the right one before running commands.

- **Root (`/`)** — Express/MongoDB/Redis backend API. Entry: `src/server.js`.
- **`frontend/`** — Next.js 14 (App Router) + TypeScript + Tailwind frontend. Entry: `frontend/app/layout.tsx`.

## Commands

### Backend (run from repo root)

```bash
npm run dev                          # nodemon dev server on PORT (default 5000)
npm start                            # production start
npm test                             # jest --coverage (tests/*.test.js, supertest against a real MongoDB — no mocking)
npm test -- tests/order.test.js      # run a single test file
npm run lint                         # eslint src/
npm run seed                         # populate DB with Gabonese sample data (scripts/seed/)
npm run seed:clean                   # empty collections
npm run indexes                      # create/verify MongoDB indexes
npm run aggregate:all                # run all aggregation pipelines (scripts/aggregations/)
```

Backend tests connect to a real MongoDB (`connectDatabase()`/`disconnectDatabase()` in `beforeAll`/`afterAll`) — a running Mongo instance (`MONGODB_URI` in `.env`) is required to run them, not just unit isolation.

### Frontend (run from `frontend/`)

```bash
npm run dev                          # next dev, port 3000
npm run build                        # next build (also runs TS typecheck + eslint)
npm test                             # jest (jest.config.js / jest.setup.ts, RTL)
npm test -- CartDrawer                # run tests matching a name
npm run lint                         # next lint
npx tsc --noEmit                     # typecheck only
```

Frontend expects `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (defaults to `http://localhost:5000/api`).

## Backend architecture

Layered Express app: `routes/` → `middleware/` → `controllers/` → `models/`. `src/app.js` wires CORS (origin allow-list from `config.frontend.urls`), JSON body parsing, a catch-all 404, and a global error handler that reads `err.statusCode`. `src/server.js` is the actual process entry: connects MongoDB and Redis, creates the `http.Server`, attaches Socket.io, and handles `SIGTERM`/`SIGINT`.

- **Config** (`src/config/index.js`) centralizes all env vars (mongodb, redis, server, jwt, frontend origins, logging) — read from here, not `process.env` directly, in new code.
- **Auth**: JWT-based. `middleware/jwtAuth.js` verifies the `Authorization: Bearer` header and sets `req.user` (decoded payload, not a DB lookup). `middleware/authorize(...roles)` gate-checks `req.user.role` against `User.role` enum: `CUSTOMER | VENDOR | DELIVERER | ADMIN`.
- **Validation**: Zod schemas in `src/schemas/`, applied via `middleware/validateRequest(schema)`, which parses `{ body, params, query, headers }` together and stores the result on `req.validated`.
- **Errors**: throw `AppError` (`src/utils/AppError.js`, has `.unauthorized()`/`.forbidden()` etc. statics) or any `Error` with `.statusCode` — the global handler in `app.js` serializes it and includes `.stack` only when `NODE_ENV=development`.
- **Models** (Mongoose, embedded-document style — not normalized): `Restaurant` embeds `menus[].dishes[]` directly (no separate Dish collection); `Commande` (orders) snapshots ordered items (`items[].dishName/unitPrice` etc.) rather than referencing live dish docs, plus an embedded `statusHistory[]` and time-series `deliveryTracking[]` for GPS. `User` embeds `addresses[]` and stores `favoriteRestaurants`/`favoriteDishes` as raw ObjectId arrays (no populate target model name yet).
- **Order status** is a strict state machine — `src/utils/orderStateMachine.js` defines `ORDER_STATUSES` and `VALID_TRANSITIONS`; always go through `isValidTransition(current, next)` before writing a new `status`, don't set `commande.status` directly.
- **Caching**: `src/services/cacheService.js` wraps Redis get/set/invalidate with fixed TTLs (`TTL.RESTAURANTS` etc.) and key-builder helpers (`getRestaurantCacheKey`, `getOrderCacheKey`, ...) — use these builders rather than hand-rolling cache keys, so invalidation patterns stay consistent. Redis is optional: `config/redis.js` degrades to "cache disabled" if it can't connect, and `cacheService` treats a disconnected client as a cache miss rather than throwing.
- **Realtime**: `src/socket/index.js` authenticates Socket.io connections via the same JWT (`socket.handshake.auth.token`), joins each client to a `user:<id>` room, and supports ad hoc `order:<id>` rooms for live GPS (`location:update`) and order status (`order:status:update`) broadcasts. Use `emitToRoom`/`emitToUser` exported from this module to push events from controllers/services rather than reaching into a global `io`. In multi-instance deployments it attaches `@socket.io/redis-adapter` automatically when Redis is connected.
- Indexes matter here: geospatial (`2dsphere` on restaurant/user/order coordinates), compound (`status + restaurant_id`, `customer_id + createdAt`), and a weighted text index on `Restaurant` (name/menu/dish name/description) for search — check `scripts/indexes/` and the model files before adding new query patterns that might need a new index.

## Frontend architecture

Next.js App Router, route groups roughly mirror `User.role`: `app/restaurants/` (+ `[id]`) is the customer browse/order flow, `app/restaurant/dashboard` (singular) is the vendor-facing menu/order management UI, `app/deliverer/dashboard` is the courier UI, `app/admin` is admin. Auth pages live under `app/auth/` (`login`, `register`, `register/vendor`, `register/deliverer`, `pro`).

- **API access**: `lib/api.ts` exports a single configured axios instance — it auto-attaches the JWT from `localStorage` on every request and force-redirects to `/auth/login` on a 401. Use this instance for authenticated calls instead of raw `fetch`; some pages (e.g. restaurant listing) call `fetch` directly against `NEXT_PUBLIC_API_URL` for unauthenticated reads — match whichever pattern the surrounding page already uses.
- **Cart**: `lib/cartHelper.ts` is the single source of truth for cart shape (`CartItem`) and persists to `localStorage` under the `cart` key (`loadCart`/`saveCart`/`addToCart`/`getCartTotal`/`getTotalItems`). The cart is restaurant-scoped — adding a dish from a different restaurant than what's already in the cart is a conflict the calling page must resolve explicitly (see the replace-cart confirmation flow in `RestaurantDetailClient.tsx`); `cartHelper` itself doesn't enforce this.
- **Design tokens**: `tokens.css` defines the full design system as CSS custom properties (colors in OKLCH, spacing scale, type scale, radii, shadows, easing/duration) under `:root`, with dark-mode overrides under `.dark` (toggled by a `localStorage('darkMode')` flag, set in an inline script in `app/layout.tsx` to avoid a flash). `tailwind.config.ts` maps Tailwind's `colors`/`fontSize`/`fontFamily`/`borderRadius`/`boxShadow` theme keys to these `var(--...)` tokens — prefer adding a token + Tailwind mapping over hardcoding a new color/size in a component.
- **Fonts**: body font (Geist Variable) is self-hosted via `@fontsource-variable/geist`; display (Fraunces) and mono (IBM Plex Mono) are loaded via `next/font/google` in `app/layout.tsx`, which sets the `--font-display`/`--font-mono` CSS variables consumed by `tokens.css`/Tailwind — don't reintroduce a Google Fonts `<link>` or `@import` for these.
- Shared UI primitives live in `app/components/` (`Header`, `Footer`, `CartDrawer`, `Skeleton`, `StarRating`, `PageToolbar`, `icons.tsx` for inline SVG icon components) — check there before adding a new one-off component.
