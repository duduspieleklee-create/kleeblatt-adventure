# Deployment Guide – Kleeblatt Adventure

**Stand:** 3. August 2026  
**Stack:** TypeScript Monorepo (Hono API + React/Vite Web + Phaser 3)

---

## Übersicht

| Komponente    | Technologie                         | Port                   |
| ------------- | ----------------------------------- | ---------------------- |
| Game API      | Hono (Node.js, TypeScript)          | 4000                   |
| Web Client    | React + Vite (+ Phaser)             | 5173 (dev) / 80 (prod) |
| Datenbank     | PostgreSQL                          | 5432                   |
| Cache / Queue | Redis                               | 6379                   |
| Blockchain    | Immutable zkEVM (Testnet → Mainnet) | —                      |
| MPC / Wallet  | Turnkey (Prod) / Mock (Dev)         | —                      |

---

## Lokale Entwicklung

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:seed
npm run dev:api    # → localhost:4000
npm run dev:web    # → localhost:5173
```

---

## Production: https://game.kleeblatt.space/

Static **web client** is deployed by GitHub Actions on every push to `main`  
(workflow: [`.github/workflows/deploy-game.yml`](./.github/workflows/deploy-game.yml)).

Same flow as before: **push `main` → Actions → live at game.kleeblatt.space**.

### 1. DNS

Point the subdomain at the same host as `kleeblatt.space` (currently `57.129.124.60`):

| Type | Name   | Value           |
| ---- | ------ | --------------- |
| A    | `game` | `57.129.124.60` |

Or CNAME `game` → `kleeblatt.space`.

### 2. GitHub Secrets (Environment: `production`)

Repo → Settings → Environments → **production** → Environment secrets:

| Secret           | Example                          | Purpose                           |
| ---------------- | -------------------------------- | --------------------------------- |
| `DEPLOY_HOST`    | `57.129.124.60`                  | SSH host                          |
| `DEPLOY_USER`    | `debian`                         | SSH user                          |
| `DEPLOY_SSH_KEY` | _(private key PEM)_              | Deploy key (prefer no passphrase) |
| `DEPLOY_PATH`    | `/var/www/game.kleeblatt.space/` | Target directory on server        |

Optional repo **variable**: `VITE_API_URL` (empty = same-origin; nginx can proxy `/api`).

### 3. Server (nginx)

```bash
sudo mkdir -p /var/www/game.kleeblatt.space
sudo chown -R $USER:www-data /var/www/game.kleeblatt.space
```

`/etc/nginx/sites-available/game.kleeblatt.space`:

```nginx
server {
    listen 80;
    server_name game.kleeblatt.space;
    root /var/www/game.kleeblatt.space;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Alle API-Calls laufen über /api/* (Web-Default, siehe apps/web/src/lib/api.ts).
    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> Hinweis: Die API mountet ihre Routen doppelt – unter `/api/*` (bevorzugt)
> und am Root (Legacy-Aliase für /health, /auth/*, /me, falls alte nginx-Locations
> existieren). Neue nginx-Configs brauchen nur die `/api/`-Location.

```bash
sudo ln -sf /etc/nginx/sites-available/game.kleeblatt.space /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d game.kleeblatt.space
```

### 4. Deploy

- **Automatic:** push/merge to `main`
- **Manual:** Actions → **Deploy game.kleeblatt.space** → Run workflow

---

## Full stack (Docker, optional)

When the API runs on the same host, use Docker Compose + managed Postgres/Redis as needed.

### Build

```bash
npm run build
```

### Env (Production)

| Variable         | Wert                           |
| ---------------- | ------------------------------ |
| `NODE_ENV`       | `production`                   |
| `DATABASE_URL`   | Managed Postgres URL           |
| `REDIS_URL`      | Managed Redis URL              |
| `SESSION_SECRET` | Strong random string           |
| `CORS_ORIGIN`    | `https://game.kleeblatt.space` |
| `SECURE_COOKIES` | `true`                         |

### Sicherheit

- Never commit `.env` or private keys
- TLS everywhere
- Secrets only via GitHub Environment / server env

Siehe: [SECURITY.md](./SECURITY.md)
