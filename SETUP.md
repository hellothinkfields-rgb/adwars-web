# Ad Wars — Deployment Guide

Get adwars.live live in under an hour.

---

## 1. Supabase (free database + real-time)

1. Go to **https://supabase.com** → New project
2. Pick a name (e.g. `adwars`) and a strong database password. Save the password.
3. Wait ~2 minutes for it to spin up.
4. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial.sql`
5. Run `supabase/migrations/002_functions.sql` in the same editor
6. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Stripe (payments)

1. Go to **https://dashboard.stripe.com** → create account
2. Go to **Developers → API Keys**:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
3. To get the webhook secret (do this after Vercel deploy):
   - **Developers → Webhooks → Add endpoint**
   - URL: `https://adwars.live/api/webhook`
   - Events to listen: `checkout.session.completed`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

> **Test mode first**: Keep Stripe in test mode (`pk_test_...`, `sk_test_...`) until you're ready to go live. Use card `4242 4242 4242 4242` to test payments.

---

## 3. GitHub repo

```bash
cd "Ad Wars/adwars-web"
git init
git add .
git commit -m "Initial commit — Ad Wars MVP"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/adwars-web.git
git push -u origin main
```

---

## 4. Vercel (hosting)

1. Go to **https://vercel.com** → Import Project → select your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add all environment variables from `.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   NEXT_PUBLIC_APP_URL=https://adwars.live
   ```
4. Click **Deploy**

---

## 5. Connect adwars.live domain

1. Buy `adwars.live` (Namecheap, GoDaddy, Cloudflare, etc.)
2. In Vercel → your project → **Settings → Domains** → add `adwars.live`
3. Vercel shows you DNS records to add — go to your registrar and add them
4. Wait 5–10 minutes for DNS to propagate

---

## 6. Update Stripe webhook URL

Once the domain is live:
1. Stripe → Developers → Webhooks → update endpoint URL to `https://adwars.live/api/webhook`
2. Copy the new signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
3. Redeploy in Vercel (or it auto-deploys on next push)

---

## Development

```bash
cd adwars-web
npm install
cp .env.example .env.local
# Fill in .env.local with your keys
npm run dev
# Open http://localhost:3000
```

For local Stripe webhook testing:
```bash
npm install -g stripe
stripe listen --forward-to localhost:3000/api/webhook
# Copy the webhook secret printed in terminal → STRIPE_WEBHOOK_SECRET in .env.local
```

---

## Architecture

```
Next.js App (Vercel)
    ├── / (main page)           — real-time canvas grid
    ├── /api/brands             — brand registration
    ├── /api/checkout           — creates Stripe checkout session
    ├── /api/webhook            — Stripe confirms payment → updates grid
    └── /success                — post-payment confirmation page

Supabase (PostgreSQL + Realtime)
    ├── brands                  — registered brands
    ├── grid_cells              — current state of 4096 cells
    ├── pending_transactions    — created before payment
    ├── transactions            — completed conquests (history)
    └── stats                   — global charity/volume totals

Stripe Checkout
    — handles payment UI, card processing, 3DS, etc.
    — fires webhook on success → triggers grid update
```

---

## Going live checklist

- [ ] Supabase project created, both SQL files run
- [ ] Stripe account created, webhook configured  
- [ ] GitHub repo pushed
- [ ] Vercel project deployed with all env vars
- [ ] `adwars.live` domain connected
- [ ] Test payment works end-to-end (Stripe test mode)
- [ ] Switch Stripe to live mode, update keys in Vercel
- [ ] Post it on social and tag some brands 🔥
