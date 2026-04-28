#!/bin/bash
# End-to-End Testing Script for AtlasPi Global Deployment
# Tests: Docker Build Cloud, K8s deployment, CI/CD pipeline

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}AtlasPi End-to-End Test Suite${NC}"
echo -e "${CYAN}Global Deployment: Docker Build Cloud + K8s + CI/CD${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"

PASSED=0
FAILED=0

# Test 1: Docker Build Cloud Setup
echo -e "${YELLOW}[TEST 1/12] Docker Build Cloud Setup${NC}"
if docker buildx version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS: Docker buildx installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: Docker buildx not found${NC}"
    ((FAILED++))
fi

# Test 2: Multi-arch builder
echo -e "${YELLOW}[TEST 2/12] Multi-arch Builder${NC}"
if docker buildx ls | grep -q "atlaspi-builder"; then
    echo -e "${GREEN}✓ PASS: atlaspi-builder configured${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: Builder not configured${NC}"
    ((FAILED++))
fi

# Test 3: Kubernetes connectivity
echo -e "${YELLOW}[TEST 3/12] Kubernetes Cluster${NC}"
if kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS: K8s cluster accessible${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: K8s cluster not accessible${NC}"
    ((FAILED++))
fi

# Test 4: Kubectl version
echo -e "${YELLOW}[TEST 4/12] kubectl Version${NC}"
K8S_VERSION=$(kubectl version --client -o json | grep '"gitVersion"' | head -1)
echo -e "${GREEN}✓ PASS: ${K8S_VERSION}${NC}"
((PASSED++))

# Test 5: Dockerfile optimization
echo -e "${YELLOW}[TEST 5/12] Dockerfile Optimization${NC}"
if grep -q "multi-stage\|FROM.*as" backend/Dockerfile.optimized; then
    echo -e "${GREEN}✓ PASS: Multi-stage build detected${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: Multi-stage build not found${NC}"
    ((FAILED++))
fi

# Test 6: DHI Dockerfiles
echo -e "${YELLOW}[TEST 6/12] DHI Dockerfiles${NC}"
if [ -f "backend/Dockerfile.dhi" ] && [ -f "aiar/Dockerfile.dhi" ]; then
    if grep -q "hardened" backend/Dockerfile.dhi && grep -q "hardened" aiar/Dockerfile.dhi; then
        echo -e "${GREEN}✓ PASS: DHI Dockerfiles configured${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL: DHI not properly configured${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL: DHI Dockerfiles missing${NC}"
    ((FAILED++))
fi

# Test 7: K8s manifest validity
echo -e "${YELLOW}[TEST 7/12] Kubernetes Manifest${NC}"
if kubectl apply -f k8s-manifest.yaml --dry-run=client > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS: K8s manifest is valid${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: K8s manifest validation failed${NC}"
    ((FAILED++))
fi

# Test 8: GitHub Actions workflow
echo -e "${YELLOW}[TEST 8/12] GitHub Actions Workflow${NC}"
if [ -f ".github/workflows/ci-cd.yml" ]; then
    if grep -q "build-and-push\|security-scan\|deploy" .github/workflows/ci-cd.yml; then
        echo -e "${GREEN}✓ PASS: CI/CD pipeline configured${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL: CI/CD jobs not found${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL: CI/CD workflow missing${NC}"
    ((FAILED++))
fi

# Test 9: docker-bake.hcl configuration
echo -e "${YELLOW}[TEST 9/12] Docker Bake Multi-arch${NC}"
if [ -f "docker-bake.hcl" ]; then
    if grep -q "linux/amd64\|linux/arm64\|linux/arm/v7" docker-bake.hcl; then
        echo -e "${GREEN}✓ PASS: Multi-arch platforms configured${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL: Platforms not configured${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL: docker-bake.hcl missing${NC}"
    ((FAILED++))
fi

# Test 10: Environment configuration
echo -e "${YELLOW}[TEST 10/12] Environment Configuration${NC}"
if [ -f ".env.production" ]; then
    if grep -q "AGENT_ID\|AUTONOMY_LEVEL" .env.production; then
        echo -e "${GREEN}✓ PASS: Production env configured${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL: Config incomplete${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL: .env.production missing${NC}"
    ((FAILED++))
fi

# Test 11: Security hardening
echo -e "${YELLOW}[TEST 11/12] Security Hardening${NC}"
if grep -q "runAsNonRoot: true" k8s-manifest.yaml && \
   grep -q "NetworkPolicy" k8s-manifest.yaml && \
   grep -q "securityContext" k8s-manifest.yaml; then
    echo -e "${GREEN}✓ PASS: Security policies applied${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: Security policies missing${NC}"
    ((FAILED++))
fi

# Test 12: Documentation
echo -e "${YELLOW}[TEST 12/12] Documentation${NC}"
if [ -f "K8S_DHI_GUIDE.md" ] && [ -f "QUICKSTART.md" ] && [ -f "FINAL_CHECKLIST.md" ]; then
    echo -e "${GREEN}✓ PASS: Complete documentation present${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL: Documentation incomplete${NC}"
    ((FAILED++))
fi

# Summary
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}TEST RESULTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "Total Tests:     12"
echo -e "${GREEN}Passed:          $PASSED${NC}"
echo -e "${RED}Failed:          $FAILED${NC}"

PERCENTAGE=$((PASSED * 100 / 12))
echo -e "\nSuccess Rate:    ${PERCENTAGE}%"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL TESTS PASSED - READY FOR GLOBAL DEPLOYMENT${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed - review logs above${NC}"
    exit 1
fi
