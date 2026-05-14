# TASK.md

Phase-by-phase tasks for the Nutanix NKP Demo E-Learning Platform.

---

## Phase 1: Local Development

### In-App PDF Viewer — Installation Guide
- [x] `react-pdf` v10 installed (pdfjs-dist v5)
- [x] `NKP-Setup-Guide.pdf` placed in `frontend/public/` for Vite static serving
- [x] `pdf.worker.min.mjs` copied to `frontend/public/` (avoids Vite bundler issues with the worker)
- [x] `InstallationGuide.jsx` rewritten — Nutanix-themed PDF viewer replaces markdown content
  - Toolbar: zoom −/+ with percentage, page ◀/▶ navigation, page count
  - Header actions: Download PDF button, Open in Tab button
  - Responsive: uses ResizeObserver to fit PDF to container width
  - States: loading spinner, per-page placeholder skeleton, error state with download fallback

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

---

## Admin Panel (Phase 1 addition)

### Backend
- [x] `Credential` model (clusterName, dashboardUrl, username, encryptedPassword, kubeconfigYaml)
- [x] AES-256 crypto helper (`backend/src/lib/crypto.js`)
- [x] Admin auto-seed from `.env` on startup
- [x] `GET/POST/PUT/DELETE /api/admin/users` — user CRUD
- [x] `GET/POST/PUT/DELETE /api/admin/credentials` — credential CRUD
- [x] `GET /api/admin/credentials/:id/kubeconfig` — kubeconfig download
- [x] `GET /api/admin/stats` — dashboard stats

### Frontend
- [x] SweetAlert2 wrapper (`src/lib/swal.js`) — toasts + confirm dialogs
- [x] `AdminRoute` guard (redirects non-admin to `/admin`)
- [x] `/admin` — dedicated admin login page
- [x] `/admin/dashboard` — sidebar layout (nutanix-950 sidebar)
  - [x] Overview page — stats cards + quick actions
  - [x] Users page — table, search, create/edit modal, delete confirm
  - [x] Credentials page — cards, reveal password, kubeconfig download, CRUD modals
- [x] Navbar: "Sign In" → "Admin" button → `/admin`

### Remaining
- [ ] Demo Portal dashboard: load credentials from `/api/admin/credentials` (demo users)
- [ ] Wire kubeconfig download button in Demo Portal dashboard

---

## Sprint: Workshop Lab Walkthrough (Phase 1 addition)

### Backend
- [x] `Workshop` model — title, description, credentialFields template (name/label/type), assignedUsers, active
- [x] `WorkshopPage` model — workshopId, title, content (markdown), order, published
- [x] `WorkshopCredential` model — per-user credential values per workshop (workshopId + userId + fields[])
- [x] `WorkshopProgress` model — userId, workshopId, completedPages[]
- [x] Admin routes: `GET/POST/PUT/DELETE /api/admin/workshops`
- [x] Admin routes: `GET/POST/PUT/DELETE /api/admin/workshops/:id/pages`
- [x] Admin routes: `GET/POST/PUT/DELETE /api/admin/workshop-credentials`
- [x] User routes: `GET /api/workshop/` (list with totalPages count)
- [x] User routes: `GET /api/workshop/my-progress` (batch progress summary)
- [x] User routes: `GET /api/workshop/:id` + `GET /api/workshop/:id/pages/:pageId` (lazy page content)
- [x] User routes: `GET /api/workshop/:id/my-credentials`
- [x] User routes: `GET/POST /api/workshop/:id/progress` (mark/unmark page complete)

### Admin Frontend
- [x] Admin sidebar: renamed "Credentials" → "Demo Credentials"
- [x] Admin sidebar: added "Workshops" and "Workshop Creds" items
- [x] `Workshops.jsx` admin page — CRUD workshops with dynamic credentialFields template + page manager (reorder, publish/draft)
- [x] `WorkshopCredentials.jsx` admin page — assign per-user credentials with dynamic fields from workshop template

### Workshop Frontend
- [x] `WorkshopDashboard.jsx` revamped — Coursera-style grid of workshop cards with live progress bars (Start/Continue/Review CTA)
- [x] `LabViewer.jsx` — full-screen Coursera-style layout:
  - Left sidebar: step list with completion checkmarks + progress bar
  - Right content: markdown rendered with styled headings, lists, blockquotes
  - Code blocks (```yaml/bash) with language label + Copy button
  - Credentials panel: per-field copy + password reveal/hide
  - Navigation: Previous / Mark as Complete / Next
  - Progress saved to MongoDB on each mark
- [x] Route `/workshop/:workshopId/lab` outside Layout (no Navbar/Footer)

### Sprint 2 additions (same sprint)
- [x] Demo Portal: already fully wired via `/api/credentials` (user-scoped, decrypted password) — no changes needed
- [x] Admin stats: `totalWorkshops` + `totalPages` added to `/api/admin/stats`
- [x] Admin Overview: 6-card stats grid (2 new cards: Active Workshops, Published Lab Steps)
- [x] Admin Overview: 4 Quick Action links including Workshops and Workshop Creds
- [x] LabViewer: auto-advance to next step 1.5s after marking complete (useRef timer, cancels on manual nav)
- [x] LabViewer: "Advancing…" state with pulse + bounce on Next button during countdown
- [x] LabViewer: sticky bottom navigation bar (Coursera-style — always visible, outside scroll area)
- [x] LabViewer: Workshop completion celebration banner (Trophy icon, "Back to Courses" CTA)
- [x] LabViewer: Richer markdown typography (larger body text, tighter tracking on headings, better blockquote)
- [x] LabViewer: Sidebar — numbered step circles instead of plain outlines; active step card elevated
- [x] LabViewer: Code blocks — `shadow-sm`, language bar with hover copy, slightly larger padding
- [x] LabViewer: Credentials panel — divider rows, field count badge, `rounded-2xl` container
- [x] WorkshopDashboard: "Continue where you left off" hero (Coursera pattern) for in-progress workshops
- [x] WorkshopDashboard: Completed badge uses CheckCircle icon

## Sprint 3: Workshop Admin UX Overhaul

### Backend
- [x] `WorkshopCredential` model — `userId` made optional; `isGlobal: Boolean` field added
- [x] `POST /api/admin/workshop-credentials` — `isGlobal` support; no `userId` required for global creds
- [x] `GET /api/workshop/:id/my-credentials` — falls back to global credential when no per-user record exists

### Admin Frontend
- [x] `Workshops.jsx` — Page editor replaced with split-view (write left / preview right)
  - Markdown toolbar: H2, H3, Bold, Italic, Inline Code, YAML block, BASH block, Blockquote
  - Click-to-insert variable buttons (`${fieldName}`) for each credential field
  - Live preview with dynamic variable reference card
  - Mobile: tab toggle (Write / Preview)
  - `credentialFields` passed from WorkshopCard → PageManager → PageModal
- [x] `WorkshopCredentials.jsx` — Improved credential modal + global support
  - Global Credential toggle (hides user selector; shared by all workshop users)
  - Per-field password reveal toggle + copy-to-clipboard button
  - Credential cards grouped: Global section / Per-User section
  - Global badge displayed on global credential cards

### Workshop Frontend
- [x] `LabViewer.jsx` — `${fieldname}` variable substitution in page content
  - Variables resolved from user's credential record (per-user or global fallback)
  - Unresolved variables (no credential value) shown as-is in content

---

## Sprint 4: Container Lab Provisioning

### Backend
- [x] `ContainerSession` model — userId, containerName, containerId, slot, sshPort, codeServerPort, encryptedPassword, status
- [x] `backend/src/lib/docker.js` — dockerode singleton (connects via `/var/run/docker.sock`)
- [x] `POST /api/admin/containers/build-image` — spawns `docker build -t nutanix-lab:latest` async; streams output to in-memory log
- [x] `GET  /api/admin/containers/build-status` — returns build phase (`idle|building|built|error`) + last 100 log lines; reconciles with Docker image existence
- [x] `GET  /api/admin/containers` — lists all non-admin users merged with their session; syncs live Docker status to DB; returns hostIP
- [x] `POST /api/admin/containers/:userId/provision` — allocates lowest free slot (SSH=30000+slot, code-server=31000+slot), generates 12-char password, creates privileged Docker container
- [x] `POST /api/admin/containers/:userId/start` — starts stopped container
- [x] `POST /api/admin/containers/:userId/stop` — stops running container
- [x] `DELETE /api/admin/containers/:userId` — stops + removes container, deletes session record
- [x] `DELETE /api/admin/users/:id` — extended to auto-stop + remove lab container before deleting user

### Docker
- [x] `docker/Dockerfile.lab` — Ubuntu 22.04 + Docker CE + kubectl v1.28 + helm v3.13 + git + curl + code-server
- [x] `docker/lab-start.sh` — entrypoint: creates `user` account, configures SSH password auth, starts dockerd (privileged), writes code-server config, starts code-server on port 8080
- [x] `docker-compose.dev.yml` — backend service stub (commented) showing socket mount pattern for Phase 2

### Admin Frontend
- [x] `ContainerLabs.jsx` — admin page with:
  - Build Image button (triggers async build, polls status every 3s, shows progress banner)
  - Expandable build log (monospace dark terminal style)
  - Image status banner (idle / building / built / error)
  - Per-user row: avatar, username, status badge, SSH command with copy, code-server URL (clickable), password with reveal/hide + copy, action buttons
  - Action buttons contextual by state: Provision (disabled until image built) / Start / Stop / Delete
  - Sync button — re-fetches live Docker status
- [x] Admin sidebar — "Container Labs" nav item (`Container` icon)
- [x] Admin routes — `/admin/dashboard/container-labs` route registered
- [x] Overview — "Container Labs" Quick Action link added

### Port Scheme
- SSH:         `30000 + slot`  (30001, 30002, …)
- code-server: `31000 + slot`  (31001, 31002, …)
- Username: `user` (fixed)
- Password: 12-char alphanumeric (same for SSH and code-server)

---

## Cross-Phase Requirements

- [ ] No console warnings or errors; meaningful user-facing error messages
- [ ] API endpoint documentation maintained
- [ ] Meaningful commits, feature branches, `.gitignore` configured
