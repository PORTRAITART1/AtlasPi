import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnvManager {
  constructor() {
    this.mode = 'demo';
    this.config = {};
    this.loadEnvironment();
  }

  /**
   * Detect mode - CHECK process.env FIRST (Render variables), then .env files
   */
  detectMode() {
    // Priority 1: Direct environment variable (Render sets this directly)
    if (process.env.APP_MODE) {
      const envMode = process.env.APP_MODE.toLowerCase().trim();
      console.log(`[EnvManager] Detected APP_MODE from process.env: ${envMode}`);
      if (['demo', 'pirc2-sandbox', 'pirc2-production'].includes(envMode)) {
        return envMode;
      }
    }

    // Priority 2: NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      console.log(`[EnvManager] Detected production from NODE_ENV`);
      return 'pirc2-production';
    }

    // Default
    console.log(`[EnvManager] No APP_MODE detected, defaulting to demo`);
    return 'demo';
  }

  loadEnvironment() {
    // Step 1: Detect mode FIRST (before loading .env files)
    // This ensures Render environment variables take priority
    this.mode = this.detectMode();
    console.log(`[EnvManager] Mode set to: ${this.mode}`);

    // Step 2: Load default .env file (for local development)
    const defaultEnvPath = path.join(__dirname, '../.env');
    if (fs.existsSync(defaultEnvPath)) {
      dotenv.config({ path: defaultEnvPath });
      logger.info(`✓ Loaded default .env from ${defaultEnvPath}`);
    }

    // Step 3: Load mode-specific .env file (override with final values)
    const modeEnvPath = path.join(__dirname, `../.env.${this.mode}`);
    if (fs.existsSync(modeEnvPath)) {
      dotenv.config({ path: modeEnvPath, override: true });
      logger.info(`✓ Loaded mode-specific .env.${this.mode} from ${modeEnvPath}`);
    } else {
      logger.warn(`⚠ Mode-specific env file not found: ${modeEnvPath}`);
    }

    // Step 4: Populate config from environment (process.env has priority)
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

      // Security
      forceHttps: process.env.FORCE_HTTPS === 'true',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      paymentVerificationRequired: process.env.PAYMENT_VERIFICATION_REQUIRED === 'true',
      paymentWebhookTimeoutSeconds: parseInt(process.env.PAYMENT_WEBHOOK_TIMEOUT_SECONDS) || 30,
    };

    this.printConfig();
  }

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

  get(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  isFeatureEnabled(feature) {
    const key = `pirc2${feature.charAt(0).toUpperCase() + feature.slice(1)}Enabled`;
    return this.config[key] === true;
  }

  isMode(mode) {
    return this.mode === mode;
  }

  getModeInfo() {
    return {
      mode: this.mode,
      isDemo: this.mode === 'demo',
      isSandbox: this.mode === 'pirc2-sandbox',
      isProduction: this.mode === 'pirc2-production',
      description: this.getModeDescription(),
    };
  }

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

const envManager = new EnvManager();

export default envManager;
export { EnvManager };
