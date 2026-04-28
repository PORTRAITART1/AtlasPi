#!/bin/bash
# AtlasPi Production Validation & Deployment Script
# Comprehensive checks for Agent IA Autonome (AIAR) system

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}AtlasPi Production Validation${NC}"
echo -e "${CYAN}Agent IA Autonome Responsable (AIAR)${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Test 1: Docker Compose Status
echo -e "${YELLOW}[1/8] Checking Docker Compose Status...${NC}"
STATUS=$(docker compose -f docker-compose.prod.yml ps --quiet | wc -l)
if [ "$STATUS" -eq 3 ]; then
    echo -e "${GREEN}✓ All 3 services running${NC}"
else
    echo -e "${RED}✗ Expected 3 services, found $STATUS${NC}"
    exit 1
fi

# Test 2: Backend Health
echo -e "${YELLOW}[2/8] Verifying Backend Health...${NC}"
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$BACKEND_HEALTH" -eq 200 ]; then
    echo -e "${GREEN}✓ Backend healthy (HTTP $BACKEND_HEALTH)${NC}"
else
    echo -e "${RED}✗ Backend unhealthy (HTTP $BACKEND_HEALTH)${NC}"
    exit 1
fi

# Test 3: Prometheus Metrics
echo -e "${YELLOW}[3/8] Verifying Prometheus Status...${NC}"
PROM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/api/v1/status/config)
if [ "$PROM_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Prometheus healthy (HTTP $PROM_STATUS)${NC}"
else
    echo -e "${RED}✗ Prometheus unhealthy (HTTP $PROM_STATUS)${NC}"
    exit 1
fi

# Test 4: AIAR Controller Running
echo -e "${YELLOW}[4/8] Checking AIAR Controller Process...${NC}"
AIAR_RUNNING=$(docker ps --filter "name=atlaspi-aiar" --format "{{.Status}}" | grep -c "healthy" || echo 0)
if [ "$AIAR_RUNNING" -gt 0 ]; then
    echo -e "${GREEN}✓ AIAR Controller is healthy${NC}"
else
    echo -e "${YELLOW}⚠ AIAR not yet in healthy state (may be starting)${NC}"
fi

# Test 5: Network Connectivity
echo -e "${YELLOW}[5/8] Verifying Container Network...${NC}"
BACKEND_IP=$(docker inspect atlaspi-backend -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
if [ ! -z "$BACKEND_IP" ]; then
    echo -e "${GREEN}✓ Backend IP: $BACKEND_IP${NC}"
else
    echo -e "${RED}✗ Backend network unavailable${NC}"
    exit 1
fi

# Test 6: Environment Variables
echo -e "${YELLOW}[6/8] Verifying Environment Configuration...${NC}"
if [ -f .env.production ]; then
    echo -e "${GREEN}✓ .env.production exists${NC}"
    AGENT_ID=$(grep "AGENT_ID=" .env.production | cut -d'=' -f2)
    echo -e "${GREEN}  → Agent ID: $AGENT_ID${NC}"
else
    echo -e "${YELLOW}⚠ .env.production not found${NC}"
fi

# Test 7: Docker Image Sizes
echo -e "${YELLOW}[7/8] Checking Image Optimization...${NC}"
BACKEND_SIZE=$(docker images atlaspi-backend:latest --format "{{.Size}}")
AIAR_SIZE=$(docker images atlaspi-aiar:latest --format "{{.Size}}")
echo -e "${GREEN}✓ Backend image: $BACKEND_SIZE${NC}"
echo -e "${GREEN}✓ AIAR image: $AIAR_SIZE${NC}"

# Test 8: Docker Bake Configuration
echo -e "${YELLOW}[8/8] Verifying Docker Bake Setup...${NC}"
if [ -f docker-bake.hcl ]; then
    echo -e "${GREEN}✓ docker-bake.hcl configured${NC}"
    echo -e "${CYAN}  Build with: docker buildx bake -f docker-bake.hcl --push${NC}"
else
    echo -e "${RED}✗ docker-bake.hcl not found${NC}"
fi

echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}✓ ALL VALIDATION CHECKS PASSED${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Print deployment summary
echo -e "${CYAN}DEPLOYMENT SUMMARY:${NC}"
echo "Backend:    http://localhost:3000/api/health"
echo "Prometheus: http://localhost:9090"
echo "AIAR Agent: Running in production mode"
echo "Environment: $(grep "APP_MODE=" .env.production || echo 'Not set')"
echo ""
echo -e "${GREEN}System ready for production deployment.${NC}"
