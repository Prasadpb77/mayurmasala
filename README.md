# Mayur Masala Center — Sales/Purchase/Expense Tracker

Stack: **Next.js 14 (App Router) + Tailwind** on **Vercel**, **Supabase** (Postgres + Auth), **Telegram Bot** (webhook via Vercel serverless function), infra via **Terraform**.

Theme is pulled from the Puneri Garam Masala packet: deep red `#B4182A`, mustard/gold `#F2B90B`, dark masala brown `#3B1F14`, cream `#FDF6E3`.

---
## 1. Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────┐
│  Telegram    │────▶│ /api/telegram      │────▶│   Supabase     │
│  Bot (user)  │      │ (Vercel function) │      │  Postgres +    │
└─────────────┘      └──────────────────┘      │  Auth          │
                                                  └───────┬───────┘
┌─────────────┐      ┌──────────────────┐              │
│  Browser     │────▶│  Next.js App       │──────────────┘
│  (staff)     │      │  (Vercel)          │
└─────────────┘      └──────────────────┘
```

- **Auth**: Supabase Auth, email/password. No public signup — you add users directly from the Supabase dashboard (Authentication → Users → Add user) or via the included `scripts/add-user.md`.
- **Data**: one `transactions` table (`type`: sale | purchase | expense) + SQL views for monthly / yearly / financial-year (Apr–Mar, India FY) rollups.
- **Telegram bot**: whitelist of Telegram user IDs stored in `allowed_telegram_users` table. Commands: `/sale`, `/purchase`, `/expense`.
- **Dashboard**: KPI number widgets (today/month/year/FY totals), one small trend chart, and raw data tables (sortable/filterable), per your ask — numbers + a light chart + tables, no heavy graph dashboards.

---
## 2. Local setup

```bash
cd mayur-masala
cp .env.example .env.local   # fill in values
npm install
npm run dev
```

## 3. Supabase setup

1. Create a project at https://supabase.com/dashboard.
2. Run the SQL in `supabase/migrations/0001_init.sql` via SQL Editor (or `supabase db push` with the CLI).
3. Add staff logins: Dashboard → Authentication → Users → "Add user" (set email + password, no signup flow needed).
4. Add allowed Telegram IDs by inserting rows into `allowed_telegram_users` (see SQL file) — get a user's numeric ID by messaging **@userinfobot** on Telegram.
5. Copy `Project URL`, `anon public key`, and `service_role key` into `.env.local` / Vercel env vars.

## 4. Telegram bot setup

1. Create a bot via **@BotFather** → `/newbot` → copy the token.
2. Set env var `TELEGRAM_BOT_TOKEN`.
3. After deploying to Vercel, register the webhook (one-time):
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-vercel-domain>/api/telegram"
   ```
4. Bot commands (send in chat with your bot):
   - `/sale 1500 Puneri Garam Masala 1kg x3`
   - `/purchase 8000 Raw chilli 20kg`
   - `/expense 500 Electricity bill`
   - `/summary` → today/month/FY totals

## 5. Deploy to Vercel (via GitHub)

1. Push this repo to GitHub.
2. On vercel.com → New Project → Import the GitHub repo.
3. Add the env vars from `.env.example` in Vercel Project Settings → Environment Variables.
4. Deploy. Every push to `main` auto-deploys (Vercel's native GitHub integration — free tier).

## 6. Terraform (infra-as-code)

`terraform/` provisions:
- The Vercel project + env vars + GitHub link (`vercel` provider).
- Supabase project settings via the community `supabase` provider (schema itself is applied with the SQL migration, since Postgres DDL isn't a first-class Terraform resource for Supabase).

```bash
cd terraform
terraform init
terraform apply \
  -var="vercel_api_token=xxx" \
  -var="github_repo=yourname/mayur-masala" \
  -var="supabase_access_token=xxx" \
  -var="supabase_org_id=xxx" \
  -var="supabase_db_password=xxx"
```

See `terraform/README.md` for details and free-tier notes.

---
## 7. Folder guide
```
app/
  login/            Supabase email/password login
  dashboard/        KPI widgets + chart + tables (home after login)
  sales/ purchases/ expenses/   entry forms + list/table per type
  api/telegram/     bot webhook (serverless function)
lib/
  supabase/         client + server helpers
  finance.ts        FY/month/year date-bucketing helpers
supabase/migrations/0001_init.sql   schema, views, RLS policies
terraform/          IaC for Vercel + Supabase
```
