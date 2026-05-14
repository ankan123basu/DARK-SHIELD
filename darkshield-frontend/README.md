# 🛡️ DARKSHIELD — Cyber Threat Intelligence Platform

> **Full-stack cybersecurity operations platform** built with Spring Boot 4.0 + React 18 + MongoDB.  
> Features 3D attack globe, India threat map, automated threat scoring, auto-escalation engine, and real-time SOC dashboard.

---

## 📸 What This Project Does

DARKSHIELD is a **Security Operations Center (SOC) platform** that:

- **Ingests** cyber threats with full metadata (type, severity, geolocation, MITRE ATT&CK IDs, IOC indicators)
- **Scores** each threat automatically (0–100) using a multi-factor composite engine
- **Escalates** critical threats (score ≥ 75) into P1 incidents **without human intervention**
- **Manages** the full NIST incident lifecycle: Detect → Investigate → Contain → Eradicate → Recover → Close
- **Visualizes** attacks on an interactive 3D globe (drag to rotate, scroll to zoom) and India city-level threat map
- **Enforces** role-based access: Analyst < Hunter < Admin with JWT token auth
- **Audits** every action (create, edit, delete, escalate, login) with timestamped forensic trail

---

## 🚀 How to Run (Step by Step)

### Step 1 — Verify MongoDB is Running

MongoDB installs as a Windows service. It starts automatically. To check:

```powershell
Get-Service MongoDB
```

You should see `Status: Running`. If stopped:

```powershell
net start MongoDB
```

Also open **MongoDB Compass** → connect to `mongodb://localhost:27017` → you'll see `darkshield_db` populate after first backend start.

---

### Step 2 — Start the Backend

Open **Terminal 1**:

```powershell
cd d:\SpringBootProj\darkshield-backend
mvn spring-boot:run
```

Wait until you see:
```
Started DarkshieldApplication in X seconds
DataSeeder: Seeding completed
```

The backend runs on **http://localhost:9091**

> **First run:** DataSeeder automatically inserts 10 threats, 4 incidents, 7 assets, and 3 users into MongoDB.

---

### Step 3 — Start the Frontend

Open **Terminal 2**:

```powershell
cd d:\SpringBootProj\darkshield-frontend
npm run dev
```

Wait for:
```
Local: http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Login Credentials

| Username | Password | Role | Access Level |
|----------|----------|------|-------------|
| `admin` | `admin123` | ADMIN | Full access: create, edit, delete, manage users, view audit logs |
| `hunter` | `hunter123` | HUNTER | Create threats/incidents, escalate, resolve incidents |
| `analyst` | `analyst123` | ANALYST | View dashboard, create threats and incidents (cannot delete or escalate) |

---

## 📋 All CRUD Operations

### Threats (`/api/threats`)
| Operation | Endpoint | Who |
|-----------|----------|-----|
| Create threat | `POST /api/threats` | All roles |
| List all | `GET /api/threats` | All roles |
| Get by severity | `GET /api/threats/severity/{CRITICAL\|HIGH\|MEDIUM\|LOW}` | All roles |
| Get recent | `GET /api/threats/recent` | All roles |
| Get top-scoring | `GET /api/threats/top-scoring` | All roles |
| Update threat | `PUT /api/threats/{id}` | All roles |
| Delete threat | `DELETE /api/threats/{id}` | **ADMIN only** |

> **Auto-scoring**: Every create/update triggers `ThreatScoringEngine` → composite score 0–100  
> **Auto-escalation**: Score ≥ 75 → `AutoEscalationService` creates a P1 incident automatically

### Incidents (`/api/incidents`)
| Operation | Endpoint | Who |
|-----------|----------|-----|
| Create incident | `POST /api/incidents` | All roles |
| List all | `GET /api/incidents` | All roles |
| Get open incidents | `GET /api/incidents/open` | All roles |
| Get recent | `GET /api/incidents/recent` | All roles |
| Update incident | `PUT /api/incidents/{id}` | All roles |
| Escalate severity | `PUT /api/incidents/{id}/escalate` | **HUNTER + ADMIN** |
| Resolve incident | `PUT /api/incidents/{id}/resolve` | **HUNTER + ADMIN** |
| Delete incident | `DELETE /api/incidents/{id}` | **ADMIN only** |

### Assets (`/api/assets`)
| Operation | Endpoint | Who |
|-----------|----------|-----|
| Register asset | `POST /api/assets` | All roles |
| List all | `GET /api/assets` | All roles |
| Get high-risk | `GET /api/assets/high-risk` | All roles |
| Update asset | `PUT /api/assets/{id}` | All roles |
| Delete asset | `DELETE /api/assets/{id}` | **ADMIN only** |

### Auth (`/api/auth`)
| Operation | Endpoint |
|-----------|----------|
| Register | `POST /api/auth/register` |
| Login | `POST /api/auth/login` |
| Refresh token | `POST /api/auth/refresh` |

### Dashboard (`/api/dashboard`)
| Endpoint | Returns |
|----------|---------|
| `GET /api/dashboard/stats` | Total threats, critical count, open incidents, avg score, compromised assets, operator count |

---

## 🌐 Frontend Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Immersive cyberpunk homepage with 3D globe, hex rain, glitch effects |
| Login | `/login` | Split-panel operator login with terminal status block |
| Register | `/register` | Operator enrollment with progress ring |
| SOC Dashboard | `/dashboard` | Real-time stats, 3D globe, India threat map, live feed — auto-refreshes every 8s |
| Threat Globe | `/globe` | Full-screen interactive 3D globe, hover nodes for threat details |
| Threats | `/threats` | Full CRUD table with severity filter, score bars |
| Incidents | `/incidents` | Full CRUD with escalate/resolve actions and NIST lifecycle |
| Assets | `/assets` | Asset inventory with risk scoring |

---

## 🔧 Tech Stack

### Backend
- **Spring Boot 4.0** + **Java 26** + **Maven**
- **Spring MVC** — REST Controllers with `@RestController`, `@RequestMapping`
- **Spring Security 7** — JWT stateless authentication, `@PreAuthorize` RBAC
- **Spring Data MongoDB** — Repository pattern, automatic query methods
- **JJWT 0.12** — JWT generation, signing, and validation
- **Lombok 1.18.38** — Boilerplate reduction
- **Jackson 3.x** (`tools.jackson`) — JSON serialization

### Frontend
- **React 18** + **Vite**
- **Three.js** via **React Three Fiber** + **Drei** — 3D globe with OrbitControls
- **Framer Motion** — Page animations, stagger reveals, parallax
- **Axios** — API calls with JWT auto-refresh interceptor
- **React Router v6** — Client-side routing

### Database
- **MongoDB 7** — Local Windows service on port `27017`
- Database: `darkshield_db`
- Collections: `users`, `threats`, `incidents`, `assets`, `audit_logs`

---

## 🏗️ Project Architecture

```
d:\SpringBootProj\
├── darkshield-backend\
│   └── src\main\java\com\darkshield\
│       ├── controller\      → REST API endpoints
│       ├── service\         → Business logic, ThreatScoringEngine, AutoEscalationService
│       ├── repository\      → Spring Data MongoDB repos
│       ├── model\           → MongoDB document models
│       ├── dto\             → Request/Response DTOs
│       ├── security\        → JWT filter, entry point, token provider
│       └── config\          → SecurityConfig, CorsConfig, DataSeeder
│
└── darkshield-frontend\
    └── src\
        ├── pages\           → LandingPage, LoginPage, DashboardPage, ThreatsPage...
        ├── components\      → Sidebar, CyberGlobe (3D), IndiaMap (SVG)
        ├── context\         → AuthContext (JWT state management)
        └── api\             → Axios instance with interceptors
```

---

## ⚙️ Key Backend Logic

### ThreatScoringEngine (auto-score on every create/update)
```
Score = severityBase + typeWeight + recencyBonus + iocCount + mitreWeight
      = 0-40        + 0-25       + 0-15         + 0-10     + 0-10
      = 0-100 total
```

### AutoEscalationService (fires when score ≥ 75)
```
If threat.score >= 75:
  → Create P1 Incident automatically
  → Link incident to threat
  → Add timeline entry: "Auto-escalated by SYSTEM"
  → Write to AuditLog
```

### JWT Flow
```
Login → Access Token (15 min) + Refresh Token (7 days)
Every API request → Bearer token in Authorization header
Token expired → Axios interceptor auto-refreshes silently
```

---

## 🖥️ SOC Terminal — Built-in Command Centre

An interactive Linux-style terminal is embedded at the bottom of every Dashboard page. It queries **live MongoDB data** in real time.

### Available Commands

| Command | What it does |
|---------|-------------|
| `help` | Show all available commands |
| `whoami` | Display current operator identity, role & clearance level |
| `threats` | Fetch and display live threat feed from MongoDB with severity badges |
| `stats` | Pull real-time SOC dashboard statistics in a formatted table |
| `incidents` | Show open incident response queue with status and priority |
| `assets` | List full network asset inventory with risk scores |
| `top` | Top 5 highest-scoring threats ranked by composite score |
| `scan [ip]` | Simulate an nmap-style network port scan |
| `ping [host]` | Simulate ICMP ping with latency output |
| `ls` | List available data directories |
| `clear` / `Ctrl+L` | Clear terminal screen |
| `exit` | Minimize terminal |
| `↑` / `↓` | Navigate command history |
| `Tab` | Autocomplete commands |

---

## 🌍 3D Immersive Landing Page

The landing page hero section now uses a full **React Three Fiber** 3D scene:

### HeroGlobe3D (`HeroGlobe3D.jsx`)
- **Textured globe sphere** with lat/lon grid lines (cyan + green at 15° intervals)
- **2-layer atmosphere glow** pulsing with sine wave animation
- **12 city nodes** — 6 Indian targets (Delhi, Mumbai, Bangalore, Kolkata, Chennai, Hyderabad) + 6 source countries — each with animated pulsing ring
- **7 live attack arcs** — animated curved lines from Russia / Japan / USA / UK / China / France / Australia → India, with 6 flowing neon particles moving along each arc
- **3 satellite rings** at different tilts (0.4, -0.7, 1.2 rad) with glowing octahedron satellites orbiting at different speeds
- **2 particle stream fields** (80 particles at r=1.2 + 50 at r=1.8), slowly rotating
- **5 floating hexagonal panels** with pulsing opacity around the globe
- **2000 deep space stars** background
- **Interactive OrbitControls** — drag to rotate, scroll to zoom (1.8×–5×), auto-rotates slowly

### FloatingGeo (`FloatingGeo.jsx`)
- Dual rotating wireframe icosahedron + inner octahedron with `Float` bounce
- Particle field with neon green/cyan dots orbiting
- Used in the **"Beyond 2D Dashboards"** landing page section

### Landing Page Sections (in order)
1. **Hero** — Full-screen HeroGlobe3D with hex rain, parallax, floating HUD panels
2. **Stats Bar** — Animated counters: threats, escalation time, score, uptime
3. **Enterprise-Grade Defense** — 6 feature cards with hover depth effects
4. **Beyond 2D Dashboards** — FloatingGeo 3D + feature list with scroll reveals
5. **Command the Platform** — Terminal showcase with live preview panel
6. **Threat Response Pipeline** — 5-step NIST flow with animated connectors
7. **Architecture / Tech Stack** — Terminal-style tech display
8. **CTA** — Deploy DARKSHIELD button with glow

---

## 🔐 Register Page Revamp

The Register page now matches the Login page's split-panel cyberpunk design:

- **Left panel** — Progress ring showing how many fields are filled (0/4 → 4/4) with live step tracker
- **Right panel** — Form with neon focus glow, staggered Framer Motion field reveals
- **Back to Home** navigation link in top-left
- **Operator enrollment notes** — role assignment info panel at bottom
- Animated `⚡ DEPLOY OPERATOR` submit button

---

## 📁 New Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| SOC Terminal | `CyberTerminal.jsx` | Linux-style command centre in dashboard |
| Hero Globe | `HeroGlobe3D.jsx` | Full 3D attack globe for landing page hero |
| Floating Geometry | `FloatingGeo.jsx` | Animated wireframe 3D model for feature sections |

---

## 📜 Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 9091 | http://localhost:9091/api |
| MongoDB | 27017 | mongodb://localhost:27017 |

---

*© 2026 DARKSHIELD — Cyber Threat Intelligence Platform*
