#!/bin/bash
# Run this script on your DigitalOcean droplet to set up the environment

set -e

echo "🚀 Setting up FreshBite on DigitalOcean Droplet..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📚 Installing Git..."
sudo apt-get install -y git curl wget

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/freshbite
sudo chown $USER:$USER /opt/freshbite

# Clone repository (you'll need to add deploy key or use HTTPS with token)
echo "📥 Clone your GitHub repository manually:"
echo "   cd /opt/freshbite"
echo "   git clone https://github.com/pradeepreddyvv/freshbite.git ."

# Create .env file
echo "⚙️  Creating .env file..."
cat > /opt/freshbite/.env << 'EOF'
# Replace these with your actual values
SPRING_DATASOURCE_URL=jdbc:postgresql://your-neon-host.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=your_password
WEB_ORIGIN=https://your-vercel-app.vercel.app
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /opt/freshbite/.env with your actual database credentials"
echo "2. Clone your repository to /opt/freshbite"
echo "3. Run: cd /opt/freshbite && docker-compose up -d"
echo "4. Set up GitHub Secrets for CI/CD deployment"
echo ""
echo "🔒 GitHub Secrets needed:"
echo "   - DROPLET_HOST (your droplet IP)"
echo "   - DROPLET_USER (usually 'root' or your username)"
echo "   - DROPLET_SSH_KEY (contents of serects/freshbite private key)"
echo "   - SPRING_DATASOURCE_URL"
echo "   - SPRING_DATASOURCE_USERNAME"
echo "   - SPRING_DATASOURCE_PASSWORD"
echo "   - WEB_ORIGIN"
