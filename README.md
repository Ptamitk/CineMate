# CineMate

CineMate is a full-stack entertainment discovery and social platform for movies, TV/web series, creators, community posts, personal libraries, Telegram search and Scene Finder.

## Stack
- React + Vite + Tailwind
- Node.js + Express
- MongoDB + Mongoose
- TMDB
- Cloudinary
- Redis/BullMQ for Scene Finder jobs
- FFmpeg/OCR/audio/visual processing for Scene Finder
- Telegram Bot API
- Nginx/Docker deployment

## Run locally

### Frontend
```bash
npm install
npm run dev
```

Create `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend
```bash
cd backend
npm install
node server.js
```

Use `backend/.env.example` as the configuration template.

## Production checks
The repository includes `.github/workflows/production-ci.yml` for frontend build/lint and backend tests.

Health endpoint:
`GET /health`

Production container files:
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker-compose.production.yml`
- `nginx.conf`

## Security
Never commit real secrets. Configure MongoDB, JWT, TMDB, Cloudinary, Google OAuth, Telegram, email, Redis and frontend URLs through environment variables.

## Main product areas
- Movies and TV/web series
- Details, cast/crew, trailers and watch providers
- Search, similar and recommended content
- Watchlist, watched and favorites
- User ratings and community reviews
- Social feed, follows, likes, comments, shares and notifications
- Telegram integration
- Scene Finder
