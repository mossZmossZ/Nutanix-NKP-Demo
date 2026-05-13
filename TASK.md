# TASK.md

Phase-by-phase tasks for the Nutanix NKP Demo E-Learning Platform.

---

## Phase 1: Local Development

### Setup
- [ ] Frontend: React+Vite, Tailwind CSS, shadcn/ui, folder structure
- [ ] Backend: Express server, env config, folder structure
- [ ] MongoDB: local/cloud connection, database utility, initial schemas

### Frontend
- [ ] Base layout: navbar (Nutanix branding), footer, layout wrapper
- [ ] Pages: Home, Installation Guide, Demo Portal login, Workshop Portal login, 404
- [ ] Auth UI: login form, auth state management (Context API)
- [ ] Demo Portal: dashboard, cluster credentials view, YAML file browser/download, lab viewer
- [ ] Workshop Portal: dashboard, learning modules list, lab exercises viewer, progress tracking

### Backend
- [ ] Express: CORS, body parser, error handling middleware, logging
- [ ] Auth: User model, JWT login/register endpoints, protected route middleware
- [ ] Users: `GET /api/users/:id`, `GET /api/users/:id/portal-access`, RBAC middleware
- [ ] Content: `GET /api/content`, `GET /api/content/:slug`, `GET /api/content/portal/:name`, markdown support
- [ ] Credentials: model with encryption, `GET /api/credentials`, `GET /api/credentials/:id`
- [ ] YAML files: `GET /api/yaml-files`, `GET /api/yaml-files/:id`, `GET /api/yaml-files/:id/download`

### Documentation (Markdown)
- [ ] Installation Guide — prerequisites, steps, troubleshooting
- [ ] Demo Portal Guide — login, credentials, YAML usage, lab walkthroughs
- [ ] Workshop Guide — course structure, lab submission, resources

### Validation
- [ ] Frontend: pages render, navigation, forms, no console errors
- [ ] Backend: all endpoints respond, auth flows, DB queries, error handling
- [ ] Integration: end-to-end login, protected content access, portal access control

**Success Criteria:**
- Hot-reload local dev running for both frontend and backend
- Users can log in to Demo and Workshop portals
- Authenticated users can view portal content and guides
- No critical console or server errors

---

## Phase 2: Docker Development

### Docker Config
- [ ] `Dockerfile.frontend` — node:18-alpine, port 5173, volume for hot-reload
- [ ] `Dockerfile.backend` — node:18-alpine, port 5000, nodemon + volume for hot-reload
- [ ] `docker-compose.dev.yml` — frontend + backend + mongodb, networking, env vars, volumes
- [ ] MongoDB container — root credentials, persistent volume, port 27017

### Validation
- [ ] All containers start, services communicate, hot-reload works, data persists
- [ ] Setup works consistently across team machines

**Success Criteria:**
- App runs fully in Docker with hot-reload
- Data persists in MongoDB volume
- Consistent dev environment across team

---

## Phase 3: Production Deployment

### Frontend
- [ ] Multi-stage Dockerfile: node:18-alpine build → nginx:alpine serve
- [ ] SPA routing rewrite rules, asset minification

### Backend
- [ ] Production Dockerfile: prod deps only, PM2 or `node src/server.js`, health check
- [ ] Compression middleware, rate limiting, proper logging

### Nginx
- [ ] Reverse proxy: `/` → frontend, `/api/*` → backend
- [ ] Gzip compression, cache headers, security headers (X-Frame-Options, HSTS)
- [ ] SSL/TLS: HTTPS redirect, Let's Encrypt support

### MongoDB
- [ ] Auth enabled, proper user roles, persistent volume, backup strategy

### Infra & Security
- [ ] `docker-compose.prod.yml` — restart: always, health checks, resource limits
- [ ] `.env.production` with all vars; no hardcoded secrets in images
- [ ] `GET /api/health` endpoint, centralized container logging
- [ ] Non-root users in containers, rate limiting, CSRF/XSS headers

### Validation
- [ ] Staging deploy: all services healthy, SSL/TLS verified, auto-restart confirmed
- [ ] Load test, rollback procedure documented

**Success Criteria:**
- Deployed behind Nginx with SSL/TLS
- All services have health checks and auto-restart
- Assets minified, gzip enabled, sensitive data secured
- Deployment and rollback procedures documented

---

## Cross-Phase Requirements

- [ ] No console warnings or errors; meaningful user-facing error messages
- [ ] API endpoint documentation maintained
- [ ] Meaningful commits, feature branches, `.gitignore` configured
