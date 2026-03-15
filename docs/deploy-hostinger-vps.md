# Deploy on Hostinger VPS

Run both the FastAPI backend and the Next.js frontend on a single Hostinger VPS, with nginx as reverse proxy and HTTPS via Let's Encrypt.

## Prerequisites

- Hostinger VPS (e.g. Ubuntu 22.04) with SSH access
- A domain (or subdomain) pointing to the VPS IP, e.g. `app.yourdomain.com`
- MongoDB Atlas connection string and Anthropic API key

## 1. Server setup

SSH into the VPS and install:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx git
```

Install Node.js 20 LTS (for building and serving Next.js):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install Python 3.11+ and venv:

```bash
sudo apt install -y python3 python3-venv python3-pip
```

## 2. Clone and configure backend

```bash
cd /var/www  # or another directory you prefer
sudo mkdir -p rag-app && sudo chown "$USER:$USER" rag-app
cd rag-app
git clone https://github.com/YOUR_USERNAME/rag-document-intelligence.git .
cd rag-document-intelligence/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_atlas_uri
ANTHROPIC_API_KEY=your_anthropic_key
DB_NAME=rag_intelligence
COLLECTION_NAME=documents
```

In **MongoDB Atlas** → Network Access, add the VPS public IP.

Test the backend:

```bash
uvicorn src.main:app --host 127.0.0.1 --port 8000
# In another terminal: curl http://127.0.0.1:8000/health
# Then Ctrl+C to stop
```

## 3. Run backend with systemd

So the backend restarts on reboot and runs in the background:

```bash
sudo nano /etc/systemd/system/rag-backend.service
```

Paste (adjust paths and user if needed):

```ini
[Unit]
Description=RAG Document Intelligence API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/rag-app/rag-document-intelligence/backend
Environment="PATH=/var/www/rag-app/rag-document-intelligence/backend/venv/bin"
ExecStart=/var/www/rag-app/rag-document-intelligence/backend/venv/bin/uvicorn src.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

If you use your own user instead of `www-data`, change `User`/`Group` and ensure that user owns the repo and `backend/uploads`. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rag-backend
sudo systemctl start rag-backend
sudo systemctl status rag-backend
```

## 4. Build and run frontend

On the VPS, set the API URL to the same host (nginx will proxy later). Use your real domain:

```bash
cd /var/www/rag-app/rag-document-intelligence/frontend
export NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api
npm ci
npm run build
```

Run the frontend with Node (so it stays up):

```bash
npm run start
# Runs on port 3000 by default
```

Or run it with systemd so it restarts on reboot:

```bash
sudo nano /etc/systemd/system/rag-frontend.service
```

```ini
[Unit]
Description=RAG Document Intelligence Frontend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/rag-app/rag-document-intelligence/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Note: `NEXT_PUBLIC_*` is baked in at **build** time. So either build with `NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api` set, or rebuild after changing the env file. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rag-frontend
sudo systemctl start rag-frontend
sudo systemctl status rag-frontend
```

## 5. Nginx reverse proxy and HTTPS

Use one domain for both app and API, e.g. `app.yourdomain.com` → frontend, `app.yourdomain.com/api` → backend.

```bash
sudo nano /etc/nginx/sites-available/rag-app
```

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        # Strip /api so backend sees /health, /query, etc.
        rewrite ^/api(.*)$ $1 break;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and get HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/rag-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d app.yourdomain.com
```

Certbot will adjust the config for HTTPS. Reload nginx if needed:

```bash
sudo systemctl reload nginx
```

## 6. CORS (if you use a different frontend domain)

If the frontend is on a different domain than the backend (e.g. front on Vercel, API on Hostinger), set the backend CORS allowed origin. In `backend/src/main.py` replace:

```python
allow_origins=["*"],
```

with:

```python
allow_origins=["https://app.yourdomain.com", "https://your-vercel-app.vercel.app"],
```

Restart the backend:

```bash
sudo systemctl restart rag-backend
```

## 7. Frontend API URL when backend is under `/api`

Because nginx rewrites `https://app.yourdomain.com/api` → `http://127.0.0.1:8000`, the **browser** must call `https://app.yourdomain.com/api/health`, `/api/query`, etc. So the frontend base URL must be `https://app.yourdomain.com/api` (no trailing slash). You already set `NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api`; the client in `lib/api.ts` appends paths like `/health`, so the final URL is correct.

## Summary

| Component | URL / Port |
| --------- | ---------- |
| Frontend | <https://app.yourdomain.com> (nginx → :3000) |
| Backend | <https://app.yourdomain.com/api> (nginx → :8000) |
| NEXT_PUBLIC_API_URL | `https://app.yourdomain.com/api` |

After pulling updates:

```bash
cd /var/www/rag-app/rag-document-intelligence
git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart rag-backend
cd ../frontend && npm ci && npm run build
sudo systemctl restart rag-frontend
```
