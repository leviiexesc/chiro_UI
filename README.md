# Chiro UI — Enterprise License Center

A production-grade, full-stack License Management and Hardware-ID (HWID) Locking system built for **Chiro UI** and Roblox Luau script executors.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

---

## 🌟 Overview & Features

- **Full-Stack Architecture**: Express + TypeScript backend serving both the REST API and the pre-built Cyber React 18 Admin Dashboard.
- **Cryptographic Keys**: Generates secure, unguessable license keys in the standard format `CHIRO-XXXX-XXXX-XXXX` using CSPRNG.
- **Hardware-ID (HWID) Locking**: Enforces hardware concurrency limits per license key (e.g. 1 device, 2 devices, lifetime VIP slots).
- **Single-Click HWID Reset**: Allows administrators (or users via self-service) to reset hardware locks and re-bind fresh executors.
- **Revocation & Expiration**: Real-time invalidation of leaked, shared, or expired keys with instant lockout across all active clients.
- **Luau Client SDK**: Drop-in Roblox Luau script integration that connects through `request`/`http_request`/`HttpService`.
- **Cyber Dashboard UI**: High-polish dark/light/system theme, responsive layout, real-time telemetry metrics, batch key generator, and audit trail logs.
- **Render.com Deployment**: Includes `render.yaml` infrastructure-as-code for 1-click cloud deployment with PostgreSQL.

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js (ESM), Express 4, TypeScript 5, Zod validation, Helmet, CORS, Rate Limiters |
| **Database & ORM** | PostgreSQL, Prisma ORM 6 (Migrations & Automated Seeding) |
| **Authentication** | JWT (JSON Web Tokens with 7-day expiry), Bcrypt password hashing (12 salt rounds) |
| **Frontend Admin** | React 18, Vite 6, Tailwind CSS, Lucide Icons, Glassmorphism, Theme Context |
| **Client Support** | Roblox Luau (`HttpService` / Executor `request` / `http_request`) |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ (Tested on Node v20 & v22)
- PostgreSQL database running locally or hosted (e.g., Supabase, Neon, Render)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/leviiexesc/chiro_UI.git
cd chiro_UI

# Install server & root dependencies
npm install

# Install dashboard dependencies
npm --prefix client install
```

### 3. Environment Configuration
Copy the example `.env` file:
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chiro_db?schema=public"
JWT_SECRET="your_secure_random_jwt_secret_at_least_32_chars"
ADMIN_SESSION_SECRET="your_secure_random_session_secret_at_least_32_chars"
CORS_ORIGIN="*"
NODE_ENV="development"
PORT=10000

INITIAL_ADMIN_USERNAME=""
INITIAL_ADMIN_EMAIL=""
INITIAL_ADMIN_PASSWORD=""
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial admin account & default products
npm run prisma:seed
```

### 5. Run Development Servers
```bash
# Run backend API and frontend Vite server concurrently
npm run dev
```
Open **`http://localhost:5173`** for the dashboard or **`http://localhost:10000/api/v1/health`** for the API health check.

---

## ☁️ Deployment to Render.com

This project includes a complete [`render.yaml`](./render.yaml) Blueprint definition for seamless deployment.

### Step-by-Step Instructions:
1. Fork or push this repository to your GitHub account (`leviiexesc/chiro_UI`).
2. Log into [Render.com](https://dashboard.render.com).
3. Click **Blueprints** → **New Blueprint Instance**.
4. Connect your `chiro_UI` GitHub repository.
5. Render will detect `render.yaml` and provision:
   - **PostgreSQL Database** (`chiro-postgres-db`)
   - **Web Service** (`chiro-license-api`)
6. Add the following environment variables in the Render dashboard:
   - `JWT_SECRET`: Random 32+ character secret string.
   - `ADMIN_SESSION_SECRET`: Random 32+ character secret string.
   - `INITIAL_ADMIN_PASSWORD`: Strong password for your initial administrator account.
7. Click **Apply**. Render will automatically:
   - Install dependencies.
   - Build the frontend Vite dashboard (`npm --prefix client run build`).
   - Run Prisma database migrations (`npx prisma migrate deploy`).
   - Seed the initial admin account (`npx tsx prisma/seed.ts`).
   - Start the unified Express server.

---

## 📡 API Endpoints Reference

### Standard Error Response Format
All error responses strictly adhere to:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_LICENSE",
    "message": "The license key is invalid."
  }
}
```

### Public Client Endpoints (Luau / Roblox)
Rate-limited to 60 requests per minute per IP.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/client/verify` | Verify if a license key is valid, unrevoked, and matches HWID. |
| `POST` | `/api/v1/client/activate` | Bind HWID to a license slot on first run. |
| `POST` | `/api/v1/client/reset-hwid` | Self-service reset of bound HWIDs (if enabled). |

### Protected Admin Endpoints (Requires `Bearer <JWT>`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Admin login returning JWT token. |
| `GET` | `/api/v1/auth/me` | Fetch authenticated admin details. |
| `POST` | `/api/v1/auth/change-password` | Update admin master password. |
| `GET` | `/api/v1/licenses/stats` | Telemetry stats (totals, active, devices, audit). |
| `GET` | `/api/v1/licenses` | Paginated licenses list with search & status filters. |
| `POST` | `/api/v1/licenses` | Generate a single license key. |
| `POST` | `/api/v1/licenses/batch` | Batch generate up to 500 licenses at once. |
| `POST` | `/api/v1/licenses/:id/reset-hwid` | Admin reset bound HWIDs for a license. |
| `POST` | `/api/v1/licenses/:id/revoke` | Revoke a license key immediately. |
| `POST` | `/api/v1/licenses/:id/unrevoke` | Restore a revoked license. |
| `DELETE` | `/api/v1/licenses/:id` | Permanently delete a license. |
| `GET` | `/api/v1/products` | List all script products / suites. |
| `POST` | `/api/v1/products` | Create a new product. |
| `GET` | `/api/v1/devices` | View all registered hardware IDs and sessions. |
| `DELETE` | `/api/v1/devices/:id` | Unbind a single hardware device from its license. |
| `GET` | `/api/v1/audit-logs` | Immutable administrative audit log trail. |

---

## 💻 Connecting Chiro UI (Luau Script Integration)

Paste this snippet into your Chiro UI loader or script hub:

```lua
-- ===================================================
-- Chiro UI - License Verification & HWID Binding
-- ===================================================
local HttpService = game:GetService("HttpService")
local RbxAnalyticsService = game:GetService("RbxAnalyticsService")

local API_BASE = "https://your-license-center.onrender.com/api/v1/client"
local LICENSE_KEY = "CHIRO-XXXX-XXXX-XXXX" -- Replaced by user input
local CLIENT_HWID = RbxAnalyticsService:GetClientId()

local function makeRequest(endpoint, payload)
    local httpRequest = (syn and syn.request) or (http and http.request) or http_request or request
    local body = HttpService:JSONEncode(payload)
    
    if httpRequest then
        local response = httpRequest({
            Url = API_BASE .. endpoint,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = body
        })
        return HttpService:JSONDecode(response.Body)
    else
        -- Fallback for standard Roblox Studio environment
        local responseText = HttpService:PostAsync(API_BASE .. endpoint, body, Enum.HttpContentType.ApplicationJson)
        return HttpService:JSONDecode(responseText)
    end
end

-- 1. Try to verify license
local verifyResult = makeRequest("/verify", {
    key = LICENSE_KEY,
    hwid = CLIENT_HWID
})

if verifyResult.success then
    print("[Chiro UI] License verified! Welcome back.")
    -- Load your main Chiro UI script here
else
    -- If key is unused or device not bound yet, attempt activation
    if verifyResult.error and verifyResult.error.code == "DEVICE_LIMIT_EXCEEDED" then
        warn("[Chiro UI] Max device limit reached for this key. Please reset your HWID.")
        return
    end

    local activateResult = makeRequest("/activate", {
        key = LICENSE_KEY,
        hwid = CLIENT_HWID
    })

    if activateResult.success then
        print("[Chiro UI] Device successfully bound and activated!")
        -- Load your main Chiro UI script here
    else
        warn("[Chiro UI] Activation failed: " .. (activateResult.error and activateResult.error.message or "Unknown error"))
    end
end
```

---

## 🔒 Security & Best Practices

1. **Keep Secrets Private**: Never commit `.env` or paste your `JWT_SECRET` in public repositories.
2. **Rotate Tokens**: Change your default admin password immediately on the **Settings** page after initial deployment.
3. **CORS Isolation**: In production, restrict `CORS_ORIGIN` in `.env` to your exact dashboard domain.
4. **Hardwareconcurrency**: Hardware limits are checked on both `/verify` and `/activate` to strictly prevent license sharing across users.

---

## 📄 License
MIT License — Chiro UI Project.
