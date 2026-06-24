---
title: Render single-provider deployment (presentation)
date: 2026-06-23
status: draft
author: Libreville Eats — deployment spec
---

# Deploying Libreville Eats to Render (presentation)

Summary
- This document describes a simple deployment for demonstration: both the `frontend` (Next.js) and the `backend` (Node/Express) run on Render, and data is stored in MongoDB Atlas. The goal is a stable, easy-to-reproduce presentation deployment for a school project (not production-grade).

Scope
- Deploy `frontend/` as a Render Web Service (Next.js) or static site on Render.
- Deploy root backend (Express app in `src/`) as a Render Web Service.
- Connect backend to a MongoDB Atlas cluster via `MONGODB_URI`.

Architecture
- Frontend (Render) → Backend API (Render) → MongoDB Atlas
- Both services run on Render and are configured via Render environment variables.

Components
- Frontend
  - Location: `frontend/`
  - Framework: Next.js (app dir); contains client pages that call the API and use sockets.
  - Build: `npm run build`
  - Start: `npm run start` (Next start) on Render Web Service
  - Env required: `NEXT_PUBLIC_API_URL` (pointing to backend API), optional `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_SITE_URL`

- Backend
  - Location: repo root (`src/`)
  - Framework: Node.js + Express; WebSocket via `socket.io` and optional Redis adapter
  - Start: `npm start` (uses `src/server.js`)
  - Env required: `MONGODB_URI`, `JWT_SECRET`, `API_BASE_URL` or `FRONTEND_URLS` / `FRONTEND_URL` to configure CORS
  - Optional env: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

- Database
  - MongoDB Atlas cluster
  - Backend uses the `MONGODB_URI` connection string stored as an environment variable on Render

Data flow
1. Browser loads UI from Render-hosted frontend.
2. Frontend calls API on backend (Render) using `NEXT_PUBLIC_API_URL`.
3. Backend validates/authenticates requests, reads/writes MongoDB Atlas.
4. Socket.io real-time events flow between frontend and backend; Redis adapter used only when `REDIS_*` is configured.

Important repo mappings
- `frontend/` → Render service (set root to `frontend/` when creating the service)
- root (backend) → Render service (set root to repository root)

Render service settings (recommended)
- Frontend service
  - Environment: `Node 20+`
  - Build command: `npm install && npm run build`
  - Start command: `npm run start`
  - Working directory: `frontend/`
  - Env vars on Render: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` (optional), `NEXT_PUBLIC_SITE_URL`

- Backend service
  - Environment: `Node 20+`
  - Build command: `npm install`
  - Start command: `npm start`
  - Working directory: repository root
  - Env vars on Render: `MONGODB_URI`, `JWT_SECRET`, `API_BASE_URL` (or set `FRONTEND_URLS` / `FRONTEND_URL`), `REDIS_HOST` / `REDIS_PORT` (optional)

Health & verification
- Backend exposes `/health` which returns status and uptime. Use it to verify the service is alive.
- Quick checks after deploy:
  - Visit frontend URL and confirm UI loads.
  - Confirm API reachability: `curl $API_URL/health` → JSON `status: ok`.
  - Create a test user/order via the UI and confirm it appears in Atlas.

Security & presentation notes
- Treat secrets (Atlas URI, JWT secret) as Render environment variables — never commit them.
- This deployment is intended for presentation; do not expose production credentials.

Limitations & optional additions
- Socket scaling requires Redis; for a presentation this is optional. If added, configure `REDIS_*` env vars and a Render Redis addon or external Redis instance.
- For true production use consider HTTPS, monitoring, backups, and stricter CORS policies.

Next steps
1. Confirm this spec.
2. I will commit this file (done). After your approval I will use the `writing-plans` skill to create an implementation plan for deploying to Render.

---
