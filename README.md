# Job Portal Application Using Web Scraping

A job portal with a React frontend, an Express API, and a Python scraper for
Naukri job listings. The API reads job listings from Excel files in
`server/data/`; the scraper saves its results there.

## Project structure

- `client/` — React application built with Vite
- `server/` — Express API, authentication, and job/company/news routes
- `naukri_ultra_fast_scraper.py` — Naukri scraper
- `requirements.txt` — Python scraper dependencies

## Requirements

- Node.js 20.19 or newer
- Python 3.9 or newer for scraping
- Google Chrome for scraping
- MongoDB for database-backed user accounts (optional for local development)

## Run locally

### 1. Start the API

In PowerShell:

```powershell
cd server
Copy-Item .env.example .env
npm ci
npm start
```

Edit `server/.env` and set a unique, long `JWT_SECRET`. Set `MONGODB_URI` to
your MongoDB connection string if you want database-backed accounts. The API
listens on `http://localhost:5001` by default.

### 2. Start the frontend

Open a second PowerShell window:

```powershell
cd client
npm ci
npm run dev
```

Open the local URL printed by Vite. The frontend expects the API at
`http://localhost:5001/api`.

### 3. Load job listings

Place job data in `.xlsx` files under `server/data/`. The API reads Excel files
from this folder when serving job and company data. To collect listings, from
the project root create and activate a Python virtual environment, install
the scraper dependencies, and run the scraper:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python naukri_ultra_fast_scraper.py
```

The scraper requires Google Chrome. Scraping availability depends on the
website and its current access policies.

## Checks

From `client/`, run the frontend production build and linter:

```powershell
npm run build
npm run lint
```

## Local and private files

Do not commit `.env` files, uploaded resumes/documents, or
`server/data/users.json`. They contain local configuration or user data and are
excluded by `.gitignore`. The tracked `server/.env.example` contains placeholders
only; replace them locally and never publish real credentials.

Use a strong `JWT_SECRET` and a properly configured database before deploying
the application. Do not use local development settings for a public deployment.
