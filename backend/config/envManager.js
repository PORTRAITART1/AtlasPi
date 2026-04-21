import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * EnvManager: Centralized environment configuration loader
 * 
 * Supports switching between modes:
 * - demo: Local development, no Pi integration
 * - pirc2-sandbox: Pi Network sandbox testing
 * - pirc2-production: Production with real Pi Network
 * 
 * Priority:
 * 1. Environment variable: APP_MODE or NODE_ENV
 * 2. .env file specific to mode (.env.demo, .env.pirc2-sandbox, .env.pirc2-production)
 * 3. Default .env file (fallback for common variables)
 */

class EnvManager {
  constructor() {
    this.mode = 'demo'; // Will be set by loadEnvironment()
    this.config = {};
    this.loadEnvironment();
  }

  /**
   * Detect the current mode from environment or default to 'demo'
   */
  detectMode() {
    // Priority 1: Environment variable
    if (process.env.APP_MODE) {
      const envMode = process.env.APP_MODE;
      if (['demo', 'pirc2-sandbox', 'pirc2-production'].includes(envMode)) {
        return envMode;
      }
    }

    // Priority 2: NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      return 'pirc2-production';
    }

    // Default to demo
    return 'demo';
  }

  /**
   * Load environment files in priority order
   * Note: dotenv.config() loads AND sets process.env, so we must check APP_MODE
   * AFTER loading default .env but BEFORE loading mode-specific .env
   */
  loadEnvironment() {
    // Step 1: Load default .env file (this may set APP_MODE)
    const defaultEnvPath = path.join(__dirname, '../.env');
    if (fs.existsSync(defaultEnvPath)) {
      dotenv.config({ path: defaultEnvPath });
      logger.info(`✓ Loaded default .env from ${defaultEnvPath}`);
    }

    // Step 2: Detect mode AFTER loading default .env (so APP_MODE from .env is considered)
    this.mode = this.detectMode();

    // Step 3: Load mode-specific .env file (override with final values)
    const modeEnvPath = path.join(__dirname, `../.env.${this.mode}`);
    if (fs.existsSync(modeEnvPath)) {
      dotenv.config({ path: modeEnvPath, override: true });
      logger.info(`✓ Loaded mode-specific .env.${this.mode} from ${modeEnvPath}`);
    } else {
      logger.warn(`⚠ Mode-specific env file not found: ${modeEnvPath}`);
    }

    // Step 4: Populate config object from environment
    this.config = {
      // Core
      mode: this.mode,
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,

      // Frontend
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
      frontendAppUrl: process.env.FRONTEND_APP_URL || null,

      // Admin
      adminSecret: process.env.ADMIN_SECRET || 'default-change-in-prod',

      // Pi Network
      piApiKey: process.env.PI_API_KEY || 'PLACEHOLDER',
      piApiBaseUrl: process.env.PI_API_BASE_URL || 'https://api.minepi.com',
      piSandbox: process.env.PI_SANDBOX === 'true',
      piSdkAppId: process.env.PI_SDK_APP_ID || 'PLACEHOLDER',
      piSdkAppName: process.env.PI_SDK_APP_NAME || 'AtlasPi',

      // PIRC2 Feature Flags
      pirc2AuthEnabled: process.env.PIRC2_AUTH_ENABLED === 'true',
      pirc2PaymentsEnabled: process.env.PIRC2_PAYMENTS_ENABLED === 'true',
      pirc2MerchantPiEnabled: process.env.PIRC2_MERCHANT_PI_ENABLED === 'true',

      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',
      debugMode: process.env.DEBUG_MODE === 'true',
      pirc2SandboxDebug: process.env.PIRC2_SANDBOX_DEBUG === 'true',

      // Security (Production)
      forceHttps: process.env.FORCE_HTTPS === 'true',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      paymentVerificationRequired: process.env.PAYMENT_VERIFICATION_REQUIRED === 'true',
      paymentWebhookTimeoutSeconds: parseInt(process.env.PAYMENT_WEBHOOK_TIMEOUT_SECONDS) || 30,
    };

    this.printConfig();
  }

  /**
   * Validate that critical credentials are not placeholder values
   * (except in DEMO mode where placeholders are expected)
   */
  validateCredentials() {
    if (this.mode === 'demo') {
      logger.info('DEMO mode: Placeholder credentials are expected');
      return true;
    }

    const placeholders = ['PLACEHOLDER', 'CHANGE_ME', 'YOUR_', 'NOT_USED'];
    const criticalKeys = [
      'piApiKey',
      'piSdkAppId',
      'adminSecret',
      'frontendUrl'
    ];

    const issues = [];
    for (const key of criticalKeys) {
      const value = this.config[key];
      if (!value) {
        issues.push(`Missing: ${key}`);
      } else if (placeholders.some(p => value.includes(p))) {
        issues.push(`Placeholder detected in ${key}: ${value.substring(0, 30)}...`);
      }
    }

    if (issues.length > 0) {
      logger.warn('⚠ Credential validation issues:');
      issues.forEach(issue => logger.warn(`  - ${issue}`));
      return false;
    }

    logger.info('✓ Credential validation passed');
    return true;
  }

  /**
   * Print current configuration (safe, no secrets)
   */
  printConfig() {
    logger.info('════════════════════════════════════════════════════════════');
    logger.info(`AtlasPi Environment Configuration (Mode: ${this.mode.toUpperCase()})`);
    logger.info('════════════════════════════════════════════════════════════');
    logger.info(`  App Mode:              ${this.config.mode}`);
    logger.info(`  Node Environment:      ${this.config.nodeEnv}`);
    logger.info(`  Port:                  ${this.config.port}`);
    logger.info(`  Frontend URL:          ${this.config.frontendUrl}`);
    logger.info(`  Pi API Base:           ${this.config.piApiBaseUrl}`);
    logger.info(`  Pi Sandbox Mode:       ${this.config.piSandbox}`);
    logger.info(`  PIRC2 Auth Enabled:    ${this.config.pirc2AuthEnabled}`);
    logger.info(`  PIRC2 Payments Enabled: ${this.config.pirc2PaymentsEnabled}`);
    logger.info(`  PIRC2 Merchant Pi:     ${this.config.pirc2MerchantPiEnabled}`);
    logger.info(`  Log Level:             ${this.config.logLevel}`);
    logger.info(`  Debug Mode:            ${this.config.debugMode}`);
    logger.info('════════════════════════════════════════════════════════════');
  }

  /**
   * Get a configuration value
   */
  get(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature) {
    const key = `pirc2${feature.charAt(0).toUpperCase() + feature.slice(1)}Enabled`;
    return this.config[key] === true;
  }

  /**
   * Check if running in specific mode
   */
  isMode(mode) {
    return this.mode === mode;
  }

  /**
   * Get mode information
   */
  getModeInfo() {
    return {
      mode: this.mode,
      isDemo: this.mode === 'demo',
      isSandbox: this.mode === 'pirc2-sandbox',
      isProduction: this.mode === 'pirc2-production',
      description: this.getModeDescription(),
    };
  }

  /**
   * Get human-readable mode description
   */
  getModeDescription() {
    switch (this.mode) {
      case 'demo':
        return 'Local development mode - no real Pi integration';
      case 'pirc2-sandbox':
        return 'Pi Network sandbox testing - placeholder credentials';
      case 'pirc2-production':
        return 'Production mode - requires real Pi Network credentials';
      default:
        return 'Unknown mode';
    }
  }
}

// Create and export singleton instance
const envManager = new EnvManager();

export default envManager;
export { EnvManager };
