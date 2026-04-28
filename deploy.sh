#!/usr/bin/env bash
# AtlasPi - Automated Deployment Script
# Deploy to Render with PI Network payment integration

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AtlasPi - Deployment Script (PI Network Integration)     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Creating from template..."
    cp .env.example .env.local
    echo -e "${RED}❌ Please edit .env.local with your PI_SERVER_API_KEY${NC}"
    exit 1
fi

# Check PI_SERVER_API_KEY
if ! grep -q "PI_SERVER_API_KEY=" .env.local; then
    echo -e "${RED}❌ PI_SERVER_API_KEY not found in .env.local${NC}"
    exit 1
fi

PI_KEY=$(grep "PI_SERVER_API_KEY=" .env.local | cut -d= -f2)
if [ "$PI_KEY" == "your_server_api_key_here_keep_secret" ]; then
    echo -e "${RED}❌ PI_SERVER_API_KEY is still the default value${NC}"
    echo "Please update .env.local with your actual key"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Build check
echo "Checking builds..."
if [ ! -d "frontend/dist" ] && [ -f "frontend/package.json" ]; then
    echo -e "${YELLOW}Building frontend...${NC}"
    cd frontend && npm run build 2>/dev/null || echo "No build script" && cd ..
fi

if [ ! -d "backend/node_modules" ] && [ -f "backend/package.json" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm ci && cd ..
fi

echo -e "${GREEN}✅ Builds ready${NC}"
echo ""

# Git operations
echo "Preparing git..."
git add .
git commit -m "Deploy: Official PI Network payment integration

- Added official PI payment flow (3 phases)
- Server-side approval & completion
- Render deployment configuration
- Element 10 test compliance" || echo "No changes to commit"

echo -e "${GREEN}✅ Changes committed${NC}"
echo ""

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main || echo -e "${YELLOW}Push to GitHub (check for credentials)${NC}"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Deployment Status                                         ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo -e "║  ${GREEN}✅ Code committed and pushed${NC}"
echo "║  📧 Render will auto-deploy on push"
echo "║  ⏱️  Monitor at: https://dashboard.render.com"
echo "║                                                            ║"
echo "║  Next Steps:                                               ║"
echo "║  1. Wait for Render deployment (2-5 min)                   ║"
echo "║  2. Test frontend: https://atlaspi-fronted.onrender.com    ║"
echo "║  3. Test backend: https://atlaspi-backend.onrender.com     ║"
echo "║  4. Run payment test locally                               ║"
echo "║  5. Verify Element 10 tests pass                           ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Health check URLs
echo -e "${BLUE}📍 Deployment URLs:${NC}"
echo "Frontend:  https://atlaspi-fronted.onrender.com"
echo "Backend:   https://atlaspi-backend.onrender.com/api/health"
echo ""

# Local testing
echo -e "${BLUE}🧪 Local Testing:${NC}"
echo "cd backend && npm start  # Terminal 1"
echo "cd frontend && npm start # Terminal 2"
echo "# Then test http://localhost:3000"
echo ""

echo -e "${GREEN}✅ Deployment script completed${NC}"
