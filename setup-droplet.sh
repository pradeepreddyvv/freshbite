#!/bin/bash
# ────────────────────────────────────────────────────────────
# FreshBite Droplet Bootstrap — idempotent, safe to re-run
# Works on fresh Ubuntu 22.04/24.04 or existing server
# Usage:  ./setup-droplet.sh            (interactive .env.prod)
#         ./setup-droplet.sh --skip-env (CI/CD mode, expects .env.prod exists)
# ────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/freshbite"
REPO_URL="https://github.com/pradeepreddyvv/freshbite.git"

echo "🚀 FreshBite Droplet Bootstrap"
echo "──────────────────────────────"

# ── 1. System packages ──
echo "📦 Ensuring system packages..."
apt-get update -qq
apt-get install -y -qq curl git ufw

# ── 2. Docker ──
if ! command -v docker &> /dev/null; then
  echo "🐳 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "🐳 Docker already installed: $(docker --version)"
fi

# Docker Compose (v2 plugin)
if ! docker compose version &> /dev/null; then
  echo "🐙 Installing Docker Compose plugin..."
  apt-get install -y -qq docker-compose-plugin
else
  echo "🐙 Docker Compose already installed: $(docker compose version)"
fi

# ── 3. Firewall ──
echo "🔒 Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 4. Clone or update repo ──
if [ ! -d "$APP_DIR/.git" ]; then
  echo "📥 Cloning repository..."
  mkdir -p "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "📥 Pulling latest code..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
fi

cd "$APP_DIR"

# ── 5. Create .env.prod (interactive mode only) ──
if [ "${1:-}" != "--skip-env" ]; then
  if [ -f .env.prod ]; then
    echo "⚙️  .env.prod already exists. Overwrite? (y/N)"
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
      echo "   Keeping existing .env.prod"
    else
      create_env=true
    fi
  else
    create_env=true
  fi

  if [ "${create_env:-}" = "true" ]; then
    echo ""
    echo "Enter your Neon PostgreSQL JDBC URL:"
    read -r DB_URL
    echo "Enter your Neon DB username:"
    read -r DB_USER
    echo "Enter your Neon DB password:"
    read -rs DB_PASS
    echo ""
    echo "Enter your Vercel frontend URL (e.g. https://freshbite.vercel.app):"
    read -r VERCEL_URL

    cat > .env.prod << EOF
SPRING_DATASOURCE_URL=${DB_URL}
SPRING_DATASOURCE_USERNAME=${DB_USER}
SPRING_DATASOURCE_PASSWORD=${DB_PASS}
WEB_ORIGIN=${VERCEL_URL}
EOF
    chmod 600 .env.prod
    echo "✅ .env.prod created"
  fi
else
  echo "⚙️  --skip-env mode: expecting .env.prod to be created by CI/CD"
fi

# ── 6. Build & start ──
echo ""
echo "🔨 Building and starting containers..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ── 7. Wait for health ──
echo "⏳ Waiting for services..."
RETRIES=0
until [ "$RETRIES" -ge 20 ]; do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    break
  fi
  RETRIES=$((RETRIES + 1))
  sleep 5
done

echo ""
docker compose ps
echo ""

if curl -sf http://localhost/health > /dev/null 2>&1; then
  echo "✅ FreshBite is live at http://$(curl -sf ifconfig.me)"
  echo ""
  echo "🔒 Secrets are in: $APP_DIR/.env.prod (chmod 600, never committed)"
  echo "📊 Logs:           docker compose -f $APP_DIR/docker-compose.yml logs -f"
  echo "🔄 Restart:        cd $APP_DIR && docker compose restart"
else
  echo "❌ Health check failed. Check logs:"
  echo "   docker compose logs spring-boot"
  echo "   docker compose logs llm-service"
  exit 1
fi
