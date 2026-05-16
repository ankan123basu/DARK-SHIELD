# 🛡️ DarkShield Cyber Threat Intelligence Platform

![DarkShield Banner](https://img.shields.io/badge/Status-Active_Development-00e5ff?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_18_%7C_Spring_Boot_3_%7C_MongoDB-282c34?style=for-the-badge)
![AI Integrations](https://img.shields.io/badge/AI_Engine-AEGIS__PRIME_(Llama_3.3_70B)-ff003c?style=for-the-badge)

<div align="center">
  <h1 style="color: #00e5ff; font-family: 'Orbitron', sans-serif;">🛡️ DARKSHIELD</h1>
  <h3>Immersive Cybersecurity Operations Center (SOC)</h3>
  <p>An elite, high-fidelity Cyber Threat Intelligence (CTI) and Digital Forensics platform engineered for enterprise-grade incident response. It features real-time WebSocket communication, live global threat tracking, and is powered by <strong>AEGIS-PRIME</strong>, an omniscient AI Security Analyst.</p>
</div>

<p align="center">Created by <b>Ankan Basu</b> (Expert Java Full Stack Developer & Cybersecurity Architect).</p>

<img width="1918" height="957" alt="image" src="https://github.com/user-attachments/assets/623ff8a4-9ff9-47be-ab73-5bf06c3efac6" />

---

## 🚀 Recent Updates (Latest Mission)

### 1. 🧠 AEGIS-PRIME Integration
- **Upgraded AI Engine:** Migrated to Groq's cutting-edge `llama-3.3-70b-versatile` model.
- **Omniscient Database Knowledge:** AEGIS-PRIME now actively scans the live MongoDB database to pull real-time global statistics, active threats, open incidents, and compromised assets (with MITRE ATT&CK tags and IOCs).
- **Fine-Tuned Personality:** AEGIS-PRIME recognizes its creator and responds to casual conversation, mock commands, and complex cybersecurity queries without breaking character or leaking markdown formatting.

### 2. 🌐 SOC Comms & Live Multilingual Translation
- **Real-Time Groq Translation:** Integrated a new `TranslationController` allowing 17-language live translation for SOC analysts around the globe.
- **AI Channel Summarization:** Added a one-click intel brief generation to instantly summarize long chat channels using AEGIS-PRIME.

### 3. 🎨 Immersive 3D UI Overhaul (Frontend)
- **3D Cyber Background:** The chat interface now features a massive, rotating 3D wireframe globe overlaying an infinite scrolling matrix grid with floating cyber particles.
- **Sidebar Cyber Core:** Embedded a CSS-powered, continuously rotating 3D reactor core in the navigation sidebar.
- **Responsive Emoji Engine:** Re-architected the emoji picker with a dynamic flex-wrap grid to prevent container overflow on different resolutions.

---

## 🛠️ Technology Stack
- **Frontend:** React 18, Vite, Framer Motion, Axios, TailwindCSS / Custom CSS Glassmorphism
- **Backend:** Java 26, Spring Boot 4.0.x, Spring Security (JWT), Spring WebSockets (STOMP)
- **Database:** MongoDB (Local)
- **AI Integration:** Groq API (Llama 3.3 70B) via custom Spring `RestTemplate` service

---

## ⚙️ Getting Started

### Backend Setup
```bash
cd darkshield-backend
# Ensure MongoDB is running on localhost:27017
# Configure .env or application.properties with your GROQ_API_KEY
mvn spring-boot:run
```

### Frontend Setup
```bash
cd darkshield-frontend
npm install
npm run dev
```

The application will be live at `http://localhost:5173`.
