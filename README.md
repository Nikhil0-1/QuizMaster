# QuizMaster Pro — Smart Anti-Cheating Quiz System

> A production-ready, full-stack real-time quiz platform combining React/Vite frontend, Firebase backend, and ESP32 hardware devices.

![Firebase](https://img.shields.io/badge/Firebase-RTDB+Auth-orange?style=flat-square) ![ESP32](https://img.shields.io/badge/Hardware-ESP32-green?style=flat-square) ![React](https://img.shields.io/badge/React-Vite-blue?style=flat-square)

---

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project
2. Enable **Authentication** (Email/Password)
3. Create a **Realtime Database** (start in test mode)
4. Copy your config from Project Settings → Your apps → Web app

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env and fill in your Firebase config values
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open: http://localhost:5173/sacq

---

## 📁 Project Structure

```
e:/sacq/
├── src/
│   ├── firebase/          # Auth, RTDB, Firestore services
│   ├── engines/           # Timer, Validator, Scoring, Ranking, Analytics
│   ├── store/             # Zustand state management
│   ├── pages/
│   │   ├── LoginPage.jsx  # Admin login
│   │   ├── admin/         # Dashboard, Questions, Monitor, Leaderboard, Export
│   │   ├── display/       # Fullscreen smartboard
│   │   └── analytics/     # Performance analytics
│   ├── components/        # GlassCard, CircularTimer, DeviceStatus, Skeleton
│   └── demo/              # Demo data generator
├── esp32/
│   ├── student_device/    # Arduino sketch for student devices
│   └── gateway/           # Arduino sketch for WiFi gateway
└── .env.example
```

---

## 🌐 Routes

| URL | Description | Auth |
|-----|-------------|------|
| `/login` | Admin login | Public |
| `/admin` | Admin dashboard | ✅ Required |
| `/display` | Smartboard view | Public |
| `/analytics` | Analytics engine | ✅ Required |

---

## 🔷 System Modules

### Admin Panel (`/admin`)
- **Session Controls**: Start, Pause, Resume, End, Next Question, Auto Mode toggle, Reset
- **Question Manager**: Add/Edit/Delete questions, bulk JSON/CSV upload
- **Live Monitor**: Real-time response tracking with option distribution bars
- **Leaderboard**: Auto-computed live rankings (score + speed tiebreaker)
- **Device Status**: ESP32 online/offline heartbeat monitoring
- **Export**: Download results as PDF or CSV (questions too)

### Smartboard Display (`/display`)
- Animated question transitions (Framer Motion)
- SVG circular countdown timer (synced from Firebase startTime)
- Live Chart.js bar chart of response distribution
- Option vote progress bars
- Correct answer reveal after timer
- ⚡ Fastest responder badge

### Analytics (`/analytics`)
- Per-question accuracy and difficulty (hard/medium/easy)
- Score distribution doughnut chart
- Auto-generated insights ("Most students failed Q3")
- Student performance table with progress bars

---

## ⚙️ Core Engines

| Engine | Logic |
|--------|-------|
| **Timer** | `responseTime = Date.now() - startTime` synced across all clients |
| **Validator** | Rejects: duplicate, wrong question ID, post-timer submissions |
| **Scoring** | Correct +10, Speed bonus (+5/+3/+1 for top-3 fastest), configurable negative marking |
| **Ranking** | Score DESC → avgTime ASC (fastest wins ties) |
| **Analytics** | Accuracy%, difficulty detection, auto insight generation |

---

## 📡 ESP32 Hardware Setup

### Student Device (`esp32/student_device/`)

**Hardware required per device:**
- ESP32 DevKit v1
- SSD1306 OLED 128×64 (I2C: SDA=21, SCL=22)
- 4 push buttons on GPIO 12 (A), 13 (B), 14 (C), 15 (D)
- 10kΩ pull-up resistors

**Libraries needed (Arduino Library Manager):**
- `Adafruit SSD1306`
- `Adafruit GFX Library`

**Setup steps:**
1. Open `esp32/student_device/student_device.ino`
2. Replace `GATEWAY_MAC` with your gateway device's MAC address
3. Flash to each ESP32 student device

### Gateway (`esp32/gateway/`)

**Setup steps:**
1. Open `esp32/gateway/gateway.ino`
2. Fill in `SSID`, `WIFI_PASS`, `FIREBASE_URL`, `FIREBASE_SECRET`
3. Add student device MACs to `STUDENT_MACS[]`
4. Flash to the gateway ESP32

### Data Flow
```
Admin updates question (Firebase)
    → Gateway polls Firebase every 2s
    → Gateway broadcasts via ESP-NOW
    → Student devices receive question number
    → Student presses A/B/C/D button
    → Device sends answer via ESP-NOW
    → Gateway HTTP POST to Firebase
    → Website updates in real-time
```

---

## 📋 Bulk Upload Formats

### JSON
```json
[
  {
    "text": "What is the capital of France?",
    "options": ["Berlin", "Paris", "London", "Rome"],
    "correctAnswer": "B",
    "timer": 30
  }
]
```

### CSV
```csv
text,A,B,C,D,correct,timer
What is the capital of France?,Berlin,Paris,London,Rome,B,30
```

---

## 🚀 Deploy to GitHub Pages

```bash
npm install -g gh-pages
npm run build
npx gh-pages -d dist
```

Visit: `https://YOUR_USERNAME.github.io/sacq`

---

## 🔐 Firebase Security Rules

```json
{
  "rules": {
    "quizSession": { ".read": true, ".write": "auth !== null" },
    "questions": { ".read": true, ".write": "auth !== null" },
    "responses": {
      "$qId": {
        "$studentId": {
          ".read": "auth !== null",
          ".write": "!data.exists()"
        }
      }
    },
    "results": { ".read": true, ".write": "auth !== null" },
    "devices": { ".read": "auth !== null", ".write": true }
  }
}
```

---

## 🎯 Anti-Cheating Features

| Feature | Implementation |
|---------|----------------|
| One answer per question | Firebase rule: `".write": "!data.exists()"` |
| Late response rejection | Client-side timer validation before submit |
| Duplicate detection | Validator checks existing responses map |
| Wrong question rejection | Submitted qId must match `session.currentQ` |
| Device ID lock | Unique MAC-based ID per ESP32 |

---

MIT License — QuizMaster Pro © 2026
