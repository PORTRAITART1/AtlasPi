#!/bin/bash
# setup-aiar.sh: Setup script for AIAR (Agent IA Autonome Responsable)
# Deploys complete infrastructure with Build Cloud + Pi Network

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "AIAR Setup: Agent IA Autonome Responsable"
echo "=================================================="

# Check prerequisites
check_prerequisites() {
  echo -e "\n${YELLOW}[1/6]${NC} Checking prerequisites..."
  
  commands=(docker docker-compose docker-buildx curl jq)
  for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      echo -e "${RED}✗ $cmd not found${NC}"
      exit 1
    fi
  done
  
  echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Setup environment
setup_environment() {
  echo -e "\n${YELLOW}[2/6]${NC} Setting up environment..."
  
  if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Docker Build Cloud
DOCKER_BUILD_CLOUD_ENABLED=true
DOCKER_BUILD_CLOUD_TOKEN=<your-token-here>
DOCKER_BUILD_CLOUD_ORG=<your-org>

# Docker Registry
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=<your-username>
DOCKER_PASSWORD=<your-password>

# Pi Network
PI_NODE_ID=<your-node-id>
PI_NODE_API_KEY=<your-api-key>
PI_WALLET_ADDRESS=<your-pi-wallet>

# Vault (for secrets)
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=<your-token>

# Slack (for alerts)
APPROVAL_SLACK_WEBHOOK=https://hooks.slack.com/services/...
APPROVAL_EMAIL=devops@example.com

# Application
APP_MODE=demo
VERSION=1.0.0
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)
EOF
    echo -e "${GREEN}✓ Created .env file (update with your values)${NC}"
  else
    echo -e "${GREEN}✓ .env already exists${NC}"
  fi
}

# Setup Docker Buildx
setup_buildx() {
  echo -e "\n${YELLOW}[3/6]${NC} Setting up Docker Buildx..."
  
  if docker buildx ls | grep -q "default"; then
    echo -e "${GREEN}✓ Docker Buildx already configured${NC}"
  else
    docker buildx create --name aiar-builder --use
    docker buildx inspect --bootstrap
    echo -e "${GREEN}✓ Docker Buildx builder created${NC}"
  fi
}

# Build AIAR image
build_aiar_image() {
  echo -e "\n${YELLOW}[4/6]${NC} Building AIAR controller image..."
  
  if [ ! -f aiar/Dockerfile ]; then
    cat > aiar/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Copy agent code
COPY aiar/agent.py .
COPY aiar/requirements.txt .
RUN pip install -r requirements.txt

# Expose metrics port
EXPOSE 8000

# Health endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "agent.py"]
EOF
    echo -e "${GREEN}✓ Created aiar/Dockerfile${NC}"
  fi
  
  # Build for multiple architectures
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag atlaspi-aiar:latest \
    --push=false \
    aiar/
  
  echo -e "${GREEN}✓ AIAR image built${NC}"
}

# Deploy with compose
deploy_compose() {
  echo -e "\n${YELLOW}[5/6]${NC} Deploying with Docker Compose..."
  
  docker-compose -f docker-compose.aiar.yml up -d --pull always
  
  # Wait for services to be healthy
  echo "Waiting for services to become healthy..."
  sleep 10
  
  docker-compose -f docker-compose.aiar.yml ps
  
  echo -e "${GREEN}✓ Services deployed${NC}"
}

# Verify deployment
verify_deployment() {
  echo -e "\n${YELLOW}[6/6]${NC} Verifying deployment..."
  
  # Check backend health
  if curl -s http://localhost:3000/api/health | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
  else
    echo -e "${RED}✗ Backend health check failed${NC}"
  fi
  
  # Check frontend
  if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend accessible${NC}"
  else
    echo -e "${RED}✗ Frontend not accessible${NC}"
  fi
  
  # Check Prometheus
  if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prometheus running${NC}"
  else
    echo -e "${RED}✗ Prometheus not healthy${NC}"
  fi
  
  # Check Pi Node (if running)
  if curl -s http://localhost:31401/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Pi Node health check passed${NC}"
  else
    echo -e "${YELLOW}⚠ Pi Node not responding (optional, may not be configured)${NC}"
  fi
  
  # Check AIAR Controller
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AIAR Controller running${NC}"
  else
    echo -e "${YELLOW}⚠ AIAR Controller not responding (may still be starting)${NC}"
  fi
}

# Print summary
print_summary() {
  echo -e "\n${GREEN}=================================================="
  echo "AIAR Setup Complete!"
  echo "==================================================${NC}"
  echo ""
  echo "Access points:"
  echo "  Frontend:     http://localhost:8080"
  echo "  Backend API:  http://localhost:3000"
  echo "  Prometheus:   http://localhost:9090"
  echo "  AIAR Agent:   http://localhost:8000"
  echo "  Pi Node:      http://localhost:31401"
  echo ""
  echo "Logs:"
  echo "  docker-compose -f docker-compose.aiar.yml logs -f backend"
  echo "  docker-compose -f docker-compose.aiar.yml logs -f aiar-controller"
  echo ""
  echo "Configuration:"
  echo "  cat aiar/config.yaml        (Agent configuration)"
  echo "  cat .env                    (Environment variables)"
  echo ""
  echo "Next steps:"
  echo "  1. Update .env with your Docker Build Cloud token"
  echo "  2. Update .env with your Pi Network credentials"
  echo "  3. Review aiar/config.yaml and adjust approval thresholds"
  echo "  4. Monitor metrics at http://localhost:9090"
  echo ""
}

# Main execution
main() {
  check_prerequisites
  setup_environment
  setup_buildx
  build_aiar_image
  deploy_compose
  verify_deployment
  print_summary
}

main "$@"
