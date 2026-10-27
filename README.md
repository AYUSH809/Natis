# NATIS Card Game (v1.0)

A multiplayer, team-based trick-taking card game with hidden trick suits, dynamic reveals, Joker mechanics, and the All-Hand gambit.

---

## 🐳 Running with Docker (Recommended for Multi-Laptop / Portable Use)

The project includes production-ready Docker containers with:
- **Backend**: Node.js 22 + SQLite with persistent volume for database storage (`natis-db-data`).
- **Frontend**: Nginx Alpine multi-stage build serving React and reverse-proxying WebSocket and REST API traffic.

### Quick Start:
```bash
# Build and run containers in background
docker compose up --build -d

# Check running status
docker compose ps

# View live logs
docker compose logs -f

# Stop containers
docker compose down
```

Once running:
- Open **`http://localhost:3005`** on your primary machine.
- From any other laptop on the same local Wi-Fi / network, open:
  ```
  http://<PRIMARY_LAPTOP_IP>:3005
  ```
  *(e.g., `http://10.240.40.240:3005`)*

---

## 💻 Running Without Docker (Direct Node.js)

### 1. Start Backend:
```bash
cd backend
npm install
npm run dev
```
*(Runs on port 4000)*

### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
*(Runs on port 3000 and listens on all network interfaces `--host`)*

---

## 📡 Accessing from Another Laptop on the Same Wi-Fi

1. On your host machine, find your Wi-Fi IPv4 address:
   - **Windows**: Run `ipconfig` in PowerShell/CMD (e.g. `10.240.40.240` or `192.168.1.X`).
   - **Mac/Linux**: Run `ifconfig` or `ip a`.
2. On your **other laptop**, open a browser and go to:
   ```
   http://<YOUR_HOST_IP>:3000
   ```
   Both laptops can now join the same lobby and play in real time!
