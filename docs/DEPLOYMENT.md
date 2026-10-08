# CineMate Production Deployment

## Architecture
- Frontend: Vite build served by Nginx.
- Backend: Node.js 22 + Express + FFmpeg.
- Database: MongoDB/MongoDB Atlas.
- Cache/queue: Redis.
- Media: Cloudinary.
- External services: TMDB, Telegram, SMTP as configured.

## Required production secrets
Backend `.env`:
- `NODE_ENV=production`
- `MONGO_URI`
- `JWT_SECRET` (at least 32 characters)
- `FRONTEND_URL`
- `REDIS_URL`
- TMDB credentials
- Cloudinary credentials
- SMTP credentials
- Telegram bot credentials

Frontend build environment:
- `VITE_API_BASE_URL=https://api.example.com/api`
- `VITE_TMDB_ACCESS_TOKEN`
- any other `VITE_*` values required by the frontend.

Never commit real secrets.

## Docker
Build from repository root:

```bash
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Check backend health:

```bash
curl https://api.example.com/health
```

The backend health response should report database connectivity and process health.

## Deployment order
1. Provision MongoDB and create the production database/user.
2. Provision Redis with persistence and authentication where supported.
3. Provision the backend host/container and set backend secrets.
4. Provision the frontend build with the production API URL.
5. Configure HTTPS and the public frontend/backend domains.
6. Configure Telegram webhook URL and secret token.
7. Verify health, authentication, libraries, ratings/reviews, social feed, Scene Finder and Telegram flows.
8. Run the health load test against staging before exposing production traffic.

## Load test
From the backend directory:

```bash
TARGET_URL=https://api.example.com CONCURRENCY=50 ROUNDS=20 npm run load:health
```

Tune `P95_MAX_MS` and `P99_MAX_MS` for the actual production/staging environment.

## Important
Actual cloud deployment still requires the hosting provider, MongoDB, Redis, DNS and secret values. The repository contains the production build/container/CI scaffolding, but no live infrastructure credentials are committed.
