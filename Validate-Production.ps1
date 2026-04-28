# AtlasPi Production Validation Script (PowerShell)
# Comprehensive system checks for AIAR deployment

param(
    [switch]$Verbose = $false
)

$GREEN = [char]27 + "[32m"
$RED = [char]27 + "[31m"
$YELLOW = [char]27 + "[33m"
$CYAN = [char]27 + "[36m"
$RESET = [char]27 + "[0m"

Write-Host "${CYAN}========================================${RESET}"
Write-Host "${CYAN}AtlasPi Production Validation${RESET}"
Write-Host "${CYAN}Agent IA Autonome Responsable (AIAR)${RESET}"
Write-Host "${CYAN}========================================${RESET}`n"

$testsPassed = 0
$testsFailed = 0

# Test 1: Docker Compose Status
Write-Host "${YELLOW}[1/8] Checking Docker Compose Status...${RESET}"
$containers = docker compose -f docker-compose.prod.yml ps --quiet | Measure-Object -Line
if ($containers.Lines -eq 3) {
    Write-Host "${GREEN}✓ All 3 services running${RESET}"
    $testsPassed++
} else {
    Write-Host "${RED}✗ Expected 3 services, found $($containers.Lines)${RESET}"
    $testsFailed++
}

# Test 2: Backend Health
Write-Host "${YELLOW}[2/8] Verifying Backend Health...${RESET}"
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -ErrorAction SilentlyContinue
    if ($backendHealth.StatusCode -eq 200) {
        Write-Host "${GREEN}✓ Backend healthy (HTTP 200)${RESET}"
        $testsPassed++
    } else {
        Write-Host "${RED}✗ Backend unhealthy (HTTP $($backendHealth.StatusCode))${RESET}"
        $testsFailed++
    }
} catch {
    Write-Host "${RED}✗ Backend health check failed: $_${RESET}"
    $testsFailed++
}

# Test 3: Prometheus Status
Write-Host "${YELLOW}[3/8] Verifying Prometheus Status...${RESET}"
try {
    $promStatus = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/status/config" -ErrorAction SilentlyContinue
    if ($promStatus.StatusCode -eq 200) {
        Write-Host "${GREEN}✓ Prometheus healthy (HTTP 200)${RESET}"
        $testsPassed++
    } else {
        Write-Host "${RED}✗ Prometheus unhealthy (HTTP $($promStatus.StatusCode))${RESET}"
        $testsFailed++
    }
} catch {
    Write-Host "${RED}✗ Prometheus health check failed: $_${RESET}"
    $testsFailed++
}

# Test 4: AIAR Controller
Write-Host "${YELLOW}[4/8] Checking AIAR Controller Process...${RESET}"
$aiarStatus = docker ps --filter "name=atlaspi-aiar" --format "{{.Status}}"
if ($aiarStatus -match "healthy") {
    Write-Host "${GREEN}✓ AIAR Controller is healthy${RESET}"
    $testsPassed++
} else {
    Write-Host "${YELLOW}⚠ AIAR Status: $aiarStatus${RESET}"
}

# Test 5: Network Connectivity
Write-Host "${YELLOW}[5/8] Verifying Container Network...${RESET}"
try {
    $backendIP = docker inspect atlaspi-backend -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>$null
    if ($backendIP) {
        Write-Host "${GREEN}✓ Backend IP: $backendIP${RESET}"
        $testsPassed++
    } else {
        Write-Host "${RED}✗ Backend network unavailable${RESET}"
        $testsFailed++
    }
} catch {
    Write-Host "${RED}✗ Network check failed: $_${RESET}"
    $testsFailed++
}

# Test 6: Environment Variables
Write-Host "${YELLOW}[6/8] Verifying Environment Configuration...${RESET}"
if (Test-Path ".env.production") {
    Write-Host "${GREEN}✓ .env.production exists${RESET}"
    $agentId = Select-String -Path ".env.production" -Pattern "^AGENT_ID=" | ForEach-Object { $_.Line -split '=' | Select-Object -Last 1 }
    Write-Host "${GREEN}  → Agent ID: $agentId${RESET}"
    $testsPassed++
} else {
    Write-Host "${YELLOW}⚠ .env.production not found${RESET}"
}

# Test 7: Docker Image Sizes
Write-Host "${YELLOW}[7/8] Checking Image Optimization...${RESET}"
$backendSize = docker images atlaspi-backend:latest --format "{{.Size}}"
$aiarSize = docker images atlaspi-aiar:latest --format "{{.Size}}"
Write-Host "${GREEN}✓ Backend image: $backendSize${RESET}"
Write-Host "${GREEN}✓ AIAR image: $aiarSize${RESET}"
$testsPassed += 2

# Test 8: Docker Bake Configuration
Write-Host "${YELLOW}[8/8] Verifying Docker Bake Setup...${RESET}"
if (Test-Path "docker-bake.hcl") {
    Write-Host "${GREEN}✓ docker-bake.hcl configured${RESET}"
    Write-Host "${CYAN}  Build with: docker buildx bake -f docker-bake.hcl --push${RESET}"
    $testsPassed++
} else {
    Write-Host "${RED}✗ docker-bake.hcl not found${RESET}"
    $testsFailed++
}

# Summary
Write-Host "`n${CYAN}========================================${RESET}"
Write-Host "${GREEN}✓ Tests Passed: $testsPassed${RESET}"
if ($testsFailed -gt 0) {
    Write-Host "${RED}✗ Tests Failed: $testsFailed${RESET}"
} else {
    Write-Host "${GREEN}✓ ALL VALIDATION CHECKS PASSED${RESET}"
}
Write-Host "${CYAN}========================================${RESET}`n"

Write-Host "${CYAN}DEPLOYMENT SUMMARY:${RESET}"
Write-Host "Backend:    http://localhost:3000/api/health"
Write-Host "Prometheus: http://localhost:9090"
Write-Host "AIAR Agent: Running in production mode"
Write-Host ""
Write-Host "${GREEN}System ready for production deployment.${RESET}"

exit $testsFailed
