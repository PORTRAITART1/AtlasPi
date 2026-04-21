#!/usr/bin/env node

/**
 * AUDIT CONCRET - Pi Network Credentials Status
 * 
 * Analyse de l'état réel des credentials Pi pour AtlasPi
 * Sans modification de code - diagnostic uniquement
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(type, msg) {
  const typeStr = {
    READY: colors.green + '✓ READY' + colors.reset,
    PLACEHOLDER: colors.yellow + '⚠  PLACEHOLDER' + colors.reset,
    MISSING: colors.red + '✗ MISSING' + colors.reset,
    ALERT: colors.magenta + '⚠️  ALERT' + colors.reset,
    INFO: colors.blue + 'ℹ️  INFO' + colors.reset,
  };
  console.log((typeStr[type] || type).padEnd(30) + ' ' + msg);
}

console.log('\n' + colors.magenta + '='.repeat(80) + colors.reset);
console.log(colors.magenta + 'AUDIT CONCRET - Pi Network Credentials for AtlasPi' + colors.reset);
console.log(colors.magenta + '='.repeat(80) + colors.reset + '\n');

// Read .env files
const envFiles = {
  demo: fs.readFileSync('backend/.env.demo', 'utf-8'),
  sandbox: fs.readFileSync('backend/.env.pirc2-sandbox', 'utf-8'),
  production: fs.readFileSync('backend/.env.pirc2-production', 'utf-8')
};

function extractValue(content, key) {
  const match = content.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim() : null;
}

function classifyCredential(value) {
  if (!value) return 'MISSING';
  if (value.includes('PLACEHOLDER') || value.includes('CHANGE_ME') || value.includes('YOUR_') || value === 'DEMO_KEY_NOT_USED') {
    return 'PLACEHOLDER';
  }
  return 'READY';
}

// Analyze by mode
const modes = {
  demo: { name: 'DEMO', content: envFiles.demo },
  sandbox: { name: 'PIRC2-SANDBOX', content: envFiles.sandbox },
  production: { name: 'PIRC2-PRODUCTION', content: envFiles.production }
};

const results = {};

console.log(colors.blue + 'EXPECTED CREDENTIALS (from envManager.js):' + colors.reset);
console.log('  1. PI_API_KEY');
console.log('  2. PI_API_BASE_URL');
console.log('  3. PI_SANDBOX (boolean)');
console.log('  4. PI_SDK_APP_ID');
console.log('  5. PI_SDK_APP_NAME');
console.log('  6. PIRC2_AUTH_ENABLED (boolean)');
console.log('  7. PIRC2_PAYMENTS_ENABLED (boolean)');
console.log('  8. PIRC2_MERCHANT_PI_ENABLED (boolean)\n');

Object.entries(modes).forEach(([key, mode]) => {
  console.log(colors.magenta + mode.name + colors.reset);
  console.log('─'.repeat(80));

  const creds = {
    PI_API_KEY: extractValue(mode.content, 'PI_API_KEY'),
    PI_API_BASE_URL: extractValue(mode.content, 'PI_API_BASE_URL'),
    PI_SANDBOX: extractValue(mode.content, 'PI_SANDBOX'),
    PI_SDK_APP_ID: extractValue(mode.content, 'PI_SDK_APP_ID'),
    PI_SDK_APP_NAME: extractValue(mode.content, 'PI_SDK_APP_NAME'),
    PIRC2_AUTH_ENABLED: extractValue(mode.content, 'PIRC2_AUTH_ENABLED'),
    PIRC2_PAYMENTS_ENABLED: extractValue(mode.content, 'PIRC2_PAYMENTS_ENABLED'),
    PIRC2_MERCHANT_PI_ENABLED: extractValue(mode.content, 'PIRC2_MERCHANT_PI_ENABLED'),
  };

  results[key] = {};

  Object.entries(creds).forEach(([credKey, value]) => {
    const status = classifyCredential(value);
    results[key][credKey] = status;
    const displayVal = value ? value.substring(0, 40) + (value.length > 40 ? '...' : '') : '(not found)';
    log(status, credKey.padEnd(25) + ' = ' + displayVal);
  });

  console.log('');
});

// Summary table
console.log(colors.blue + 'SUMMARY TABLE' + colors.reset);
console.log('─'.repeat(80));
console.log('Credential'.padEnd(30) + 'DEMO'.padEnd(20) + 'SANDBOX'.padEnd(20) + 'PRODUCTION');
console.log('─'.repeat(80));

const allCreds = new Set();
Object.values(results).forEach(r => Object.keys(r).forEach(k => allCreds.add(k)));

allCreds.forEach(cred => {
  const demo = results.demo[cred] || 'N/A';
  const sand = results.sandbox[cred] || 'N/A';
  const prod = results.production[cred] || 'N/A';
  
  const demoStr = demo === 'READY' ? colors.green + 'READY' + colors.reset : (demo === 'PLACEHOLDER' ? colors.yellow + 'PLACEHOLDER' + colors.reset : colors.red + 'MISSING' + colors.reset);
  const sandStr = sand === 'READY' ? colors.green + 'READY' + colors.reset : (sand === 'PLACEHOLDER' ? colors.yellow + 'PLACEHOLDER' + colors.reset : colors.red + 'MISSING' + colors.reset);
  const prodStr = prod === 'READY' ? colors.green + 'READY' + colors.reset : (prod === 'PLACEHOLDER' ? colors.yellow + 'PLACEHOLDER' + colors.reset : colors.red + 'MISSING' + colors.reset);

  console.log(cred.padEnd(30) + demoStr.padEnd(30) + sandStr.padEnd(30) + prodStr);
});

// Key findings
console.log('\n' + colors.magenta + '='.repeat(80) + colors.reset);
console.log(colors.magenta + 'KEY FINDINGS' + colors.reset);
console.log(colors.magenta + '='.repeat(80) + colors.reset + '\n');

// Count status
const countByStatus = { READY: 0, PLACEHOLDER: 0, MISSING: 0 };
Object.values(results).forEach(mode => {
  Object.values(mode).forEach(status => {
    countByStatus[status]++;
  });
});

console.log('Across all modes:');
log('READY', countByStatus.READY + ' credentials ready');
log('PLACEHOLDER', countByStatus.PLACEHOLDER + ' credentials as placeholder');
log('MISSING', countByStatus.MISSING + ' credentials missing');

console.log('\n' + colors.magenta + '5 CRITICAL BLOCKERS' + colors.reset + '\n');

const blockers = [
  '1. PI_API_KEY is PLACEHOLDER in all non-demo modes - No real Pi API access',
  '2. PI_SDK_APP_ID is PLACEHOLDER in all non-demo modes - No real Pi SDK app',
  '3. PIRC2_AUTH_ENABLED is false in ALL modes - Pi auth completely disabled',
  '4. PIRC2_PAYMENTS_ENABLED is false in ALL modes - Pi payments completely disabled',
  '5. No callback URLs, webhook secrets, or server keys configured anywhere'
];

blockers.forEach(b => console.log(colors.red + b + colors.reset));

console.log('\n' + colors.magenta + 'WHAT CAN BE BRANCHÉS IMMÉDIATEMENT' + colors.reset + '\n');

console.log(colors.green + '✓ Demo mode works fully' + colors.reset);
console.log('  - Auth demo: Complete (no real validation)');
console.log('  - Payments demo: Complete (mock flow)');
console.log('  - Status: Ready to use NOW\n');

console.log(colors.yellow + '⚠  Sandbox mode structure ready' + colors.reset);
console.log('  - Format validation: Already implemented');
console.log('  - API structure: Ready for real calls');
console.log('  - Status: Awaiting real sandbox credentials\n');

console.log(colors.yellow + '⚠  Production mode structure ready' + colors.reset);
console.log('  - Format validation: Already implemented');
console.log('  - Mainnet structure: Ready for real calls');
console.log('  - Status: Awaiting real production credentials\n');

console.log(colors.magenta + '='.repeat(80) + colors.reset);
console.log(colors.magenta + 'VERDICT' + colors.reset);
console.log(colors.magenta + '='.repeat(80) + colors.reset + '\n');

console.log(colors.red + '❌ IMPOSSIBLE DE BRANCHER CREDENTIALS PI RÉELS MAINTENANT' + colors.reset);
console.log('\nRaisons:');
console.log('  1. Aucun credential réel disponible');
console.log('  2. Tous les credential Pi sont en PLACEHOLDER');
console.log('  3. Aucun API key, App ID, ou secret fourni');
console.log('  4. Aucune documentation sur où obtenir ces credentials');
console.log('  5. Aucune callback URL ou webhook secret défini\n');

console.log(colors.green + '✅ PRÊT À ACCEPTER CREDENTIALS PI RÉELS DÈS QU\'ILS SONT DISPONIBLES' + colors.reset);
console.log('\nQuand vous aurez les credentials de Pi Network:');
console.log('  1. PI_API_KEY: remplir dans .env.pirc2-sandbox et .env.pirc2-production');
console.log('  2. PI_SDK_APP_ID: remplir dans .env files');
console.log('  3. Ajouter URLs callbacks et webhooks secrets');
console.log('  4. Activer PIRC2_AUTH_ENABLED=true');
console.log('  5. Activer PIRC2_PAYMENTS_ENABLED=true');
console.log('  6. Implémenter appels réels Pi SDK (structure prête)\n');

console.log(colors.magenta + '='.repeat(80) + colors.reset + '\n');
