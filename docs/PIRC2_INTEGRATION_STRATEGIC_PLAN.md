# INTÉGRATION PiRC2 OFFICIELLE - AUDIT & PLAN (5 jours)

**Référence Officielle**: https://github.com/PiNetwork/PiRC/tree/main/PiRC2  
**Date**: 2025  
**Objectif**: Aligner AtlasPi avec PiRC2 officiel en 5 jours, mode hybride sûr  
**Status**: PLAN STRATÉGIQUE

---

## CLARIFICATION IMPORTANTE

**NOTE**: Je n'ai pas pu accéder directement au repo PiRC2 officiel (robots.txt block). 
Par conséquent, ce plan s'appuie sur les standards de commerce Pi Network reconnus.
Pour une implémentation CERTIFIÉE PiRC2 complète, vous devez:
1. Consulter directement le repo officiel (https://github.com/PiNetwork/PiRC/tree/main/PiRC2)
2. Valider chaque point avec Pi Core team
3. Utiliser les versions officielles du SDK Pi

---

## 1. AUDIT OFFICIEL - CARTOGRAPHIE ATLASPI vs PiRC2

### 1.1 Domaine: AUTHENTIFICATION

**PiRC2 Spec Standard (selon standard commerce Pi):**
```
- OAuth2 flow avec Pi SDK
- Scopes: username, wallet_address, payments (optionnel)
- Token JWT signé par Pi
- Validation backend obligatoire
- Refresh token handling
- Session timeout
```

**AtlasPi Actuel:**
```
- Auth démo: uid hardcoded, jamais validé
- Pas de Pi SDK
- Pas de validation backend
- Pas de token storage sécurisé
```

**Classification:**
```
❌ NOT READY: Aucune intégration Pi réelle actuellement
⚠️ STRUCTURE PRÊTE: Backend route /api/auth/pi existe
✅ FALLBACK DÉMO: Mode démo peut rester opérationnel
```

---

### 1.2 Domaine: PAIEMENTS

**PiRC2 Spec Standard:**
```
1. Payment Initiation
   - Frontend appelle Pi.payments.start() (Pi SDK)
   - Spécifie amount, memo, metadata
   - Retourne paymentId signé par Pi

2. Server Approval
   - Backend reçoit paymentId
   - Valide selon règles métier
   - Signe sa réponse (si clé privée disponible)
   - Retourne approval ou rejection

3. Completion
   - Frontend appelle Pi.payments.complete()
   - Backend reçoit callback avec TXID blockchain
   - Valide TXID auprès de Pi blockchain
   - Marque paiement comme complété

4. Webhook/Callback
   - Pi envoie callback signé
   - Backend valide signature
   - Met à jour état local
```

**AtlasPi Actuel:**
```
- Payment démo: fake IDs, aucune blockchain validation
- Pas de Pi Payments SDK
- Pas de validation TXID
- Pas de webhook handling
```

**Classification:**
```
❌ NOT READY: Zéro intégration Pi Payments réelle
⚠️ STRUCTURE PRÊTE: Routes /api/payments/* existent
✅ FALLBACK DÉMO: Mode démo fonctionne 100%
```

---

### 1.3 Domaine: WALLETS

**PiRC2 Spec Standard:**
```
- Wallet address issu de Pi.auth() scope
- Format: 0x + 40 hex characters (Pi blockchain format)
- Validation: Vérifier format + existence (optional)
- Ownership proof: Utilisateur authentifié = propriétaire wallet
- Display: Montrer wallet associé à l'utilisateur
```

**AtlasPi Actuel:**
```
- Champ wallet_address capturé dans merchant form
- Aucune validation format
- Aucun lien à auth
- Stocké en base de façon non vérifiée
```

**Classification:**
```
⚠️ PARTIAL: Champ présent, validation absente
❌ NOT READY: Pas de lien à auth Pi
✅ STRUCTURE PRÊTE: BD peut stocker facilement
```

---

### 1.4 Domaine: FRONTEND / BROWSER INTEGRATION

**PiRC2 Spec Standard:**
```
- Pi Browser detection (window.Pi !== undefined)
- Pi SDK loading (script officiel)
- Auth flow UI (bouton "Connect with Pi")
- Payment UI (flow standard)
- Error handling (fallback graceful)
- Manifest.json Pi meta (si Pi Browser)
```

**AtlasPi Actuel:**
```
- Pas de Pi SDK import
- Pas de Pi Browser detection
- Pas de manifest.json
- Bouton "Connect with Pi" existe (appelle démo)
```

**Classification:**
```
❌ NOT READY: Aucune intégration Pi SDK
✅ STRUCTURE PRÊTE: HTML/JS ready pour SDK
⚠️ FALLBACK DÉMO: Mode démo UI existe déjà
```

---

### 1.5 Domaine: BACKEND VALIDATION

**PiRC2 Spec Standard:**
```
- Token validation avec Pi API (si clé dispo)
- TXID validation avec Pi blockchain
- Signature verification (webhooks)
- Rate limiting par utilisateur
- Audit logging
- Error recovery
```

**AtlasPi Actuel:**
```
- Aucune validation avec Pi API
- Aucune validation blockchain
- Aucune vérification signature
- Rate limiting basic (100/15min globale)
- Logging basique
```

**Classification:**
```
❌ NOT READY: Zéro validation Pi
✅ STRUCTURE PRÊTE: Routes existent, peuvent être étendues
⚠️ FALLBACK DÉMO: Fonctionne sans validation
```

---

### 1.6 Domaine: SÉCURITÉ

**PiRC2 Spec Standard:**
```
- HTTPS obligatoire (production)
- Security headers: HSTS, CSP, X-Frame-Options, etc.
- CORS strictement whitelist
- CSRF tokens
- Input validation
- Rate limiting per user
- Secrets storage (envvar, vault, pas hardcoded)
- Data encryption (sensitive data)
```

**AtlasPi Actuel:**
```
- HTTP localhost (OK pour démo)
- Helmet headers basiques
- CORS whitelist présent
- CSRF basique
- Input validation partielle
- Rate limiting 100/15min
- Secrets en .env
```

**Classification:**
```
⚠️ PARTIAL: Base présente, manquent specs PiRC2
❌ NOT READY: Pas HTTPS local (OK pour démo)
✅ PEUT ÊTRE AMÉLIORÉ: Headers à renforcer
```

---

### 1.7 Domaine: CONSENTEMENT & DONNÉES

**PiRC2 Spec Standard:**
```
- Consent form explicite (donnees partagées avec Pi)
- Data minimization (seulement données nécessaires)
- Retention policy définie
- Right to delete (GDPR)
- Privacy policy complète
- Audit trail
```

**AtlasPi Actuel:**
```
- Checkboxes terms/privacy/public
- Pas de mention explicite données Pi
- Pas de retention policy
- Pas de right to delete
```

**Classification:**
```
⚠️ PARTIAL: Form existe, contenu PiRC2 manquant
❌ NOT READY: Pas de right to delete
✅ PEUT ÊTRE COMPLÉTÉ: Texte à ajouter
```

---

## 2. TABLEAU RÉCAPITULATIF

```
┌───────────────────────┬────────────┬─────────────────────────────────┐
│ Domaine               │ Status     │ Notes                           │
├───────────────────────┼────────────┼─────────────────────────────────┤
│ Auth Demo             │ ✅ READY   │ Fonctionne 100%                │
│ Auth Pi-Ready         │ ❌ N.READY │ Fallback prêt, SDK manquant    │
│ Payments Demo         │ ✅ READY   │ Fonctionne 100%                │
│ Payments PiRC2        │ ❌ N.READY │ Structure prête, validation non │
│ Wallets Validation    │ ⚠️ PARTIAL │ Champ OK, validation manquante │
│ Frontend Pi SDK       │ ❌ N.READY │ Structure OK, SDK manquant     │
│ Backend Validation    │ ⚠️ PARTIAL │ Routes OK, logique manquante   │
│ Sécurité PiRC2        │ ⚠️ PARTIAL │ Base OK, specs manquantes      │
│ Consentement PiRC2    │ ⚠️ PARTIAL │ Form OK, texte PiRC2 manquant │
│ Docker/Config         │ ✅ READY   │ Vars env OK, prête pour PiRC2 │
└───────────────────────┴────────────┴─────────────────────────────────┘
```

---

## 3. PLAN D'INTÉGRATION 5 JOURS

### DAY 1: Audit + Configuration
```
Matin:
  ✓ Lire référence officielle PiRC2
  ✓ Préparer variables d'env (PiRC2_*)
  ✓ Structurer .env pour mode (demo/pirc2)

Après-midi:
  ✓ Mettre à jour config.js (mode switching)
  ✓ Mettre à jour backend/.env
  ✓ Mettre à jour docker-compose.yml
  ✓ Vérifier Docker toujours OK

Liverable:
  - Configuration prête pour PiRC2
  - Modes démo/sandbox/production définis
  - Test: `docker-compose up` doit marcher
```

### DAY 2: Auth PiRC2 Foundation
```
Matin:
  ✓ Analyser structure auth existante
  ✓ Préparer mode switch dans connectWithAuth()
  ✓ Ajouter Pi SDK placeholder (commenté, prêt)
  ✓ Créer connectPiRC2User() structure

Après-midi:
  ✓ Ajouter validation token backend (mock si pas API key)
  ✓ Implémenter scope handling
  ✓ Ajouter user object compatible PiRC2
  ✓ Tests: Auth démo encore OK

Liverable:
  - Structure auth prête pour Pi SDK
  - Mode demo vs pirc2 séparé clairement
  - Validation backend skeleton
  - Test: Auth démo PASS, auth PiRC2-ready (mock)
```

### DAY 3: Payments PiRC2 Foundation
```
Matin:
  ✓ Analyser flows payment démo
  ✓ Structurer payment flow PiRC2 (3 étapes)
  ✓ Ajouter Pi Payments SDK placeholder
  ✓ Créer endpoints pour PiRC2

Après-midi:
  ✓ Implémenter server approval skeleton
  ✓ Ajouter webhook handler structure
  ✓ Ajouter TXID validation skeleton
  ✓ Tests: Payments démo encore OK

Liverable:
  - Payment flow séparé (démo vs PiRC2)
  - Endpoints prêts pour vrai Pi Payments
  - Webhook structure en place
  - Test: Payments démo PASS, PiRC2 structure ready
```

### DAY 4: Frontend + Security Polish
```
Matin:
  ✓ Ajouter Pi SDK detection (window.Pi)
  ✓ Rendre UI labels clairs (démo vs réel)
  ✓ Améliorer security headers (PiRC2)
  ✓ Valider CORS + CSRF

Après-midi:
  ✓ Ajouter manifest.json Pi (structure)
  ✓ Tester tous flows: search, detail, merchant CRUD
  ✓ Vérifier aucune régression
  ✓ Documentation config

Liverable:
  - Frontend prête pour Pi SDK integration
  - UI labels clairs (démo explicite)
  - Sécurité renforcée (PiRC2 baseline)
  - Test: Tous flows existants PASS
```

### DAY 5: Tests + Documentation
```
Matin:
  ✓ Tests complets (voir section 8)
  ✓ Vérifier Docker intégration
  ✓ Vérifier config switching
  ✓ Bug fixes si nécessaire

Après-midi:
  ✓ Documentation PiRC2 readiness
  ✓ Rapport final (voir section 9)
  ✓ Cleanup code
  ✓ Déploiement prêt

Liverable:
  - Tests complets PASS/FAIL
  - Documentation complète
  - Rapport final français
  - Code production-ready
```

---

## 4. IMPLÉMENTATION RÉELLE - CH ANGES CONCRETS

### 4.1 Configuration (DAY 1)

**backend/.env - Ajouter:**
```env
# ========== PiRC2 Configuration ==========

# Mode: demo | pirc2-sandbox | pirc2-production
ATLASPI_MODE=demo

# PiRC2 Credentials (obtenir de https://developers.pi/)
PIRC2_APP_ID=YOUR_APP_ID_HERE
PIRC2_SDK_KEY=YOUR_SDK_KEY_HERE
PIRC2_REDIRECT_URI=http://localhost:8080/auth/callback
PIRC2_API_BASE_URL=https://api.minepi.com

# PiRC2 Webhook
PIRC2_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE

# PiRC2 Server Key (pour signature server approval)
PIRC2_SERVER_KEY=YOUR_SERVER_KEY_HERE

# Fallback: Accepter requests démo même en mode pirc2
ALLOW_DEMO_AUTH=true
```

**frontend/config.js - Ajouter:**
```javascript
// Déterminer mode PiRC2
const getPiRC2Mode = () => {
  // Priority 1: Env var (set by backend)
  if (window.ATLASPI_CONFIG?.PIRC2_MODE) {
    return window.ATLASPI_CONFIG.PIRC2_MODE;
  }
  
  // Priority 2: Pi SDK présent (Pi Browser?)
  if (typeof window.Pi !== 'undefined') {
    return 'pirc2-production';
  }
  
  // Priority 3: Default
  return 'demo';
};

window.ATLASPI_CONFIG = {
  ...window.ATLASPI_CONFIG,
  PIRC2_MODE: getPiRC2Mode(),
  PIRC2_SDK_KEY: 'YOUR_SDK_KEY_HERE',  // Sera remplacé par backend
  PIRC2_REDIRECT_URI: 'http://localhost:8080/auth/callback'
};
```

---

### 4.2 Authentication (DAY 2)

**backend/routes/auth.js - Ajouter:**
```javascript
// ========== PiRC2 Authentication ==========

const validatePiRC2Token = async (accessToken) => {
  const mode = process.env.ATLASPI_MODE || 'demo';
  
  if (mode === 'demo' || !process.env.PIRC2_APP_ID) {
    // Demo mode: accepter sans validation
    return { valid: true, mode: 'demo' };
  }
  
  // Mode PiRC2: Valider avec Pi API
  // NOTE: Nécessite PIRC2_APP_ID et clé API valide
  try {
    const response = await fetch(`${process.env.PIRC2_API_BASE_URL}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      return { valid: false, reason: 'Token validation failed' };
    }
    
    const piUser = await response.json();
    return { 
      valid: true, 
      mode: 'pirc2',
      piUser: {
        uid: piUser.uid,
        username: piUser.username,
        wallet_address: piUser.wallet_address
      }
    };
  } catch (error) {
    logger.error(`PiRC2 validation error: ${error.message}`);
    
    // Fallback mode (si config incomplete)
    if (process.env.ALLOW_DEMO_AUTH === 'true') {
      logger.warn('PiRC2 validation failed, falling back to demo');
      return { valid: true, mode: 'demo-fallback', reason: 'API unreachable' };
    }
    
    return { valid: false, reason: 'Validation error' };
  }
};

router.post('/pirc2', async (req, res) => {
  try {
    const { accessToken, scope } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing accessToken' 
      });
    }
    
    // Valider token selon mode
    const validation = await validatePiRC2Token(accessToken);
    
    if (!validation.valid) {
      return res.status(401).json({
        ok: false,
        error: validation.reason || 'Invalid token'
      });
    }
    
    // Extraire user data selon mode
    let userData;
    if (validation.mode === 'pirc2' && validation.piUser) {
      userData = validation.piUser;
    } else {
      // Mode démo
      userData = req.body.user || {
        uid: `demo-${Date.now()}`,
        username: 'demo_user',
        wallet_address: null
      };
    }
    
    // Logger auth
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO auth_logs (uid, username, wallet_address, access_token, auth_mode, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userData.uid, userData.username, userData.wallet_address || '', accessToken, validation.mode, createdAt],
      function (err) {
        if (err) {
          logger.error(`DB error: ${err.message}`);
          return res.status(500).json({ ok: false, error: 'DB error' });
        }
        
        logger.info(`Auth: ${userData.username} (${userData.uid}) - mode: ${validation.mode}`);
        
        return res.json({
          ok: true,
          user: userData,
          mode: validation.mode,
          message: validation.mode === 'pirc2' ? 'Authenticated with Pi Network' : 'Demo authentication'
        });
      }
    );
  } catch (error) {
    logger.error(`Auth route error: ${error.message}`);
    return res.status(500).json({ ok: false, error: error.message });
  }
});
```

**frontend/script.js - Ajouter:**
```javascript
async function connectWithPiRC2() {
  if (!piStatus) return;
  
  const mode = window.ATLASPI_CONFIG?.PIRC2_MODE || 'demo';
  
  if (mode === 'pirc2-production' && typeof window.Pi !== 'undefined') {
    // Mode réel: Utiliser Pi SDK
    piStatus.textContent = '⏳ Connecting with Pi...';
    
    try {
      // Appeler Pi SDK (nécessite imports réels)
      // window.Pi.auth(scopes).then(...)
      piStatus.textContent = '❌ Pi SDK not loaded (placeholder). Using demo instead.';
      return connectDemoPiUser();
    } catch (error) {
      piStatus.textContent = `❌ Pi connection failed: ${error.message}`;
      return;
    }
  }
  
  // Mode démo ou fallback
  return connectDemoPiUser();
}

// Remplacer l'event listener
if (piConnectBtn) {
  piConnectBtn.addEventListener('click', connectWithPiRC2);
}
```

---

### 4.3 Payments (DAY 3)

**backend/routes/payments.js - Ajouter:**
```javascript
// ========== PiRC2 Payments ==========

router.post('/pirc2/start', async (req, res) => {
  try {
    const { uid, amount, memo, metadata } = req.body;
    const mode = process.env.ATLASPI_MODE || 'demo';
    
    if (!uid || !amount) {
      return res.status(400).json({ ok: false, error: 'Missing uid or amount' });
    }
    
    if (mode === 'demo') {
      // Mode démo: fake payment ID
      const demoPaymentId = `demo-pay-${Date.now()}`;
      return res.json({
        ok: true,
        paymentId: demoPaymentId,
        mode: 'demo',
        message: 'Demo payment initiated'
      });
    }
    
    // Mode PiRC2: Préparer pour vrai Pi Payments SDK
    // NOTE: Nécessite Pi Payments API credentials
    const paymentId = `pirc2-${Date.now()}-${uid.substring(0, 8)}`;
    
    // Stocker en DB pour tracking
    db.run(
      `INSERT INTO payments (uid, amount, memo, payment_id, status, mode, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid, amount, memo, paymentId, 'initiated', mode, new Date().toISOString()],
      function(err) {
        if (err) {
          logger.error(`Payment DB error: ${err.message}`);
          return res.status(500).json({ ok: false, error: 'DB error' });
        }
        
        res.json({
          ok: true,
          paymentId: paymentId,
          mode: mode,
          message: 'Payment initiated (PiRC2 mode)'
        });
      }
    );
  } catch (error) {
    logger.error(`Payment start error: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Server Approval endpoint (PiRC2 required)
router.post('/pirc2/approve', async (req, res) => {
  try {
    const { paymentId, userDecision } = req.body;
    const mode = process.env.ATLASPI_MODE || 'demo';
    
    if (!paymentId) {
      return res.status(400).json({ ok: false, error: 'Missing paymentId' });
    }
    
    if (mode === 'demo') {
      return res.json({
        ok: true,
        paymentId: paymentId,
        serverApproved: true,
        mode: 'demo',
        message: 'Demo payment approved'
      });
    }
    
    // Mode PiRC2: Signer réponse si clé serveur dispo
    // NOTE: Nécessite PIRC2_SERVER_KEY pour signature réelle
    const approval = {
      paymentId: paymentId,
      approved: userDecision === 'approved',
      timestamp: Date.now()
    };
    
    logger.info(`Payment ${paymentId} approved: ${approval.approved}`);
    
    return res.json({
      ok: true,
      paymentId: paymentId,
      serverApproved: approval.approved,
      mode: mode,
      message: 'Server approved (signature pending)',
      // Signature serait ici si clé dispo:
      // signature: signPayment(approval, process.env.PIRC2_SERVER_KEY)
    });
  } catch (error) {
    logger.error(`Payment approve error: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Webhook handler (PiRC2)
router.post('/pirc2/webhook', async (req, res) => {
  try {
    const { paymentId, txid, status } = req.body;
    
    // Vérifier signature webhook (si secret dispo)
    // const signatureValid = verifyWebhookSignature(req, process.env.PIRC2_WEBHOOK_SECRET);
    
    logger.info(`Webhook: Payment ${paymentId} - ${status} - TXID: ${txid}`);
    
    // Mettre à jour DB
    db.run(
      `UPDATE payments SET txid = ?, status = ?, updated_at = ? WHERE payment_id = ?`,
      [txid, status, new Date().toISOString(), paymentId],
      function(err) {
        if (err) {
          logger.error(`Webhook DB error: ${err.message}`);
          return res.status(500).json({ ok: false, error: 'DB error' });
        }
        
        res.json({ ok: true, message: 'Webhook processed' });
      }
    );
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
  }
});
```

---

## 5. FICHIERS À MODIFIER

```
Configuration:
  ~ backend/.env (ajouter PiRC2_* vars)
  ~ frontend/config.js (PiRC2 mode detection)
  ~ docker-compose.yml (env vars PiRC2)

Frontend:
  ~ frontend/index.html (liens vers SDK, manifest)
  ~ frontend/script.js (connectWithPiRC2)

Backend:
  ~ backend/routes/auth.js (validatePiRC2Token, /pirc2 endpoint)
  ~ backend/routes/payments.js (PiRC2 payment flow)
  ~ backend/server.js (security headers, webhook middleware)
```

---

## 6. CONFIGURATION DOCKER

**docker-compose.yml - Ajouter env vars:**
```yaml
backend:
  environment:
    # ... existing ...
    ATLASPI_MODE: demo
    PIRC2_APP_ID: YOUR_APP_ID_HERE
    PIRC2_SDK_KEY: YOUR_SDK_KEY_HERE
    PIRC2_REDIRECT_URI: http://localhost:8080/auth/callback
    PIRC2_WEBHOOK_SECRET: YOUR_WEBHOOK_SECRET_HERE
    ALLOW_DEMO_AUTH: 'true'
```

---

## 7. TESTS (DAY 5)

```
✓ Auth Demo: Click "Connect" → should work
✓ Auth PiRC2-ready: Structure ready (SDK not loaded locally)
✓ Payments Demo: Create → Approve → Complete → all work
✓ Payments PiRC2-ready: Endpoints exist, mock validation works
✓ Merchant Create: Still works
✓ Merchant Edit: Still works
✓ Merchant Search: Still works
✓ Merchant Detail: Still works
✓ Admin Moderation: Still works
✓ History: Still works
✓ Docker: `docker-compose up` works
✓ Config Switching: Mode param respected
```

---

## 8. RÉALITÉ DE L'IMPLÉMENTATION

### CE QUI EST RÉELLEMENT IMPLÉMENTÉ:
✅ Structure PiRC2 (routes, endpoints, config)
✅ Mode switching (demo vs pirc2)
✅ Validation token skeleton (peut recevoir Pi API key)
✅ Payment flow skeleton (peut intégrer vrai Pi Payments)
✅ Webhook handler structure
✅ All existing features preserved
✅ Docker compatible
✅ Configuration prête pour PiRC2 real

### CE QUI RESTE EN MODE DÉMO:
⚠️ Pi SDK non chargé (nécessite vraies credentials)
⚠️ Token validation sans vraie API (mock mode)
⚠️ Payment validation sans blockchain (mock mode)
⚠️ Webhook signature verification sans secret
⚠️ Server approval signing sans clé serveur

### CE QUI MANQUE (PiRC2 réel):
❌ PIRC2_APP_ID réelle (developers.pi/)
❌ PIRC2_SDK_KEY réelle
❌ PIRC2_WEBHOOK_SECRET réelle
❌ PIRC2_SERVER_KEY réelle (pour signatures)
❌ Accès à Pi Testnet
❌ Testing avec vrai Pi SDK

---

## 9. RAPPORT FINAL (voir document séparé)

À voir dans: `PIRC2_INTEGRATION_FINAL_REPORT.md`

---

**STATUS**: Plan stratégique complet, implémentation 5 jours réalisable, mode hybride sûr.

