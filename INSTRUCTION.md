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

**backend/.env** (copy from `.env.example`)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://root:password@localhost:27017/nutanix-nkp-demo?authSource=admin
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Admin auto-seed (creates on first startup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@1234

# AES-256 encryption key for cluster passwords (64 hex chars)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64-hex-chars>
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

## Admin Panel

Accessible at `/admin` — separate from main site (no shared navbar).

| Route | Description |
|-------|-------------|
| `/admin` | Admin login page |
| `/admin/dashboard` | Overview stats |
| `/admin/dashboard/users` | User CRUD + portal access |
| `/admin/dashboard/credentials` | Cluster credential management |

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Login (returns JWT) |
| POST | `/api/auth/register` | — | Register user |
| GET | `/api/admin/stats` | admin | Dashboard stats |
| GET/POST | `/api/admin/users` | admin | List / create users |
| PUT/DELETE | `/api/admin/users/:id` | admin | Update / delete user |
| GET/POST | `/api/admin/credentials` | admin | List / create credentials |
| PUT/DELETE | `/api/admin/credentials/:id` | admin | Update / delete credential |
| GET | `/api/admin/credentials/:id/kubeconfig` | admin/demo | Download kubeconfig |

## MongoDB Schemas

```
Users:       _id, username, email, passwordHash, role, portalAccess[], active, createdAt
Content:     _id, title, slug, type, portal, content (markdown), order, published, createdAt
Credentials: _id, clusterName, dashboardUrl, username, encryptedPassword,
             kubeconfigYaml, description, active, createdAt
```

## PDF Viewer — Installation Guide

The Installation Guide page (`/installation`) renders the NKP Setup Guide PDF in-browser using `@embedpdf/react-pdf-viewer`. The PDF is loaded from an S3-compatible endpoint.

**Environment variable (required):**
```
VITE_PDF_URL=https://your-s3-bucket.s3.amazonaws.com/NKP-Setup-Guide.pdf
```

**Adding/replacing the PDF:**
1. Upload the new PDF to your S3 bucket.
2. Update `VITE_PDF_URL` if the filename/path changed.
3. Ensure the S3 object is publicly readable (or has appropriate CORS headers).

**S3 CORS configuration** (required for the viewer to fetch the PDF):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"]
  }
]
```

**Routes:**
- `/installation` — Embedded PDF viewer within the main layout (with Navbar/Footer)
- `/installation/pdf` — Full-page PDF viewer in a new tab (no Navbar/Footer, like opening an image)

**Features:** Built-in toolbar with zoom, page navigation, thumbnails, annotations, search. Download PDF button (manual click only, no auto-download). Open in Tab button opens `/installation/pdf` in a new browser tab.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | Change port in `.env` or kill process |
| MongoDB connection refused | Verify MongoDB running, check URI |
| CORS errors | Match `CORS_ORIGIN` with frontend URL |
| Vite not hot-reloading | Restart dev server, check file permissions |
| Docker build fails | `docker system prune -a` |
