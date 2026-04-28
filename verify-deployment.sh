#!/usr/bin/env bash
# AtlasPi Deployment Verification Script
# Checks everything is ready before deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AtlasPi - Pre-Deployment Verification                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_TOTAL=0

# Function to check item
check() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $2"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌${NC} $2"
    fi
}

# 1. Check Node.js
echo "Checking dependencies..."
command -v node >/dev/null 2>&1
check $? "Node.js installed"

command -v npm >/dev/null 2>&1
check $? "npm installed"

command -v git >/dev/null 2>&1
check $? "Git installed"

echo ""
echo "Checking project structure..."

# 2. Check files exist
[ -f ".env.local" ]
check $? ".env.local exists"

[ -f "package.json" ]
check $? "Root package.json exists"

[ -f "backend/package.json" ]
check $? "Backend package.json exists"

[ -f "frontend/package.json" ]
check $? "Frontend package.json exists (optional)"

[ -d "backend/src" ]
check $? "Backend src directory exists"

[ -f "backend/src/services/pi-payment.ts" ]
check $? "Backend PI payment service exists"

[ -f "backend/src/routes/payments.ts" ]
check $? "Backend payment routes exist"

echo ""
echo "Checking environment configuration..."

# 3. Check .env.local
if [ -f ".env.local" ]; then
    grep -q "PI_SERVER_API_KEY=" .env.local
    check $? "PI_SERVER_API_KEY configured"
    
    grep -q "PI_APP_ID=" .env.local
    check $? "PI_APP_ID configured"
    
    grep -q "PI_NETWORK=testnet" .env.local
    check $? "PI_NETWORK set to testnet (safe for testing)"
fi

echo ""
echo "Checking Git status..."

# 4. Check Git
git rev-parse --is-inside-work-tree >/dev/null 2>&1
check $? "Git repository initialized"

[ ! -z "$(git status --porcelain)" ]
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}⚠️${NC}  Uncommitted changes exist (will be committed)"
else
    echo -e "${GREEN}✅${NC}  Git working directory clean"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

echo ""
echo "Checking security..."

# 5. Security checks
! grep -q "your_server_api_key" .env.local
check $? ".env.local doesn't contain placeholder values"

! grep -r "PI_SERVER_API_KEY" .gitignore >/dev/null 2>&1 || grep -q ".env" .gitignore
check $? ".env files are in .gitignore"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo "║  Status: ✅ ALL CHECKS PASSED - READY TO DEPLOY         ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "1. Commit changes: git add . && git commit -m 'Deploy'"
    echo "2. Push to GitHub: git push origin main"
    echo "3. Monitor Render: https://dashboard.render.com"
    echo ""
    exit 0
else
    FAILED=$((CHECKS_TOTAL - CHECKS_PASSED))
    echo "║  Status: ❌ $FAILED CHECK(S) FAILED - FIX BEFORE DEPLOY ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
fi
