# Deployment Guide

Stack: Render (backend, persistent Node process — needed for Socket.IO's
WebSockets) + Vercel (frontend static build) + Supabase (database, already set up).

## 0. Push your code to GitHub (if you haven't already)

See the git commit walkthrough below for staging this in a few logical
commits rather than one big dump — then push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ev-charging.git
git branch -M main
git push -u origin main
```

**Before committing**, double check `.env` files are NOT included — they should
be excluded by a `.gitignore`. If you don't have one yet:

```bash
cat > .gitignore << 'EOF'
node_modules/
.env
dist/
EOF
```

## 1. Deploy the backend on Render

1. Go to render.com, sign up/log in with GitHub
2. New → Web Service → connect your `ev-charging` repo
3. Render should detect `render.yaml` at the repo root and offer to use it
   (this sets root directory, build command, and start command automatically).
   If it doesn't auto-detect, set these manually:
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm run start`
4. Add environment variables (Render dashboard → Environment):
   - `DATABASE_URL` = your real Supabase connection string
   - `JWT_SECRET` = your real secret (can be the same one from local `.env`,
     or generate a fresh one for production — either is fine for an MVP)
5. Deploy. First build takes a few minutes. Once live, copy your service URL —
   it'll look like `https://ev-charging-server.onrender.com`
6. Test it directly: visit that URL in a browser, you should see
   `{"status":"EV Charging API running"}`

## 2. Deploy the frontend on Vercel

1. Go to vercel.com, sign up/log in with GitHub
2. New Project → import your `ev-charging` repo
3. Set:
   - Root Directory: `client`
   - Framework Preset: Vite (should auto-detect)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL from step 1 (e.g.
     `https://ev-charging-server.onrender.com`, no trailing slash)
5. Deploy. You'll get a URL like `https://ev-charging-yourname.vercel.app`

The `client/vercel.json` file already in your project handles one important
detail: React Router routes like `/admin` or `/my-bookings` aren't real files
on the server — without a rewrite rule, refreshing the page on one of those
routes would 404. `vercel.json` tells Vercel to serve `index.html` for any
path and let React Router take over from there.

## 3. Test the deployed app end to end

- Open your Vercel URL, register a new customer, login, browse stations
- Check the Navbar "Live" indicator turns green (confirms the deployed
  frontend successfully opened a WebSocket back to your Render backend)
- Book a charger, start/stop a session, mock-pay
- Open the same Vercel URL in a second browser/incognito window as your
  owner or admin account, confirm real-time updates still work across
  two *deployed* clients, not just two localhost tabs

## Known limitation

Render's free tier spins the backend down after 15 minutes of no traffic;
the next request takes 30-60 seconds to "wake" it back up. A paid tier, or a
scheduled keep-alive ping, removes this in a production setup.
