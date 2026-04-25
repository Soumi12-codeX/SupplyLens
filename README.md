# SupplyLens 🚛

> **AI-Powered Supply Chain Intelligence Platform**  
> Real-time disruption detection, automated driver assignment, and dynamic route optimization — built for the Google Solutions Challenge.

![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-green?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?style=flat-square&logo=postgresql)
![Python](https://img.shields.io/badge/Python-AI%20Service-yellow?style=flat-square&logo=python)
![Gemini](https://img.shields.io/badge/Gemini-AI-purple?style=flat-square&logo=google)

---

## 🌐 What is SupplyLens?

SupplyLens is an AI-powered logistics intelligence engine that detects supply chain disruptions before they cascade into delays. When a strike, flood, or accident hits a logistics node, SupplyLens automatically:

- Scrapes real-time news via News API
- Analyzes risk using Google Gemini AI
- Calculates 3 alternate route options with tradeoffs
- Pushes instant WebSocket alerts to the admin dashboard
- Auto-assigns the nearest available driver using Haversine geospatial algorithm
- Notifies the driver with the new route in real time

> **"Most logistics apps tell you when something is late. SupplyLens tells you it will be late — before the truck even leaves."**

---

## 🎯 Problem Statement

Supply chains are fragile. A single disruption — a port strike, a road closure, a flash flood — can cascade into days of delays across hundreds of shipments. Traditional logistics systems are **reactive**, not **proactive**.

SupplyLens solves this with a **predictive domino-effect analyzer** that sees the ripple before it happens.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PYTHON AI SERVICE                     │
│  News API → Gemini Analysis → Risk Score                 │
│  → Graph-based node impact → 3 Route Options             │
│  → POST /api/alerts/from-python (automated)              │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND (Java)                  │
│                                                          │
│  ✅ JWT Authentication (Role-based: ADMIN / DRIVER)      │
│  ✅ WebSocket real-time alert push                       │
│  ✅ Haversine nearest-driver auto-assignment             │
│  ✅ Route selection & shipment rerouting                 │
│  ✅ Live GPS tracking via driver pings                   │
│  ✅ Google Maps deep-link generation for drivers         │
│  ✅ PostgreSQL persistence                               │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                  REACT FRONTEND (Vite)                   │
│                                                          │
│  Admin Dashboard  → Live map, alerts, route selection    │
│  Driver Interface → Assigned shipments, GPS, delivery    │
│  Leaflet Maps     → Real-time truck tracking             │
│  GSAP + Framer    → Smooth animations                    │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI-Powered Alert System
- Python service scrapes News API every 30 minutes automatically
- Google Gemini performs Named Entity Recognition on news articles
- Risk score calculated per logistics node
- 3 route alternatives generated with tradeoffs: **Safe but Slow**, **Balanced**, **Fast but Risky**

### ⚡ Real-Time WebSocket Alerts
- Admin dashboard receives disruption alerts **instantly** — no page refresh
- Each alert shows: affected node, severity, estimated delay hours, and route options
- Admin clicks **Approve** or **Dismiss** — driver gets updated route immediately

### 📍 Smart Driver Assignment
- Haversine formula calculates distance between warehouse and all available drivers
- Nearest driver within 200km radius gets auto-assigned
- Driver marked unavailable during trip, available again after delivery
- On boot: unassigned shipments automatically matched to available drivers

### 🗺️ Live Fleet Tracking
- Drivers ping GPS location every 15 seconds
- Admin map updates in real time via WebSocket `/topic/location/{driverId}`
- Transport search: admin can look up any truck by ID and see its live location + active shipments

### 🔐 Security
- JWT authentication with 24-hour expiry
- Role-based access: `ADMIN` and `DRIVER` roles enforced at every endpoint
- BCrypt password & PIN encoding
- Stateless session management

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Leaflet, Framer Motion, GSAP |
| Backend | Java 17, Spring Boot 3.3.5, Spring Security, WebSocket (STOMP) |
| Database | PostgreSQL 18, Spring Data JPA, Hibernate |
| AI Service | Python, FastAPI, Google Gemini API, News API, NetworkX |
| Auth | JWT (jjwt), BCrypt |
| Real-time | SockJS, STOMP WebSocket |
| Maps | Leaflet.js, React-Leaflet, Google Maps Deep Links |

---

## 📁 Project Structure

```
SupplyLens/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/           # Admin dashboard, fleet, alerts
│   │   │   └── driver/          # Driver interface
│   │   ├── components/
│   │   │   ├── Map/             # Leaflet map components
│   │   │   └── AINotification/  # Real-time alert popups
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT auth state
│   │   └── services/
│   │       ├── api.js           # Axios with interceptors
│   │       └── websocket.js     # STOMP WebSocket client
│
├── src/                         # Spring Boot backend
│   └── main/java/com/web/backend_SupplyLens/
│       ├── controller/          # REST endpoints
│       ├── service/             # Business logic
│       ├── model/               # JPA entities
│       ├── repository/          # Spring Data repos
│       ├── security/            # JWT filter, config
│       └── dto/                 # Data transfer objects
│
└── python-ai/                   # Python AI microservice
    ├── main.py                  # FastAPI app
    ├── news_scraper.py          # News API integration
    ├── gemini_analyzer.py       # Gemini risk scoring
    └── route_optimizer.py       # Graph-based routing
```

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 18
- Python 3.10+
- Maven

### 1. Database Setup

```sql
CREATE DATABASE supply_chain_db;

-- Seed warehouses (run once)
INSERT INTO warehouse (name, city, latitude, longitude) VALUES
('Mumbai Central Warehouse', 'Mumbai', 19.0760, 72.8777),
('Delhi North Warehouse', 'Delhi', 28.7041, 77.1025),
('Chennai South Warehouse', 'Chennai', 13.0827, 80.2707),
('Kolkata East Warehouse', 'Kolkata', 22.5726, 88.3639),
('Bangalore Tech Warehouse', 'Bangalore', 12.9716, 77.5946);
```

### 2. Backend Setup

```bash
# Clone repo
git clone https://github.com/Soumi12-codeX/SupplyLens.git
cd SupplyLens

# Configure database in src/main/resources/application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/supply_chain_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update

# Run backend
mvn spring-boot:run
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. Python AI Service Setup

```bash
cd python-ai
pip install -r requirements.txt
python main.py
# Runs at http://localhost:5000
# Automatically scans news every 30 minutes
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register admin or driver |
| POST | `/api/auth/admin/login` | Admin login → JWT |
| POST | `/api/auth/driver/login` | Driver login → JWT |

### Alerts (Python → Spring Boot)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/alerts/from-python` | None | Python posts alert with route options |
| GET | `/api/alerts/all` | ADMIN | Fetch all alerts |
| POST | `/api/alerts/{id}/select-route/{routeId}` | ADMIN | Admin selects route |
| POST | `/api/alerts/{id}/dismiss` | ADMIN | Dismiss alert |

### Shipments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/shipments/create?warehouseId={id}` | ADMIN | Create shipment + auto-assign driver |
| POST | `/api/shipments/{id}/delivered` | DRIVER | Mark shipment delivered |

### Driver
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/driver/location` | DRIVER | Send live GPS location |
| GET | `/api/driver/location/{driverId}` | ADMIN | Get driver live location |
| GET | `/api/driver/shipments/{driverId}` | DRIVER | Get assigned shipments |
| POST | `/api/driver/shipments/{id}/start` | DRIVER | Start trip |
| GET | `/api/driver/my-route-link` | DRIVER | Get Google Maps link for route |

### Transport
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/transport/create` | ADMIN | Register a transport |
| GET | `/api/transport/search/{transportId}` | ADMIN | Search transport + live location |
| POST | `/api/transport/{id}/assign-route/{routeOptionId}` | ADMIN | Assign route to transport |

### Warehouse
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/warehouse/all` | None | Get all warehouses (for registration) |

---

## 🔄 System Flow

```
1. SETUP
   Warehouses pre-seeded in DB → Admin registers (links to warehouse)
   Driver registers (driverId + PIN) → Both login → JWT issued

2. OPERATIONS
   Driver sends GPS location every 15s
   Admin creates shipment → System finds nearest driver (Haversine)
   Driver auto-assigned → Sees shipment on their dashboard
   Driver starts trip → Marks delivered when done

3. AI ALERT FLOW
   Python scrapes news (every 30 mins)
   → Gemini scores risk → Calculates 3 route options
   → POST /api/alerts/from-python
   → Spring saves alert (PENDING)
   → WebSocket pushes to admin dashboard instantly
   → Admin sees alert with tradeoffs → Selects route
   → All affected shipments updated → Driver sees REROUTED status
   → Driver follows new Google Maps deep link
```

---

## 👥 Team

| Name | Role |
|---|---|
| Soumi Das | Leader : Backend Developer + AI Service [![GitHub](https://img.shields.io/badge/GitHub-black?style=flat-square&logo=github)](https://github.com/Soumi12-codeX)|
| Sudipta Maity | Frontend Developer [![GitHub](https://img.shields.io/badge/GitHub-black?style=flat-square&logo=github)](https://github.com/Sudiptaa03) |
| Arka Roy | Frontend Developer [![GitHub](https://img.shields.io/badge/GitHub-black?style=flat-square&logo=github)](https://github.com/Arka-ui001)|
| Aritro Dhuan | AI Service [![GitHub](https://img.shields.io/badge/GitHub-black?style=flat-square&logo=github)](https://github.com/aritra-dhuan)|

---

## 🏆 Built For

**Google Solutions Challenge** — Smart Supply Chains: Resilient Logistics and Dynamic Optimization

---

