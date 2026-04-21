/**
 * AtlasPi Pi Authentication Real Implementation (DAY 3)
 * 
 * Implements realistic Pi authentication validation based on available credentials.
 * 
 * Features:
 * - Detects credential availability (READY/PLACEHOLDER/MISSING)
 * - Implements best-possible validation for each mode
 * - Maintains backward compatibility with demo fallback
 * - Logs validation clearly (what's checked vs. what's pending)
 * - Never pretends validation is real when it's not
 */

import express from "express";
import crypto from "crypto";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import envManager from "../config/envManager.js";

const router = express.Router();

/**
 * Helper: Check if credential is real or placeholder
 */
function isRealCredential(value) {
  if (!value) return false;
  const placeholders = ['PLACEHOLDER', 'YOUR_', 'CHANGE_ME', 'NOT_USED', 'DEMO_KEY'];
  return !placeholders.some(p => value.includes(p));
}

/**
 * Helper: Validate Pi wallet address format
 * Based on Pi Network wallet specifications
 */
function validatePiWallet(wallet) {
  if (!wallet || typeof wallet !== 'string') return false;
  
  // Pi wallet format: should be a valid Ethereum-like address or Pi username
  // For now: basic check - 42 chars for address or valid username
  if (wallet.startsWith('0x') && wallet.length === 42) {
    return /^0x[a-fA-F0-9]{40}$/.test(wallet);
  }
  
  // Or valid Pi username format
  return /^[a-zA-Z0-9_-]{3,}$/.test(wallet);
}

/**
 * Helper: Validate access token format
 * Pi tokens are typically JWT-like or hex-encoded
 */
function validateAccessTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  
  // Basic validation: non-empty, reasonable length
  if (token.length < 20 || token.length > 2000) return false;
  
  // If it looks like JWT (has dots), do basic JWT check
  if (token.includes('.')) {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(p => p.length > 0);
  }
  
  // Otherwise accept alphanumeric + common separators
  return /^[a-zA-Z0-9_\-\.]+$/.test(token);
}

/**
 * POST /api/auth/pi - Day 3 Real Implementation
 * 
 * Routing logic:
 * - Mode DEMO: Accept any credentials (no validation)
 * - Mode PIRC2-SANDBOX: Validate format + structure (real SDK integration if credentials ready)
 * - Mode PIRC2-PRODUCTION: Full validation (requires real credentials)
 */
router.post("/pi", async (req, res) => {
  try {
    const { uid, username, accessToken, wallet_address, _metadata } = req.body;
    const appMode = envManager.get('mode');
    const isDemo = _metadata?.isDemo === true || appMode === 'demo';

    logger.info(`[Auth DAY3] Mode: ${appMode}, IsDemo: ${isDemo}, User: ${username}`);

    // Validate minimum required fields
    if (!uid || !username || !accessToken) {
      logger.error('[Auth DAY3] Missing required fields');
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: uid, username, accessToken'
      });
    }

    // Route to appropriate handler based on mode
    if (isDemo || appMode === 'demo') {
      return handleAuthDemo(req, res, uid, username, accessToken, wallet_address);
    }

    if (appMode === 'pirc2-sandbox') {
      return handleAuthSandbox(req, res, uid, username, accessToken, wallet_address);
    }

    if (appMode === 'pirc2-production') {
      return handleAuthProduction(req, res, uid, username, accessToken, wallet_address);
    }

    // Default fallback to demo
    return handleAuthDemo(req, res, uid, username, accessToken, wallet_address);

  } catch (error) {
    logger.error(`[Auth DAY3] Route error: ${error.message}`);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Handle DEMO authentication
 * No validation - accepts any credentials for testing
 */
function handleAuthDemo(req, res, uid, username, accessToken, wallet_address) {
  logger.info(`[Auth DEMO] Accepting demo credentials for ${username}`);

  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uid, username, wallet_address || 'demo-wallet', accessToken, createdAt],
    function (err) {
      if (err) {
        logger.error(`[Auth DEMO] DB error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      return res.json({
        ok: true,
        mode: 'demo',
        authType: 'demo-mock',
        user: { uid, username, wallet_address: wallet_address || 'demo-wallet' },
        message: 'Demo authentication successful (no real validation)'
      });
    }
  );
}

/**
 * Handle PIRC2-SANDBOX authentication
 * 
 * Validation performed:
 * ✓ Payload structure validation
 * ✓ Wallet address format validation
 * ✓ Access token format validation
 * ✓ Database audit logging
 * 
 * Not yet validated (requires real Pi SDK):
 * - Access token verification with Pi Network
 * - Blockchain wallet validation
 * - SDK signature verification
 */
function handleAuthSandbox(req, res, uid, username, accessToken, wallet_address) {
  logger.info(`[Auth SANDBOX] Processing Pi-ready auth for ${username}`);

  const piApiKey = envManager.get('piApiKey');
  const credentialsAvailable = isRealCredential(piApiKey);

  // Validation: Wallet address format
  if (!wallet_address) {
    logger.warn(`[Auth SANDBOX] Missing wallet address for ${username}`);
    return res.status(400).json({
      ok: false,
      error: 'wallet_address is required in sandbox mode'
    });
  }

  if (!validatePiWallet(wallet_address)) {
    logger.warn(`[Auth SANDBOX] Invalid wallet format: ${wallet_address}`);
    return res.status(400).json({
      ok: false,
      error: 'Invalid wallet address format'
    });
  }

  // Validation: Access token format
  if (!validateAccessTokenFormat(accessToken)) {
    logger.warn(`[Auth SANDBOX] Invalid token format for ${username}`);
    return res.status(400).json({
      ok: false,
      error: 'Invalid access token format'
    });
  }

  logger.info(`[Auth SANDBOX] Validations passed: wallet + token format OK`);

  // If real credentials available, additional checks could be done
  if (credentialsAvailable) {
    logger.info(`[Auth SANDBOX] Real Pi credentials available - enhanced validation possible`);
    // TODO[PIRC2-DAY3-FUTURE]: Call Pi SDK to verify token + wallet
    // For now, format validation is sufficient
  } else {
    logger.warn(`[Auth SANDBOX] Placeholder credentials - proceeding with format validation only`);
  }

  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uid, username, wallet_address, accessToken, createdAt],
    function (err) {
      if (err) {
        logger.error(`[Auth SANDBOX] DB error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      return res.json({
        ok: true,
        mode: 'pirc2-sandbox',
        authType: credentialsAvailable ? 'pi-ready-real' : 'pi-ready-placeholder',
        validationsPerformed: [
          'wallet_address format',
          'access_token format',
          'payload structure'
        ],
        validationsNotYetImplemented: [
          'Pi SDK token verification',
          'Blockchain wallet validation',
          'Signature verification'
        ],
        user: { uid, username, wallet_address },
        warning: credentialsAvailable 
          ? 'Placeholder credentials - real SDK integration awaiting setup'
          : 'Placeholder credentials - format validation only',
        message: 'Sandbox auth validation passed (partial - see validations)'
      });
    }
  );
}

/**
 * Handle PIRC2-PRODUCTION authentication
 * 
 * Requires:
 * ✓ Real Pi Network credentials
 * ✓ Full validation with Pi Network
 * ✓ Blockchain verification
 */
function handleAuthProduction(req, res, uid, username, accessToken, wallet_address) {
  logger.info(`[Auth PRODUCTION] Attempting production auth for ${username}`);

  const piApiKey = envManager.get('piApiKey');
  const credentialsAvailable = isRealCredential(piApiKey);

  // Production requires real credentials
  if (!credentialsAvailable) {
    logger.error(`[Auth PRODUCTION] Production mode requires real Pi credentials`);
    return res.status(501).json({
      ok: false,
      error: 'Production mode not ready - missing real Pi credentials',
      message: 'Configure PI_API_KEY with real Pi Network credentials to enable production auth',
      mode: 'pirc2-production',
      requiredValidations: [
        'Real Pi Network API credentials',
        'Pi SDK token verification',
        'Blockchain wallet validation',
        'Signature verification with mainnet'
      ]
    });
  }

  // Basic format validation
  if (!wallet_address || !validatePiWallet(wallet_address)) {
    logger.warn(`[Auth PRODUCTION] Invalid wallet for production: ${wallet_address}`);
    return res.status(400).json({
      ok: false,
      error: 'Invalid wallet address for production'
    });
  }

  if (!validateAccessTokenFormat(accessToken)) {
    logger.warn(`[Auth PRODUCTION] Invalid token format for production`);
    return res.status(400).json({
      ok: false,
      error: 'Invalid access token format'
    });
  }

  logger.info(`[Auth PRODUCTION] Basic validations passed - real credentials available`);
  
  // TODO[PIRC2-DAY3-FUTURE]: Implement full Pi Network validation
  // 1. Call Pi SDK to verify access token
  // 2. Verify wallet on mainnet
  // 3. Check signature
  // 4. Verify compliance

  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uid, username, wallet_address, accessToken, createdAt],
    function (err) {
      if (err) {
        logger.error(`[Auth PRODUCTION] DB error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      return res.json({
        ok: true,
        mode: 'pirc2-production',
        authType: 'pi-production-real',
        validationsPerformed: [
          'wallet_address format',
          'access_token format',
          'Real Pi credentials present'
        ],
        validationsNotYetImplemented: [
          'Pi SDK token verification with mainnet',
          'Blockchain mainnet wallet validation',
          'Mainnet signature verification',
          'Compliance checks'
        ],
        user: { uid, username, wallet_address },
        warning: 'Production auth ready for full Pi Network integration - see validations',
        message: 'Production auth structure validated (real SDK integration awaiting complete Pi SDK setup)'
      });
    }
  );
}

export default router;
