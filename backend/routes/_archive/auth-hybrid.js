/**
 * AtlasPi Auth Route - DAY 2 / Pi Integration Setup
 * 
 * This route supports:
 * - Demo authentication (existing flows)
 * - Pi-ready authentication (DAY 2 structure for real Pi auth)
 * - Production authentication (DAY 3+ with real Pi SDK)
 * 
 * IMPORTANT: This is hybrid/preparatory structure.
 * Full Pi authentication validation happens in DAY 3.
 */

import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import envManager from "../config/envManager.js";

const router = express.Router();

/**
 * POST /api/auth/pi - Centralized authentication endpoint
 * 
 * Supports both demo and Pi-ready auth payloads.
 * Routes based on mode and payload structure.
 */
router.post("/pi", (req, res) => {
  try {
    const { uid, username, accessToken, wallet_address, _metadata } = req.body;

    // Validate required fields
    if (!uid || !username || !accessToken) {
      logger.error("Auth failed: missing required fields");
      return res.status(400).json({
        ok: false,
        error: "Missing required auth fields: uid, username, accessToken"
      });
    }

    // Determine auth source from metadata
    const isDemo = _metadata?.isDemo === true;
    const authSource = _metadata?.source || 'unknown';
    
    logger.info(`[Auth] Attempting ${isDemo ? 'DEMO' : 'Pi-ready'} auth for user ${username} (uid=${uid})`);

    // If demo mode, accept freely
    if (isDemo) {
      return handleDemoAuth(req, res, uid, username, accessToken, wallet_address);
    }

    // If Pi-ready mode, validate payload structure
    const appMode = envManager.get('mode');
    
    if (appMode === 'pirc2-sandbox' || appMode === 'pi-ready') {
      return handlePiReadyAuth(req, res, uid, username, accessToken, wallet_address);
    }

    // If production mode, require strict validation
    if (appMode === 'pirc2-production') {
      return handlePiProductionAuth(req, res, uid, username, accessToken, wallet_address);
    }

    // Default to demo
    return handleDemoAuth(req, res, uid, username, accessToken, wallet_address);

  } catch (error) {
    logger.error("Auth route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * Handle demo authentication
 * Accepts any credentials, logs them for demo purposes
 */
function handleDemoAuth(req, res, uid, username, accessToken, wallet_address) {
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uid, username, wallet_address || "", accessToken, createdAt],
    function (err) {
      if (err) {
        logger.error("Database error on demo auth insert: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error"
        });
      }

      logger.info(`[Auth DEMO] Success for user ${username} (${uid})`);

      return res.json({
        ok: true,
        message: "Demo auth received and logged",
        authMode: "demo",
        user: {
          uid,
          username,
          wallet_address: wallet_address || null,
          access_token: accessToken,
          isDemo: true
        }
      });
    }
  );
}

/**
 * Handle Pi-ready authentication
 * Validates payload structure for real Pi auth
 * (Full validation happens in DAY 3)
 */
function handlePiReadyAuth(req, res, uid, username, accessToken, wallet_address) {
  logger.info(`[Auth Pi-READY] Validating payload structure for ${username}`);

  // Basic payload validation
  // In DAY 3, this will include:
  // - Pi SDK signature verification
  // - Blockchain wallet validation
  // - Access token verification with Pi network
  
  // For now, accept structure but mark as awaiting validation
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uid, username, wallet_address || "", accessToken, createdAt],
    function (err) {
      if (err) {
        logger.error("Database error on Pi-ready auth insert: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error"
        });
      }

      logger.info(`[Auth Pi-READY] Payload logged for ${username} - full validation in DAY 3`);

      return res.json({
        ok: true,
        message: "Pi-ready auth payload received - full validation pending (DAY 3)",
        authMode: "pi-ready",
        validationStatus: "pending", // Will change to 'verified' in DAY 3
        user: {
          uid,
          username,
          wallet_address: wallet_address || null,
          access_token: accessToken,
          isPiReady: true
        },
        warning: "Full Pi blockchain validation not yet implemented - use for testing only"
      });
    }
  );
}

/**
 * Handle production Pi authentication
 * Requires full validation (DAY 3+)
 */
function handlePiProductionAuth(req, res, uid, username, accessToken, wallet_address) {
  logger.warn(`[Auth PRODUCTION] Auth attempt in production mode - DAY 3+ required`);

  // In production, Pi auth MUST be fully implemented and validated
  // For now, reject with clear message
  
  return res.status(501).json({
    ok: false,
    error: "Production Pi authentication not yet implemented",
    authMode: "pirc2-production",
    message: "Full Pi SDK integration and blockchain validation required - coming in DAY 3",
    requiredValidations: [
      "Pi SDK signature verification",
      "Blockchain wallet validation",
      "Access token verification with Pi network",
      "KYC/compliance checks"
    ]
  });
}

export default router;
