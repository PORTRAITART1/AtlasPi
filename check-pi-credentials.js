#!/usr/bin/env node

const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

console.log('\n' + colors.blue + '='.repeat(70) + colors.reset);
console.log(colors.blue + 'AtlasPi - Pi Credentials Status (DAY 3)' + colors.reset);
console.log(colors.blue + '='.repeat(70) + colors.reset + '\n');

const modes = ['demo', 'pirc2-sandbox', 'pirc2-production'];

function isRealCredential(value) {
  if (!value) return 'MISSING';
  const placeholders = ['PLACEHOLDER', 'YOUR_', 'CHANGE_ME', 'NOT_USED', 'DEMO_KEY'];
  return placeholders.some(p => value.includes(p)) ? 'PLACEHOLDER' : 'READY';
}

modes.forEach(mode => {
  const envFile = 'backend/.env.' + mode;
  let content = '';
  try {
    content = fs.readFileSync(envFile, 'utf-8');
  } catch (e) {
    console.log(colors.red + 'Cannot read ' + envFile + colors.reset);
    return;
  }

  const piApiKey = (content.match(/PI_API_KEY=(.+)/) || [])[1] || '';
  const piSdkAppId = (content.match(/PI_SDK_APP_ID=(.+)/) || [])[1] || '';

  const keyStatus = isRealCredential(piApiKey.trim());
  const appIdStatus = isRealCredential(piSdkAppId.trim());

  console.log('Mode: ' + mode);
  console.log('  PI_API_KEY: ' + (keyStatus === 'READY' ? colors.green : colors.yellow) + keyStatus + colors.reset);
  console.log('  PI_SDK_APP_ID: ' + (appIdStatus === 'READY' ? colors.green : colors.yellow) + appIdStatus + colors.reset);
  console.log('');
});

console.log(colors.blue + '='.repeat(70) + colors.reset + '\n');
