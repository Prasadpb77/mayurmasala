# Deployment guide — GitHub Actions → Vercel + Supabase

This wires up **CI/CD**: every PR gets a Vercel preview URL, every merge to `main` builds, deploys to production, pushes DB migrations, and re-registers the Telegram webhook — fully automated.

---
## 1. One-time: create the GitHub repo
```bash
cd mayur-masala
git init
git add .
git commit -m "Initial scaffold"
gh repo create mayur-masala --private --source=. --push
# or: create on github.com, then
git remote add origin https://github.com/<you>/mayur-masala.git
git push -u origin main
```

## 2. One-time: create the Supabase project
1. https://supabase.com/dashboard → New Project → note the **Project URL**, **anon key**, **service_role key**.
2. SQL Editor → paste and run `supabase/migrations/0001_init.sql`.
3. Authentication → Users → **Add user** (create your staff logins directly, no signup).
4. Table Editor → `allowed_telegram_users` → insert your Telegram numeric ID (get it from **@userinfobot**).
5. Settings → Database → copy the **connection string** (needed for `SUPABASE_DB_URL` secret below).

## 3. One-time: create the Vercel project
1. https://vercel.com → New Project → Import the `mayur-masala` GitHub repo.
2. Framework preset: Next.js (auto-detected). Deploy once manually to generate the project — GitHub Actions will take over after.
3. Project Settings → note the **Project ID** and **Org/Team ID** (Settings → General).
4. Account Settings → Tokens → create a **Vercel API token**.
5. **Important**: under Project Settings → Git, disable Vercel's own auto-deploy-on-push (toggle off "Deploy Hooks" from Git integration) so it doesn't double-deploy alongside GitHub Actions. Skip this if you'd rather let Vercel's native integration handle it instead of Actions — see note at the bottom.

## 4. One-time: create the Telegram bot
1. Message **@BotFather** → `/newbot` → copy the token.

## 5. Add GitHub Actions secrets
Repo → Settings → Secrets and variables → Actions → New repository secret:

For a description of the Bot API, see this page: https://core.telegram.org/bots/api
| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_DB_URL` | Supabase → Project Settings → Database → Connection string (URI, use the pooler one) |
| `TELEGRAM_BOT_TOKEN` | From BotFather |

Also add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TELEGRAM_BOT_TOKEN` as **Environment Variables in Vercel itself** (Project Settings → Environment Variables) — the app reads them at runtime; GitHub secrets only feed the Actions build/deploy steps.

## 6. Push and watch it deploy
```bash
git push origin main
```
Go to the repo's **Actions** tab → `Deploy to Vercel` workflow runs:
1. `lint-and-build` — installs deps, lints, builds
2. `deploy-production` — deploys to Vercel prod, runs `supabase db push` for any new migrations, re-sets the Telegram webhook to the live URL

Open a PR instead of pushing directly to `main` → you'll get a `deploy-preview` job that comments the preview URL on the PR.

## 7. Verify
- Visit the production URL → log in with the Supabase user you created.
- Message your Telegram bot: `/sale 500 Test - checking bot` → should reply `✅ Logged sale: ₹500`.
- `/summary` → should show today's totals.

---
### Note: Actions-based vs Vercel-native deploys
This workflow deploys **via the Vercel CLI inside GitHub Actions**, which gives you the migration + webhook automation in the same pipeline. If you'd rather keep it simpler, you can instead just use **Vercel's native GitHub integration** (auto-deploy on push, zero YAML) and drop this workflow — but then DB migrations and the Telegram webhook update have to be run manually after each deploy. The `deploy.yml` above is the one-command, fully automated option.