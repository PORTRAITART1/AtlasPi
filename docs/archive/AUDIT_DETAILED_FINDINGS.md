DETAILED FINDINGS - Pi Browser / Pi Developer Compatibility Audit

═══════════════════════════════════════════════════════════════════════════════

AUDIT SCOPE: Code-only analysis (no runtime testing)
AUDIT METHOD: Static code analysis + architecture review
AUDIT FOCUS: Pi Browser webview compatibility + Pi Network integration readiness

═══════════════════════════════════════════════════════════════════════════════

FINDING 1: Frontend API_BASE_URL Hardcoding

SEVERITY: 🔴 CRITICAL
FILE: frontend/script.js, line 1
CODE:
  const API_BASE_URL = "http://localhost:3000";

CURRENT BEHAVIOR:
  ✓ Works in Docker (backend on port 3000)
  ✓ Works in localhost dev
  ✓ Calls work with fetch()

PROBLEM:
  ✗ Hardcoded to localhost:3000
  ✗ Will FAIL when deployed to production domain
  ✗ Will FAIL when served from Pi Browser (different URL)
  ✗ No fallback or env-based configuration

EXAMPLE FAILURE:
  In Pi Browser: https://app.minepi.com/atlaspi
  Frontend tries: fetch("http://localhost:3000/api/auth/pi")
  Result: ❌ Mixed content error (HTTPS → HTTP) + CORS failure

IMPACT ON PI BROWSER:
  ❌ App will not load any data
  ❌ All API calls will 404 or CORS block
  ❌ User sees broken app

RECOMMENDATION:
  Replace with environment variable or dynamic discovery:
  ```javascript
  const API_BASE_URL = 
    process.env.REACT_APP_API_BASE_URL || 
    `${window.location.origin}/api` ||
    "http://localhost:3000";
  ```

TIMELINE TO FIX: 30 minutes

───────────────────────────────────────────────────────────────────────────────

FINDING 2: No Pi SDK Integration

SEVERITY: 🔴 CRITICAL
IMPACT: Impossible to integrate with real Pi Network

CURRENT STATE:
  ✗ No import of Pi SDK anywhere
  ✗ No call to Pi.auth()
  ✗ No call to Pi.payments()
  ✗ No Pi SDK script in HTML

CODE THAT SHOULD NOT EXIST (but does):
  ```javascript
  // ❌ WRONG - Hardcoded demo user
  let currentUser = {
    uid: "test-user-001",
    username: "demo_pioneer",
    accessToken: "demo-access-token-123",
    wallet_address: "demo-wallet-not-connected"
  };

  // ❌ WRONG - Fake Pi auth flow
  async function connectDemoPiUser() {
    const response = await fetch(`${API_BASE_URL}/api/auth/pi`, {
      body: JSON.stringify({
        uid: currentUser.uid,  // ← Should come from Pi.auth()
        username: currentUser.username,  // ← Should come from Pi
        accessToken: currentUser.accessToken,  // ← Should come from Pi SDK
        wallet_address: currentUser.wallet_address  // ← Should from Pi
      })
    });
  }
  ```

WHAT SHOULD HAPPEN (for real Pi integration):
  ```javascript
  // ✅ CORRECT - Call Pi SDK
  import { useContext } from 'react';
  
  async function authenticateWithPi() {
    try {
      // Call Pi SDK auth
      const scopes = ["username", "wallet_address"];
      window.Pi.auth(scopes, onIncompletePaymentFound)
        .then(auth => {
          // auth = { user, accessToken }
          // Send to backend for verification
          const response = await fetch(`${API_BASE_URL}/api/auth/pi`, {
            body: JSON.stringify({
              uid: auth.user.uid,
              accessToken: auth.accessToken,
              // ... verify with Pi API
            })
          });
        });
    } catch (error) {
      console.error("Pi auth failed:", error);
    }
  }
  ```

IMPACT:
  ❌ Cannot use real Pi authentication
  ❌ Cannot get real user credentials
  ❌ Cannot access real Pi wallet
  ❌ Cannot authorize real transactions

PREREQUISITES:
  1. Register app on https://developers.minepi.com
  2. Get APP_ID and SDK_KEY
  3. Import Pi SDK (npm or CDN)
  4. Implement proper OAuth flow
  5. Handle access tokens securely

TIMELINE TO FIX: 2-3 days

───────────────────────────────────────────────────────────────────────────────

FINDING 3: Pi Payments Not Integrated

SEVERITY: 🔴 CRITICAL
IMPACT: Payment functionality is entirely fake

CURRENT IMPLEMENTATION:
  ```javascript
  async function createPaymentRecord() {
    // Creates demo payment with fake data
    // Stores in SQLite
    // Returns fakePaymentId
  }

  async function completePaymentRecord() {
    const demoTxid = `tx-demo-${Date.now()}`;  // ← Fake TXID
    // Marks as "completed" without any Pi validation
  }
  ```

WHAT HAPPENS NOW:
  1. User enters amount
  2. Frontend creates "payment" (really just DB row)
  3. Frontend approves with `pi-demo-123456` ID
  4. Frontend completes with `tx-demo-123456` ID
  5. Backend stores fake IDs in DB
  6. ✗ NO actual Pi transaction occurs
  7. ✗ NO blockchain verification
  8. ✗ NO real money/Pi changes hands

WHAT SHOULD HAPPEN:
  ```javascript
  async function initiatePiPayment() {
    try {
      const payment = {
        amount: 10,
        memo: "AtlasPi listing verification",
        metadata: { listing_id: 123 }
      };

      // Call Pi Payments SDK
      window.Pi.createPayment(payment, {
        onReadyForServerApproval: (paymentId) => {
          // Server approves payment
          approvePaymentOnServer(paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          // Server marks payment complete
          completePaymentOnServer(paymentId, txid);
        },
        onCancel: () => {
          console.log("User cancelled payment");
        },
        onError: (error) => {
          console.error("Payment failed:", error);
        }
      });
    } catch (error) {
      console.error("Payment initiation failed:", error);
    }
  }
  ```

VALIDATION MISSING:
  ❌ Pi API doesn't verify paymentId
  ❌ Backend doesn't check with Pi that payment is real
  ❌ TXID not validated on blockchain
  ❌ Payment can be "completed" without Pi confirmation

IMPACT ON PRODUCTION:
  ❌ Users cannot actually pay (would see fake "successful" payment)
  ❌ Merchant never receives Pi
  ❌ Audit would immediately fail
  ❌ Platform violates Pi Network trust

TIMELINE TO FIX: 3-4 days

───────────────────────────────────────────────────────────────────────────────

FINDING 4: CORS Not Configured for Production

SEVERITY: 🟠 HIGH
FILE: backend/server.js, lines 21-28

CURRENT CODE:
  ```javascript
  const corsOrigins = [process.env.FRONTEND_URL];
  // FRONTEND_URL = "http://localhost:8080" (from docker-compose.yml)
  
  app.use(cors({
    origin: corsOrigins,  // ← Only accepts localhost:8080
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  ```

CURRENT BEHAVIOR:
  ✓ Frontend on localhost:8080 can call backend on localhost:3000
  ✓ Tight CORS policy (good for security)

PROBLEM:
  ✗ Hardcoded to single origin (localhost:8080)
  ✗ Will BLOCK all other origins (including production)
  ✗ No fallback for different environments

EXAMPLE FAILURE:
  In production:
  - Frontend: https://atlaspi.example.com
  - Backend: https://api.atlaspi.example.com
  - CORS check: Is "https://atlaspi.example.com" in corsOrigins?
  - Result: ❌ NO → CORS error → API call blocked

BROWSER ERROR:
  Access to XMLHttpRequest at 'https://api.atlaspi.example.com/api/merchant-listings'
  from origin 'https://atlaspi.example.com' has been blocked by CORS policy

IMPACT:
  ❌ No API data loads in production
  ❌ All merchant listings fail to load
  ❌ Admin section non-functional
  ❌ Payment flows blocked

SOLUTION:
  ```javascript
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_FRONTEND_URL,
    // Add Pi CDN URL if serving from there
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    }
  }));
  ```

TIMELINE TO FIX: 1-2 hours

───────────────────────────────────────────────────────────────────────────────

FINDING 5: Backend Auth Not Validating Against Pi API

SEVERITY: 🔴 CRITICAL
FILE: backend/routes/auth.js

CURRENT CODE:
  ```javascript
  router.post("/pi", (req, res) => {
    const { uid, username, accessToken, wallet_address } = req.body;
    
    // ✗ NO VALIDATION - Just accepts whatever frontend sends
    // ✗ No call to Pi API to verify accessToken
    // ✗ No verification that uid matches Pi records
    
    db.run(
      `INSERT INTO auth_logs (...) VALUES (...)`,
      // Just stores whatever came in
    );
  });
  ```

SECURITY ISSUE:
  Any user can craft a request:
  ```bash
  curl -X POST http://localhost:3000/api/auth/pi \
    -H "Content-Type: application/json" \
    -d '{
      "uid": "attacker",
      "username": "elon_musk",  # ← Fake claim
      "accessToken": "fake_token_123",
      "wallet_address": "0x123..."  # ← Attacker wallet
    }'
  ```

  Result: ❌ Server stores attacker as "elon_musk"

WHAT SHOULD HAPPEN:
  1. Frontend gets real accessToken from Pi.auth()
  2. Frontend sends accessToken to backend
  3. Backend calls Pi API: `https://api.minepi.com/v2/me?accessToken=...`
  4. Pi API returns real uid/username/wallet_address
  5. Backend verifies they match
  6. Only then store in DB

REQUIRED CODE:
  ```javascript
  router.post("/pi", async (req, res) => {
    const { accessToken } = req.body;
    
    try {
      // Verify with Pi API
      const response = await fetch("https://api.minepi.com/v2/me", {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        return res.status(401).json({
          ok: false,
          error: "Invalid Pi access token"
        });
      }
      
      const piUser = await response.json();
      
      // Now safely use real Pi user data
      db.run(
        `INSERT INTO auth_logs VALUES (?, ?, ?, ?)`,
        [piUser.uid, piUser.username, piUser.wallet, accessToken],
        (err) => {
          res.json({
            ok: true,
            user: piUser
          });
        }
      );
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
  ```

IMPACT:
  ❌ Anyone can impersonate any user
  ❌ Wallet addresses can be stolen
  ❌ Admin actions attributed to wrong users
  ❌ Audit trail is unreliable

TIMELINE TO FIX: 2 hours (once Pi API credentials obtained)

───────────────────────────────────────────────────────────────────────────────

FINDING 6: Admin Secret Exposed in .env

SEVERITY: 🟠 MEDIUM
FILE: backend/.env

CURRENT:
  ```env
  ADMIN_SECRET=atlaspi-dev-secret-change-in-prod
  ```

PROBLEMS:
  ✗ Stored in plaintext in .env
  ✗ .env often committed to git (bad practice)
  ✗ Same secret used by all admins (no audit trail)
  ✗ If leaked, all moderation can be faked

IN PRODUCTION:
  ✗ Should NOT be in .env
  ✗ Should be in secrets vault (AWS Secrets Manager, HashiCorp Vault, etc.)
  ✗ Should be rotated regularly
  ✗ Should support multiple admins with different secrets

CURRENT USAGE:
  ```javascript
  // backend/routes/merchantListings.js
  const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
  const headerSecret = req.headers["x-admin-secret"];
  
  if (!headerSecret || headerSecret !== adminSecret) {
    // ✗ Simple string comparison
    // ✗ No rate limiting on wrong attempts
    // ✗ No logging of failed attempts
  }
  ```

ATTACK SCENARIO:
  Admin: curl -X POST http://localhost:3000/api/merchant-listings/pending \
           -H "x-admin-secret: wrong-secret"
  
  Attacker can brute force (no rate limit per secret)

WHAT SHOULD HAPPEN:
  1. Admin credentials stored hashed
  2. Support multiple admin tokens
  3. Rate limit per IP/token
  4. Audit log all moderation actions
  5. Tokens stored in vault, not .env

TIMELINE TO FIX: 1-2 days

───────────────────────────────────────────────────────────────────────────────

FINDING 7: No HTTPS or TLS Configuration

SEVERITY: 🔴 CRITICAL (for production)
SEVERITY: ⚠️ ACCEPTABLE (for local development)

CURRENT:
  ✓ HTTP localhost (fine for dev)
  ✗ No HTTPS configuration
  ✗ No SSL/TLS setup

PRODUCTION REQUIREMENT:
  Pi Network requires HTTPS everywhere
  - Payments APIs require HTTPS
  - Auth APIs require HTTPS
  - Mixed content will be blocked by browsers

CURRENT PORTS:
  Frontend: 8080 (HTTP)
  Backend: 3000 (HTTP)

PRODUCTION MUST BE:
  Frontend: 443/HTTPS
  Backend: 443/HTTPS

REQUIRED SETUP:
  ```yaml
  # docker-compose.yml for production
  backend:
    ports:
      - "443:3000"  # HTTPS termination
    environment:
      - SSL_CERT=/etc/ssl/certs/cert.pem
      - SSL_KEY=/etc/ssl/private/key.pem
    volumes:
      - /etc/ssl:/etc/ssl:ro
  ```

  Or use nginx/reverse-proxy:
  ```nginx
  server {
    listen 443 ssl http2;
    server_name api.atlaspi.example.com;
    
    ssl_certificate /etc/letsencrypt/live/api.atlaspi.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.atlaspi.example.com/privkey.pem;
    
    location / {
      proxy_pass http://backend:3000;
    }
  }
  ```

IMPACT:
  ❌ Production deployment will fail Pi security requirements
  ❌ Payment endpoints will be blocked
  ❌ Browser will warn about insecure connection

TIMELINE TO FIX: 1 day (Let's Encrypt setup)

───────────────────────────────────────────────────────────────────────────────

FINDING 8: No Payment Verification Callback

SEVERITY: 🔴 CRITICAL
FILE: Missing endpoint: /api/auth/pi/callback

PROBLEM:
  Pi OAuth flow expects backend callback:
  
  Flow:
  1. Frontend → Pi.auth()
  2. Pi → User authorizes
  3. Pi → Redirects to backend callback URL
  4. Backend receives code/accessToken
  5. Backend exchanges for user data
  6. Backend returns to frontend

CURRENT STATE:
  ✗ No callback endpoint exists
  ✗ Frontend POSTs auth directly
  ✗ Bypasses Pi OAuth flow entirely

WHAT'S MISSING:
  ```javascript
  // ✗ THIS IS MISSING
  router.get("/pi/callback", (req, res) => {
    const { code, state } = req.query;
    
    // Exchange code for accessToken
    // Get user data from Pi API
    // Create session
    // Redirect to frontend with session token
  });
  ```

IMPACT:
  ❌ Cannot use real Pi OAuth flow
  ❌ Cannot properly exchange auth codes
  ❌ Session management incomplete

TIMELINE TO FIX: 1 day

───────────────────────────────────────────────────────────────────────────────

FINDING 9: Database Not Migration-Ready

SEVERITY: 🟡 MEDIUM
FILE: backend/config/db.js (schema)

CURRENT:
  SQLite3 schema created on startup (hardcoded)
  No migration system

PROBLEM:
  ✗ No way to track schema changes
  ✗ Difficult to update production schema
  ✗ No version control for DB
  ✗ Rollback not possible

FOR PRODUCTION:
  Should use migration tool:
  - Knex.js
  - TypeORM migrations
  - Prisma migrations
  - Sequelize

IMPACT: MEDIUM (not urgent for launch, but will cause headaches)

TIMELINE TO FIX: 2-3 days (refactor to migration-based setup)

───────────────────────────────────────────────────────────────────────────────

FINDING 10: No Pi App Registration

SEVERITY: 🔴 CRITICAL
IMPACT: Cannot deploy to Pi Network without app registration

MISSING:
  ✗ APP_ID from https://developers.minepi.com
  ✗ SDK_KEY from Pi Developer Console
  ✗ API_KEY registered to App
  ✗ Callback URL registered on Pi

REQUIRED BEFORE PRODUCTION:
  1. Go to https://developers.minepi.com
  2. Create Application
  3. Set up OAuth scopes (username, wallet_address)
  4. Register callback URLs
  5. Get SDK_KEY and APP_ID
  6. Store credentials in .env

TIMELINE: 1 hour (once registered)

═══════════════════════════════════════════════════════════════════════════════

SUMMARY TABLE

| Finding | Severity | Type | Impact | Timeline | Blocker? |
|---------|----------|------|--------|----------|----------|
| API_BASE_URL hardcoded | 🔴 CRITICAL | Config | Production deployment fails | 0.5d | YES |
| No Pi SDK | 🔴 CRITICAL | Feature | Can't use real Pi auth | 2-3d | YES |
| No Pi Payments | 🔴 CRITICAL | Feature | Payments entirely fake | 3-4d | YES |
| CORS not prod-ready | 🟠 HIGH | Config | Prod API blocked | 0.5d | YES |
| No Pi API validation | 🔴 CRITICAL | Security | Anyone can spoof identity | 0.5d | YES |
| Admin secret exposed | 🟠 MEDIUM | Security | Moderation can be faked | 1-2d | PARTIAL |
| No HTTPS | 🔴 CRITICAL | Security | Pi Network won't accept | 1d | YES |
| No OAuth callback | 🔴 CRITICAL | Feature | Real auth flow incomplete | 1d | YES |
| No DB migrations | 🟡 MEDIUM | DevOps | Hard to maintain | 2-3d | NO |
| No Pi app registered | 🔴 CRITICAL | Config | Can't deploy | 1h | YES |

═══════════════════════════════════════════════════════════════════════════════

REMEDIATION PRIORITY

MUST FIX FIRST (Blockers):
1. Register Pi App + get credentials
2. Add Pi SDK imports + calls
3. Fix API_BASE_URL (env-based)
4. Implement Pi OAuth callback
5. Add Pi API validation (auth + payments)
6. Fix CORS for production
7. Add HTTPS setup
8. Remove hardcoded secrets

SHOULD FIX SOON (Within 1 week):
9. Admin secret management (vault)
10. Database migrations setup

═══════════════════════════════════════════════════════════════════════════════

Audit completed: Code-only analysis
No modifications made to source code
All findings based on static analysis

═══════════════════════════════════════════════════════════════════════════════
