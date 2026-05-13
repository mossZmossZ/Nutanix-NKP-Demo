# INSTRUCTION.md

Technical setup, architecture, and commands for the Nutanix NKP Demo E-Learning Platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite, shadcn/ui, Tailwind CSS |
| Backend | Node.js + Express, model-middleware architecture |
| Database | MongoDB |
| Deployment | Docker + Nginx reverse proxy |

## Project Structure

```
nutanix-nkp-demo/
├── frontend/
│   └── src/{components,pages,styles,utils}/
├── backend/
│   └── src/{models,middleware,routes,config}/
├── docs/                    # Markdown guides
└── docker/                  # Dockerfiles + compose configs
```

## Environment Variables

**backend/.env**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nutanix-nkp-demo
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env.local**
```
VITE_API_URL=http://localhost:5000/api
```

## Phase 1 — Local Development (MongoDB in Docker)

MongoDB runs in Docker; frontend and backend run locally with hot-reload.

```bash
# 1. Start MongoDB in Docker
docker-compose -f docker-compose.dev.yml up -d

# 2. Copy and configure env
cp .env.example backend/.env

# 3. Start backend (http://localhost:5000)
cd backend && npm install && npm run dev

# 4. Start frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

**docker-compose.dev.yml** — MongoDB only:
- `mongodb` — mongo:7, port 27017 exposed to host, persistent volume

```bash
# Stop MongoDB
docker-compose -f docker-compose.dev.yml down

# Stop and remove volume (wipe data)
docker-compose -f docker-compose.dev.yml down -v
```

## Phase 2 — Full Docker Development

All three services run in Docker with hot-reload volumes.

```bash
docker-compose -f docker-compose.full.yml up --build
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml logs -f
```

**docker-compose.full.yml services:**
- `mongodb` — mongo:7, persistent volume
- `backend` — node:20-alpine, port 5000, `./backend:/app` volume, nodemon
- `frontend` — node:20-alpine, port 5173, `./frontend:/app` volume, Vite

## Phase 3 — Production with Nginx

```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down
```

**Production additions:**
- `frontend` — multi-stage build (node:18-alpine build → nginx:alpine serve)
- `backend` — production deps only (`npm install --only=production`), PM2 or `node src/server.js`
- `nginx` — reverse proxy on port 80/443, SSL certs mounted at `./certs`
- All services: `restart: always`, health checks

**Nginx routing:**
- `/` → frontend:80
- `/api/` → backend:5000
- Gzip compression, cache headers, security headers (X-Frame-Options, HSTS)

**Production .env additions:**
```
MONGO_PASSWORD=secure-password
FRONTEND_URL=https://your-domain.com
BACKEND_API_URL=https://your-domain.com/api
```

## MongoDB Schemas

```
Users:   _id, username, email, passwordHash, role, portalAccess[], createdAt
Content: _id, title, slug, type, portal, content (markdown), order, createdAt
Creds:   _id, clusterName, endpoint, username, encryptedPassword, createdAt
YAML:    _id, name, description, content, createdAt
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | Change port in `.env` or kill process |
| MongoDB connection refused | Verify MongoDB running, check URI |
| CORS errors | Match `CORS_ORIGIN` with frontend URL |
| Vite not hot-reloading | Restart dev server, check file permissions |
| Docker build fails | `docker system prune -a` |
