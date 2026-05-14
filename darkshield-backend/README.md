# 🛡️ DARKSHIELD — Cyber Threat Intelligence & Digital Forensics Platform

> Real-time threat detection, automated incident response, and 3D attack visualization for next-generation security operations.

---

## 📋 Prerequisites

| Tool | Version | How to Check |
|------|---------|-------------|
| **Java** | 17+ (you have 26) | `java -version` |
| **Maven** | 3.8+ | `mvn -version` |
| **MongoDB** | 7.x (local via Compass) | Already running on `localhost:27017` |
| **Node.js** | 18+ | `node -v` |
| **npm** | 9+ | `npm -v` |

---

## 🚀 How to Run

### Step 1: Start MongoDB
> You already have MongoDB installed with Compass. Make sure the **mongod** service is running.
> Open MongoDB Compass and verify connection to `mongodb://localhost:27017`

### Step 2: Start Backend (Spring Boot)
```bash
cd d:\SpringBootProj\darkshield-backend
mvn spring-boot:run
```
- Backend runs on **http://localhost:9091**
- On first startup, the **DataSeeder** automatically populates the database with:
  - 3 users (admin, hunter, analyst)
  - 10 realistic cyber threats with geolocation data
  - 4 security incidents
  - 7 network assets
- Check MongoDB Compass → database `darkshield_db` to see the seeded collections

### Step 3: Start Frontend (React + Vite)
```bash
cd d:\SpringBootProj\darkshield-frontend
npm install    # only needed first time
npm run dev
```
- Frontend runs on **http://localhost:5173**
- Open this URL in your browser

---

## 🔐 Demo Credentials

| Username | Password | Role | Access Level |
|----------|----------|------|-------------|
| `admin` | `admin123` | ADMIN | Full access — user management, all CRUD, delete |
| `hunter` | `hunter123` | HUNTER | Escalate/resolve incidents, all CRUD |
| `analyst` | `analyst123` | ANALYST | View/create threats, incidents, assets |

---

## 🏗️ Project Architecture

```
darkshield-backend/                    ← Spring Boot 4.0 + Java 26
├── src/main/java/com/darkshield/
│   ├── DarkshieldApplication.java     ← Main entry point
│   ├── config/
│   │   ├── SecurityConfig.java        ← Spring Security + JWT filter chain
│   │   ├── CorsConfig.java            ← CORS for React frontend
│   │   ├── MongoConfig.java           ← MongoDB auditing
│   │   └── DataSeeder.java            ← Auto-seeds sample data on first run
│   ├── security/
│   │   ├── JwtTokenProvider.java      ← JWT generation/validation
│   │   ├── JwtAuthenticationFilter.java ← Bearer token interceptor
│   │   ├── CustomUserDetailsService.java ← MongoDB → Spring Security bridge
│   │   └── JwtAuthEntryPoint.java     ← Custom 401 JSON response
│   ├── model/                         ← MongoDB @Document entities
│   │   ├── User.java
│   │   ├── Threat.java                ← IOCs, MITRE ATT&CK, geolocation
│   │   ├── Incident.java             ← NIST lifecycle, timeline
│   │   ├── Asset.java                ← Risk scoring, vulnerabilities
│   │   ├── AuditLog.java             ← Forensic audit trail
│   │   └── enums/                    ← 8 enum files (Role, ThreatType, etc.)
│   ├── dto/                          ← Request/Response DTOs with validation
│   ├── repository/                   ← Spring Data MongoDB repositories
│   ├── service/
│   │   ├── ThreatScoringEngine.java  ← ★ Custom multi-factor scoring algorithm
│   │   ├── AutoEscalationService.java ← ★ Auto-creates P1 incidents
│   │   ├── AuthService.java          ← Registration, login, token refresh
│   │   ├── ThreatService.java        ← CRUD + auto-score + auto-escalate
│   │   ├── IncidentService.java      ← CRUD + NIST lifecycle management
│   │   ├── AssetService.java         ← CRUD + risk scoring
│   │   ├── DashboardService.java     ← Aggregated SOC metrics
│   │   └── AuditLogService.java      ← Forensic logging
│   ├── controller/                   ← 6 REST controllers (Spring MVC)
│   └── exception/                    ← Global exception handler

darkshield-frontend/                   ← React 18 + Vite
├── src/
│   ├── App.jsx                       ← Routing + auth protection
│   ├── index.css                     ← Cyberpunk design system
│   ├── api/axios.js                  ← Axios + JWT interceptors
│   ├── context/AuthContext.jsx       ← Auth state management
│   ├── components/
│   │   ├── CyberGlobe.jsx           ← ★ 3D globe with attack arcs (Three.js)
│   │   ├── CursorEffect.jsx         ← ★ Custom neon cursor trail
│   │   └── Sidebar.jsx              ← Navigation with role display
│   └── pages/
│       ├── LandingPage.jsx           ← 3D hero + parallax + Framer Motion
│       ├── LoginPage.jsx             ← Glassmorphism login
│       ├── RegisterPage.jsx          ← New operator registration
│       ├── DashboardPage.jsx         ← Stats + globe + recent activity
│       ├── ThreatsPage.jsx           ← Full CRUD + severity filter
│       ├── IncidentsPage.jsx         ← CRUD + escalation + resolution
│       └── AssetsPage.jsx            ← CRUD + risk scores + status
```

---

## 🌐 API Endpoints

### Auth (Public — no JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → get JWT tokens |
| POST | `/api/auth/refresh` | Refresh expired access token |

### Threats (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/threats` | List all threats |
| POST | `/api/threats` | Create threat (auto-scored) |
| GET | `/api/threats/{id}` | Get by ID |
| PUT | `/api/threats/{id}` | Update (score recalculated) |
| DELETE | `/api/threats/{id}` | Delete |
| GET | `/api/threats/severity/{level}` | Filter by CRITICAL/HIGH/MEDIUM/LOW/INFO |
| GET | `/api/threats/active` | Non-mitigated threats |
| GET | `/api/threats/recent` | Latest 10 |
| GET | `/api/threats/top-scoring` | Highest scored 10 |

### Incidents (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List all |
| POST | `/api/incidents` | Create incident |
| PUT | `/api/incidents/{id}` | Update |
| PUT | `/api/incidents/{id}/escalate` | Escalate severity (HUNTER+) |
| PUT | `/api/incidents/{id}/resolve` | Resolve & close (HUNTER+) |
| DELETE | `/api/incidents/{id}` | Delete (ADMIN only) |

### Assets (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List all |
| POST | `/api/assets` | Register asset |
| PUT | `/api/assets/{id}` | Update |
| DELETE | `/api/assets/{id}` | Delete (ADMIN only) |
| GET | `/api/assets/high-risk` | Risk score ≥ 70 |

### Dashboard (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Aggregated SOC statistics |
| GET | `/api/dashboard/threat-timeline` | Recent threat data |
| GET | `/api/dashboard/top-threats` | Top scoring threats |

### Users (ADMIN only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PUT | `/api/users/{id}/role` | Change user role |
| DELETE | `/api/users/{id}` | Delete user |

---

## ⭐ Key Backend Features

### 1. Threat Scoring Engine (`ThreatScoringEngine.java`)
Multi-factor composite scoring algorithm (0–100):
```
threatScore = baseScore(severity)        → 0-40 pts
            + typeMultiplier(threatType)  → 0-25 pts
            + recencyBonus(detectedAt)    → 0-15 pts
            + indicatorCount(IOCs)        → 0-10 pts
            + mitreAttackWeight(ATT&CK)   → 0-10 pts
```

### 2. Auto-Escalation Service (`AutoEscalationService.java`)
- Threats scoring ≥ 75 automatically generate **P1 incidents**
- Links the incident to the originating threat
- Adds timeline entry: "Auto-escalated by SYSTEM"
- Logs to forensic audit trail

### 3. Incident Lifecycle (NIST Framework)
`OPEN → INVESTIGATING → CONTAINMENT → ERADICATION → RECOVERY → CLOSED`

### 4. Audit Trail (`AuditLogService.java`)
Every CREATE, UPDATE, DELETE, LOGIN, ESCALATE action is logged with user, timestamp, and details.

### 5. Role-Based Access Control
- **@PreAuthorize** annotations on controller methods
- JWT filter validates every request
- Roles: `ROLE_ANALYST` < `ROLE_HUNTER` < `ROLE_ADMIN`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 4.0, Java 26, Maven |
| Security | Spring Security 7, JWT (jjwt 0.12) |
| Database | MongoDB 7 (local via Compass) |
| Architecture | Spring MVC (REST Controllers) |
| Frontend | React 18, Vite |
| 3D | Three.js, React Three Fiber, Drei |
| Animations | Framer Motion |
| HTTP | Axios with JWT interceptors |
| Styling | Vanilla CSS (Cyberpunk/Glassmorphism) |

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | Change `server.port` in `application.properties` and update `axios.js` |
| MongoDB connection refused | Open Compass → ensure connected to `localhost:27017` |
| Lombok errors on compile | Ensure `lombok.version=1.18.38` in pom.xml for Java 26 |
| JWT expired | Login again or use the refresh token endpoint |
| CORS error in browser | Check `CorsConfig.java` has your frontend port listed |

---

## 📦 Reset Database
To re-seed fresh data, drop the database in MongoDB Compass:
1. Open Compass → Connect to `localhost:27017`
2. Right-click `darkshield_db` → Drop Database
3. Restart the backend — DataSeeder will re-populate everything
