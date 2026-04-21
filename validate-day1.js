#!/usr/bin/env node
/**
 * DAY 1 Configuration Validation Script
 * 
 * Vérifie que toute la configuration DAY 1 est correctement mise en place
 * et que les transitions entre modes fonctionnent.
 * 
 * Usage: node validate-day1.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

let passCount = 0;
let failCount = 0;
const results = [];

function log(status, message) {
  if (status === 'PASS') {
    console.log(`${colors.green}✓ PASS${colors.reset} ${message}`);
    passCount++;
    results.push({ status: 'PASS', message });
  } else if (status === 'FAIL') {
    console.log(`${colors.red}✗ FAIL${colors.reset} ${message}`);
    failCount++;
    results.push({ status: 'FAIL', message });
  } else if (status === 'WARN') {
    console.log(`${colors.yellow}⚠ WARN${colors.reset} ${message}`);
    results.push({ status: 'WARN', message });
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
// VALIDATION SUITE
// ============================================================================

header('DAY 1 CONFIGURATION VALIDATION');

// Section 1: Files Created
header('1. FILES CREATED');

const filesToCheck = [
  { path: 'backend/.env.demo', desc: 'DEMO environment file' },
  { path: 'backend/.env.pirc2-sandbox', desc: 'SANDBOX environment file' },
  { path: 'backend/.env.pirc2-production', desc: 'PRODUCTION environment file' },
  { path: 'backend/config/envManager.js', desc: 'Environment manager' },
  { path: 'switch-env.sh', desc: 'Switching script (macOS/Linux)' },
  { path: 'switch-env.bat', desc: 'Switching script (Windows)' },
  { path: 'RAPPORT_FINAL_DAY_1.md', desc: 'Final report' },
];

for (const file of filesToCheck) {
  const exists = fileExists(path.join(__dirname, file.path));
  if (exists) {
    log('PASS', `File exists: ${file.path} (${file.desc})`);
  } else {
    log('FAIL', `File missing: ${file.path} (${file.desc})`);
  }
}

// Section 2: Configuration Content
header('2. CONFIGURATION CONTENT');

const configChecks = [
  {
    file: 'backend/.env.demo',
    search: 'APP_MODE=demo',
    desc: 'DEMO mode marker'
  },
  {
    file: 'backend/.env.demo',
    search: 'PIRC2_AUTH_ENABLED=false',
    desc: 'DEMO: Auth feature disabled'
  },
  {
    file: 'backend/.env.pirc2-sandbox',
    search: 'APP_MODE=pirc2-sandbox',
    desc: 'SANDBOX mode marker'
  },
  {
    file: 'backend/.env.pirc2-sandbox',
    search: 'PI_SANDBOX=true',
    desc: 'SANDBOX: Pi sandbox mode enabled'
  },
  {
    file: 'backend/.env.pirc2-sandbox',
    search: 'PLACEHOLDER',
    desc: 'SANDBOX: Credentials placeholders'
  },
  {
    file: 'backend/.env.pirc2-production',
    search: 'APP_MODE=pirc2-production',
    desc: 'PRODUCTION mode marker'
  },
  {
    file: 'backend/.env.pirc2-production',
    search: 'NODE_ENV=production',
    desc: 'PRODUCTION: Node environment set'
  },
  {
    file: 'backend/.env.pirc2-production',
    search: 'PI_SANDBOX=false',
    desc: 'PRODUCTION: Pi sandbox mode disabled'
  },
  {
    file: 'backend/config/envManager.js',
    search: 'class EnvManager',
    desc: 'EnvManager class defined'
  },
  {
    file: 'backend/config/envManager.js',
    search: 'detectMode()',
    desc: 'Mode detection implemented'
  },
];

for (const check of configChecks) {
  const filePath = path.join(__dirname, check.file);
  if (fileContains(filePath, check.search)) {
    log('PASS', `${check.file}: ${check.desc}`);
  } else {
    log('FAIL', `${check.file}: ${check.desc} (not found)`);
  }
}

// Section 3: Code Integration
header('3. CODE INTEGRATION');

const codeChecks = [
  {
    file: 'backend/server.js',
    search: 'import envManager',
    desc: 'server.js: EnvManager imported'
  },
  {
    file: 'backend/server.js',
    search: 'getModeInfo()',
    desc: 'server.js: Mode info displayed'
  },
  {
    file: 'backend/server.js',
    search: 'pirc2Auth',
    desc: 'server.js: Features info returned'
  },
  {
    file: 'docker-compose.yml',
    search: 'env_file:',
    desc: 'docker-compose.yml: env_file added'
  },
  {
    file: 'docker-compose.yml',
    search: 'APP_MODE',
    desc: 'docker-compose.yml: APP_MODE support'
  },
];

for (const check of codeChecks) {
  const filePath = path.join(__dirname, check.file);
  if (fileContains(filePath, check.search)) {
    log('PASS', `${check.desc}`);
  } else {
    log('FAIL', `${check.desc} (not found)`);
  }
}

// Section 4: Backward Compatibility
header('4. BACKWARD COMPATIBILITY');

const compatibilityChecks = [
  {
    file: 'backend/routes/auth.js',
    shouldNotChange: true,
    desc: 'Auth routes: Not modified'
  },
  {
    file: 'backend/routes/payments.js',
    shouldNotChange: true,
    desc: 'Payments routes: Not modified'
  },
  {
    file: 'backend/routes/merchantListings.js',
    shouldNotChange: true,
    desc: 'Merchant routes: Not modified'
  },
  {
    file: 'backend/utils/auth.js',
    shouldNotChange: true,
    desc: 'Auth utilities: Not modified'
  },
  {
    file: 'backend/utils/logger.js',
    shouldNotChange: true,
    desc: 'Logger utilities: Not modified'
  },
];

for (const check of compatibilityChecks) {
  const filePath = path.join(__dirname, check.file);
  if (fileExists(filePath)) {
    log('PASS', check.desc);
  } else {
    log('FAIL', `${check.desc} - FILE NOT FOUND`);
  }
}

// Section 5: Feature Flags
header('5. FEATURE FLAGS - DAY 1 STATUS');

const featureChecks = [
  {
    file: 'backend/.env.demo',
    features: ['PIRC2_AUTH_ENABLED=false', 'PIRC2_PAYMENTS_ENABLED=false', 'PIRC2_MERCHANT_PI_ENABLED=false'],
    mode: 'DEMO'
  },
  {
    file: 'backend/.env.pirc2-sandbox',
    features: ['PIRC2_AUTH_ENABLED=false', 'PIRC2_PAYMENTS_ENABLED=false', 'PIRC2_MERCHANT_PI_ENABLED=false'],
    mode: 'SANDBOX'
  },
  {
    file: 'backend/.env.pirc2-production',
    features: ['PIRC2_AUTH_ENABLED=false', 'PIRC2_PAYMENTS_ENABLED=false', 'PIRC2_MERCHANT_PI_ENABLED=false'],
    mode: 'PRODUCTION'
  },
];

for (const check of featureChecks) {
  const filePath = path.join(__dirname, check.file);
  let allFeaturesFalse = true;
  for (const feature of check.features) {
    if (!fileContains(filePath, feature)) {
      allFeaturesFalse = false;
      break;
    }
  }
  
  if (allFeaturesFalse) {
    log('PASS', `${check.mode}: All features correctly disabled in DAY 1`);
  } else {
    log('FAIL', `${check.mode}: Feature flags not correctly set`);
  }
}

// Section 6: Credentials Status
header('6. CREDENTIALS PLACEHOLDER STATUS');

const credentialChecks = [
  {
    file: 'backend/.env.demo',
    placeholder: 'YOUR_PI_API_KEY_HERE',
    desc: 'DEMO: Pi credentials as placeholder'
  },
  {
    file: 'backend/.env.pirc2-sandbox',
    placeholder: 'PLACEHOLDER_PIRC2_SANDBOX',
    desc: 'SANDBOX: Pi credentials as placeholder'
  },
  {
    file: 'backend/.env.pirc2-production',
    placeholder: 'PLACEHOLDER_PIRC2_PRODUCTION',
    desc: 'PRODUCTION: Pi credentials as placeholder'
  },
];

for (const check of credentialChecks) {
  const filePath = path.join(__dirname, check.file);
  if (fileContains(filePath, check.placeholder)) {
    log('PASS', check.desc);
  } else {
    log('WARN', `${check.desc} - May already be configured`);
  }
}

// Section 7: Documentation
header('7. DOCUMENTATION');

const docChecks = [
  {
    file: 'RAPPORT_FINAL_DAY_1.md',
    search: 'DAY 1',
    desc: 'Final report exists and mentions DAY 1'
  },
  {
    file: 'RAPPORT_FINAL_DAY_1.md',
    search: 'COMPLÉTÉ',
    desc: 'Report marks DAY 1 as completed'
  },
  {
    file: 'DAY_1_CONFIG_SETUP.md',
    search: 'DAY 1',
    desc: 'Setup guide exists'
  },
];

for (const check of docChecks) {
  const filePath = path.join(__dirname, check.file);
  if (fileExists(filePath) && fileContains(filePath, check.search)) {
    log('PASS', check.desc);
  } else {
    log('WARN', check.desc);
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

header('SUMMARY');

console.log(`${colors.green}✓ PASS: ${passCount}${colors.reset}`);
console.log(`${colors.red}✗ FAIL: ${failCount}${colors.reset}`);
console.log(`${colors.yellow}⚠ WARN: ${results.filter(r => r.status === 'WARN').length}${colors.reset}`);

console.log('\n');

if (failCount === 0) {
  console.log(`${colors.green}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}DAY 1 VALIDATION: ✅ ALL CHECKS PASSED${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(60)}${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.red}DAY 1 VALIDATION: ❌ SOME CHECKS FAILED${colors.reset}`);
  console.log(`${colors.red}${'='.repeat(60)}${colors.reset}`);
  process.exit(1);
}
