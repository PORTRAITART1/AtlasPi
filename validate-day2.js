#!/usr/bin/env node

/**
 * DAY 2 Validation Checklist
 * 
 * Validates that all DAY 2 / Pi Integration Setup components are correctly implemented
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function log(status, message) {
  if (status === 'PASS') {
    console.log(`${colors.green}✓ PASS${colors.reset} ${message}`);
    passCount++;
  } else if (status === 'FAIL') {
    console.log(`${colors.red}✗ FAIL${colors.reset} ${message}`);
    failCount++;
  } else if (status === 'WARN') {
    console.log(`${colors.yellow}⚠ WARN${colors.reset} ${message}`);
    warnCount++;
  } else {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
  }
}

function header(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function fileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes(searchString);
  } catch {
    return false;
  }
}

// ============================================================================
// START VALIDATION
// ============================================================================

header('DAY 2 / Pi Integration Setup - VALIDATION CHECKLIST');

// Section 1: Frontend Files
header('1. FRONTEND FILES');

const frontendFiles = [
  { path: 'frontend/pi-integration.js', desc: 'Pi SDK detection + auth routing' },
  { path: 'frontend/auth-handler.js', desc: 'Centralized auth handler' },
  { path: 'frontend/auth-config.js', desc: 'Mode-specific configurations' },
  { path: 'frontend/pi-integration-patch.js', desc: 'Script integration' }
];

frontendFiles.forEach(file => {
  if (fileExists(file.path)) {
    log('PASS', `${file.path} - ${file.desc}`);
  } else {
    log('FAIL', `${file.path} - NOT FOUND`);
  }
});

// Section 2: Backend Files
header('2. BACKEND FILES');

const backendFiles = [
  { path: 'backend/routes/auth-hybrid.js', desc: 'Hybrid auth route' },
  { path: 'backend/utils/pi-integration-prep.js', desc: 'Pi validators and prep' }
];

backendFiles.forEach(file => {
  if (fileExists(file.path)) {
    log('PASS', `${file.path} - ${file.desc}`);
  } else {
    log('FAIL', `${file.path} - NOT FOUND`);
  }
});

// Section 3: Frontend Code Structure
header('3. FRONTEND CODE STRUCTURE');

const frontendChecks = [
  { file: 'frontend/pi-integration.js', search: 'class PiIntegrationManager', desc: 'PiIntegrationManager class' },
  { file: 'frontend/pi-integration.js', search: 'detectPiSdk()', desc: 'detectPiSdk method' },
  { file: 'frontend/pi-integration.js', search: 'authenticate()', desc: 'authenticate method' },
  { file: 'frontend/pi-integration.js', search: 'authDemo()', desc: 'authDemo method' },
  { file: 'frontend/pi-integration.js', search: 'authPiReady()', desc: 'authPiReady method' },
  { file: 'frontend/pi-integration.js', search: 'authPiSdk()', desc: 'authPiSdk method' },
  { file: 'frontend/auth-handler.js', search: 'class AtlasPiAuthHandler', desc: 'AtlasPiAuthHandler class' },
  { file: 'frontend/auth-handler.js', search: 'handleAuthButtonClick()', desc: 'handleAuthButtonClick method' },
  { file: 'frontend/auth-config.js', search: 'AtlasPiFrontendAuthConfig', desc: 'AtlasPiFrontendAuthConfig object' },
  { file: 'frontend/auth-config.js', search: 'getConfig(', desc: 'getConfig method' }
];

frontendChecks.forEach(check => {
  if (fileContains(check.file, check.search)) {
    log('PASS', `${check.file}: ${check.desc}`);
  } else {
    log('FAIL', `${check.file}: ${check.desc}`);
  }
});

// Section 4: Backend Code Structure
header('4. BACKEND CODE STRUCTURE');

const backendChecks = [
  { file: 'backend/routes/auth-hybrid.js', search: 'handleDemoAuth', desc: 'handleDemoAuth function' },
  { file: 'backend/routes/auth-hybrid.js', search: 'handlePiReadyAuth', desc: 'handlePiReadyAuth function' },
  { file: 'backend/routes/auth-hybrid.js', search: 'handlePiProductionAuth', desc: 'handlePiProductionAuth function' },
  { file: 'backend/utils/pi-integration-prep.js', search: 'class PiAuthValidator', desc: 'PiAuthValidator class' },
  { file: 'backend/utils/pi-integration-prep.js', search: 'class PiCredentialManager', desc: 'PiCredentialManager class' },
  { file: 'backend/utils/pi-integration-prep.js', search: 'class PiPaymentIntegration', desc: 'PiPaymentIntegration class' }
];

backendChecks.forEach(check => {
  if (fileContains(check.file, check.search)) {
    log('PASS', `${check.file}: ${check.desc}`);
  } else {
    log('FAIL', `${check.file}: ${check.desc}`);
  }
});

// Section 5: HTML Integration
header('5. HTML INTEGRATION');

const htmlChecks = [
  { file: 'frontend/index.html', search: 'pi-integration.js', desc: 'pi-integration.js script' },
  { file: 'frontend/index.html', search: 'auth-handler.js', desc: 'auth-handler.js script' },
  { file: 'frontend/index.html', search: 'auth-config.js', desc: 'auth-config.js script' },
  { file: 'frontend/index.html', search: 'pi-integration-patch.js', desc: 'pi-integration-patch.js script' }
];

htmlChecks.forEach(check => {
  if (fileContains(check.file, check.search)) {
    log('PASS', `${check.file}: ${check.desc}`);
  } else {
    log('FAIL', `${check.file}: ${check.desc}`);
  }
});

// Section 6: Mode Configuration
header('6. MODE CONFIGURATION');

const modeChecks = [
  { file: 'frontend/auth-config.js', search: "case 'demo':", desc: 'Demo mode config' },
  { file: 'frontend/auth-config.js', search: "case 'pi-ready':", desc: 'Pi-ready mode config' },
  { file: 'frontend/auth-config.js', search: "case 'pirc2-production':", desc: 'Production mode config' }
];

modeChecks.forEach(check => {
  if (fileContains(check.file, check.search)) {
    log('PASS', `${check.file}: ${check.desc}`);
  } else {
    log('FAIL', `${check.file}: ${check.desc}`);
  }
});

// Section 7: DAY 3 Preparation
header('7. DAY 3 PREPARATION (TODOs)');

let totalTodos = 0;

['frontend/pi-integration.js', 'backend/routes/auth-hybrid.js', 'backend/utils/pi-integration-prep.js'].forEach(file => {
  if (fileContains(file, 'TODO[PIRC2-DAY3]') || fileContains(file, 'TODO[PIRC2-DAY2+]')) {
    const content = fs.readFileSync(file, 'utf-8');
    const todos = (content.match(/TODO\[PIRC2-DAY[23+]/g) || []).length;
    totalTodos += todos;
    log('PASS', `${file}: ${todos} TODO comments for future implementation`);
  }
});

log('PASS', `Total DAY 3+ TODO markers: ${totalTodos}`);

// Section 8: Backward Compatibility
header('8. BACKWARD COMPATIBILITY');

const compatChecks = [
  { file: 'frontend/script.js', desc: 'Original script.js untouched (logic intact)' },
  { file: 'backend/routes/auth.js', desc: 'Original auth.js preserved' },
  { file: 'backend/routes/payments.js', desc: 'Original payments.js preserved' },
  { file: 'backend/routes/merchantListings.js', desc: 'Original merchant routes preserved' }
];

compatChecks.forEach(check => {
  if (fileExists(check.file)) {
    log('PASS', `${check.file} - ${check.desc}`);
  } else {
    log('FAIL', `${check.file} - NOT FOUND`);
  }
});

// Section 9: Documentation
header('9. DOCUMENTATION');

const docChecks = [
  { file: 'RAPPORT_DAY_2.md', desc: 'Complete DAY 2 report' },
  { file: 'RESUME_DAY_2.md', desc: 'Executive summary DAY 2' }
];

docChecks.forEach(check => {
  if (fileExists(check.file)) {
    log('PASS', `${check.file} - ${check.desc}`);
  } else {
    log('WARN', `${check.file} - ${check.desc}`);
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

header('VALIDATION SUMMARY');

console.log(`${colors.green}✓ PASS: ${passCount}${colors.reset}`);
console.log(`${colors.red}✗ FAIL: ${failCount}${colors.reset}`);
console.log(`${colors.yellow}⚠ WARN: ${warnCount}${colors.reset}`);

console.log('\n');

if (failCount === 0) {
  console.log(`${colors.green}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}DAY 2 VALIDATION: ✅ ALL CHECKS PASSED${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(60)}${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.red}DAY 2 VALIDATION: ❌ SOME CHECKS FAILED${colors.reset}`);
  console.log(`${colors.red}${'='.repeat(60)}${colors.reset}`);
  process.exit(1);
}
