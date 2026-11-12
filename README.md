# ResumeATS (Resumely)

AI-powered ATS resume analyzer. Sign up, paste or upload a resume with a job description, and get an ATS score, keyword match and improvement tips. Past analyses are saved to your dashboard.

**Tech stack:** React 18 · Redux Toolkit · esbuild · Node.js · Express · **PostgreSQL** (`pg`) · Google Gemini API · Cloudinary · JWT auth · bcrypt · Helmet + rate limiting

> Based on a college workshop project. Extended by me with: PostgreSQL database layer (parameterised SQL, auto-created schema, UUID keys), startup environment validation, health-check endpoint. _(add your own features here)_

---

## 1. What you need to install (one time)

| Tool | Download |
|---|---|
| Node.js 18+ (LTS) | https://nodejs.org |
| PostgreSQL 13+ | https://www.postgresql.org/download/ |
| Git | https://git-scm.com |

Check: `node -v`, `npm -v`, `git --version`.

## 2. Set up PostgreSQL

**Option A: local (recommended for development)**
1. Install PostgreSQL. Remember the password you set for the `postgres` user.
2. Create the database. Either use pgAdmin (right-click *Databases → Create → Database*, name it `resumely`) or run:
   ```
   psql -U postgres -c "CREATE DATABASE resumely;"
   ```
3. Your `DATABASE_URL` is:
   `postgresql://postgres:YOUR_PASSWORD@localhost:5432/resumely`
   (if your password has special characters like `@` or `#`, URL-encode them, e.g. `@` → `%40`)

**Option B: free hosted database (also good for deployment)**
1. Sign up at https://neon.tech (or https://supabase.com), create a project.
2. Copy the connection string and use it as `DATABASE_URL`.
3. Set `DATABASE_SSL=true`.

The tables are created **automatically** when the server starts (`backEnd/db/schema.sql`). You do not need to run any SQL by hand.

## 3. Get your API keys

### Google Gemini API key (required)
1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key**, then copy it.
3. Put it in `GEMINI_API_KEY`.

> You do **not** need a separate "Google Cloud API key". This project only uses the Gemini key.

### Cloudinary (optional, stores the uploaded resume file)
1. Sign up free at https://cloudinary.com.
2. Open the dashboard and find your **Cloud name**, **API key** and **API secret** (under *API Keys* in Settings / the dashboard). Menu labels change sometimes.
3. Put them in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

If you skip Cloudinary, the app still works. Pasted text and uploaded files are analysed; the original file just isn't stored.

### JWT secret (required, you make this one yourself)
Run this and paste the output into `JWT_SECRET`:
```
node --input-type=module -e "import {randomBytes} from 'crypto'; console.log(randomBytes(48).toString('hex'))"
```

## 4. Run the project

**Backend**
```
cd backEnd
npm install
cp .env.example .env        # Windows PowerShell also accepts cp. Then open .env and fill in your values
npm run dev
```
You should see:
```
PostgreSQL connected: resumely
Database tables are ready.
Resumely server running on port 4000
```
If something is missing or wrong, the server stops and prints exactly what to fix.

**Frontend** (second terminal)
```
cd frontEnd
npm install
npm run dev
```
Open http://localhost:3000.

**Optional demo data:** `cd backEnd && npm run seed:demo` creates `demo@resumely.test` / `Demo@1234` with two sample analyses.

## 5. Keeping your keys safe

- Real keys live **only** in `backEnd/.env`. This file is in `.gitignore` and must never be committed.
- Only `backEnd/.env.example` (no real values) goes to GitHub.
- All keys are used **only on the backend**. Nothing secret is ever sent to the browser.
- Before every commit run `git status` and make sure `.env` is not listed. After your first push run `git ls-files | grep env`. Only `.env.example` should appear.
- If a key is ever pushed by mistake, delete it and create a new one in the provider's dashboard right away. Removing the file later does not remove it from git history.
- Turn on GitHub's **Secret scanning / push protection** in your repo's Settings → Code security.

## 6. API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | no | Server + database status |
| POST | `/api/auth/signup` | no | Create account |
| POST | `/api/auth/login` | no | Log in, returns JWT |
| POST | `/api/analyze` | Bearer | Analyse resume text or file (PDF/DOCX/TXT) |
| GET | `/api/analyses` | Bearer | Last 20 analyses |
| GET | `/api/analyses/:id` | Bearer | One analysis with full result |

## 7. Database schema

`users` (id UUID, name, email UNIQUE, password_hash, last_login_at, timestamps)
`analyses` (id UUID, user_id → users, resume_name, resume_text, resume_file JSONB, resume_asset JSONB, job_description, score 0-100, result JSONB, source, timestamps)

## 8. Troubleshooting

| Message | Fix |
|---|---|
| `password authentication failed` | Wrong password in `DATABASE_URL` |
| `database "resumely" does not exist` | Create the database (step 2) |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service isn't running |
| `JWT_SECRET is too weak` | Generate one with the command in step 3 |
| `GEMINI_API_KEY is not configured` | Add the key to `.env` and restart the server |
| Gemini 404/model error | Set `GEMINI_MODEL` to a current model from https://ai.google.dev/gemini-api/docs/models |
| `gen_random_uuid() does not exist` | Your PostgreSQL is older than 13. Upgrade it |
