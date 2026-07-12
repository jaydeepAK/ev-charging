# EV Charging Management System

A full-stack platform for managing EV charging stations — customers browse and book charging slots, station owners manage their stations and chargers, and admins approve stations and monitor platform activity in real time.

**Live demo:** https://ev-charging-indol.vercel.app/
**API:** https://ev-charging-aio3.onrender.com

---

## Features

- **JWT authentication** with three roles (Customer, Station Owner, Admin) and role-based route protection on both the API and the frontend
- **Station & charger management** — owners register stations (pending admin approval) and manage chargers with live status (Available / In Use / Offline)
- **Booking system** with overlap/conflict detection per charger
- **Charging session lifecycle** — start/stop with computed energy usage, duration, and cost
- **Mock payment flow** — a stubbed payment gateway that mirrors a real Stripe/Razorpay integration (same schema, same flow), so swapping in a real provider later is a drop-in change
- **Admin analytics dashboard** — revenue over time, bookings per day, and top stations, backed by a dedicated aggregation endpoint
- **Real-time updates via Socket.IO** — charger availability, new bookings, and payments sync live across every connected client with no manual refresh
- **Owner dashboard** — station/charger CRUD, per-station revenue, and booking history

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Recharts, Socket.IO client
**Backend:** Node.js, Express, JWT, Socket.IO
**Database:** PostgreSQL with Prisma ORM
**Deployment:** Render (API) + Vercel (frontend) + Supabase (database)

## Architecture

```
client/          React SPA (Vite)
  src/
    api/         Axios instance with JWT interceptor
    context/     Auth state (React Context)
    hooks/       useRealtime — subscribes to live data:changed socket events
    pages/       Route-level views (Stations, MyBookings, OwnerDashboard, AdminDashboard, ...)

server/          Express REST API + Socket.IO
  src/
    controllers/ Route handlers, one file per resource
    routes/      Express routers, role-guarded via middleware
    middleware/  JWT verification + role-based access control
    socket.js    Broadcasts a data:changed event on any mutation
  prisma/
    schema.prisma  Data model: User, Station, Charger, Booking, ChargingSession, Payment
```

Real-time design: rather than a custom event per resource, every mutation (station, charger, booking, session, payment) broadcasts one `data:changed` event with a `type`. Connected clients refetch only the data they care about over the normal REST API — the socket is a notification channel, not a data pipe, so the REST response stays the single source of truth.

## Scope notes

Built as an MVP under a tight timeline, with a few deliberate simplifications:
- Payments are mocked (no real Stripe/Razorpay call) — the schema and flow are production-shaped, only the gateway call itself is stubbed
- Station locations are stored as lat/long and shown as a filterable list rather than on a live map SDK
- No containerization/CI pipeline yet

## Running locally

```bash
# Backend
cd server
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run dev             # http://localhost:5000

# Frontend (separate terminal)
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

See `DEPLOYMENT.md` for deploying to Render + Vercel.
