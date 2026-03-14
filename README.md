# CoreInventory

CoreInventory is a full-stack inventory and warehouse operations platform.

It includes:
- A TypeScript + Express backend with Prisma + PostgreSQL
- A React + Vite frontend
- OTP-based signup and password reset flows
- Inventory operations (receipts, deliveries, transfers, adjustments)
- Dashboard, stock movement history, and role-based access features

## Repository Structure

```text
odoo_hackthon_project/
  project/
    backend/
    frontend/
```

## Tech Stack

### Backend
- Node.js (TypeScript, ES modules)
- Express
- Prisma ORM
- PostgreSQL
- Redis (optional, in-memory fallback supported)
- JWT authentication with refresh token cookie
- Zod validation
- Nodemailer / Resend for email

### Frontend
- React + TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Tailwind CSS + Radix UI
- Axios

## Prerequisites

Install these before setup:
- Node.js 20+ (recommended: latest LTS)
- npm 10+
- PostgreSQL 14+
- Redis 6+ (optional if `REDIS_ENABLED=false`)

## Quick Start

### 1) Clone and enter project

```bash
git clone <your-repo-url>
cd odoo_hackthon_project/project
```

### 2) Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 3) Configure environment variables

Create backend env file:

```bash
cd ../backend
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `project/backend/.env`.

Minimum required values:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/coreinventory
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false
PORT=4000
NODE_ENV=development

JWT_ACCESS_SECRET=<64-char-random-secret>
JWT_REFRESH_SECRET=<64-char-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=<32-char-random-secret>

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_real_email@gmail.com
SMTP_PASS=your_16_char_google_app_password
SMTP_FROM="CoreInventory <your_real_email@gmail.com>"

# Optional Resend
RESEND_API_KEY=
RESEND_FROM="CoreInventory <noreply@yourdomain.com>"
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OTP config
SIGNUP_OTP_EXPIRY_MINUTES=10
PASSWORD_RESET_OTP_EXPIRY_MINUTES=10
OTP_DEV_FALLBACK=false
SMTP_FALLBACK_ON_RESEND_ERROR=true
```

Notes:
- If your DB password contains special characters like `@`, URL-encode them in `DATABASE_URL`.
- If `EMAIL_PROVIDER=resend`, verify your Resend domain to send OTP to arbitrary emails.
- For most local setups, `EMAIL_PROVIDER=smtp` is easiest.

### 4) Create database schema

```bash
npm run db:push
```

### 5) Seed demo data

```bash
npm run db:seed
```

Default seeded admin account:
- Email: `admin@coreinventory.com`
- Password: `Admin@123`

### 6) Run backend

```bash
npm run dev
```

Backend URL:
- `http://localhost:4000`

### 7) Run frontend (new terminal)

```bash
cd ../frontend
npm run dev
```

Frontend URL:
- `http://localhost:5173`

The frontend proxies `/api` to `http://localhost:4000` by default.

## Available Scripts

### Backend (`project/backend`)
- `npm run dev` - Start backend in watch mode (tsx)
- `npm run build` - Compile TypeScript to `dist/`
- `npm run start` - Run compiled backend from `dist/`
- `npm run db:push` - Apply Prisma schema to DB
- `npm run db:seed` - Seed demo data
- `npm run db:studio` - Open Prisma Studio

### Frontend (`project/frontend`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check and build production bundle
- `npm run preview` - Preview production build

## API Base Path

Backend routes are mounted under:
- `/api/v1`

Main groups:
- `/api/v1/auth`
- `/api/v1/dashboard`
- `/api/v1/products`
- `/api/v1/warehouses`
- `/api/v1/operations`
- `/api/v1/move-history`

## OTP Flow Summary

### Signup
1. User submits signup details.
2. Backend generates OTP and sends email.
3. User verifies OTP.
4. Account is created and user is logged in.

### Forgot Password
1. User requests reset OTP by email.
2. User verifies OTP.
3. User sets new password.
4. Backend resets password and logs user in.

## Production Build

Backend:

```bash
cd project/backend
npm run build
npm run start
```

Frontend:

```bash
cd project/frontend
npm run build
npm run preview
```

## Troubleshooting

### Backend fails on startup
- Verify PostgreSQL is running.
- Verify `DATABASE_URL` is correct.
- Run `npm run db:push`.

### Port already in use
- Change backend `PORT` in `.env`.
- Change frontend dev port in `project/frontend/vite.config.ts` if needed.

### OTP not received
- If using Resend test sender, recipient restrictions apply.
- Use SMTP with valid `SMTP_USER` and `SMTP_PASS`.
- Check backend logs for email provider errors.

### Redis not running
- Set `REDIS_ENABLED=false` for local mode.
- App will use in-memory fallback for token/cache behavior.

## Security Notes

Before sharing or deploying:
- Rotate any exposed API keys and DB passwords.
- Never commit real secrets in `.env`.
- Use strong JWT and cookie secrets.

## License

This project currently has no explicit license file.
Add one if you plan to distribute it.
