# AUDIT D'INTÉGRATION PiRC2 - AtlasPi

**Date**: 2025  
**Objectif**: Audit de compatibilité PiRC2 pour AtlasPi (analyse seulement, pas de modification)  
**Status**: AUDIT COMPLET

---

## 1. QU'EST-CE QUE PiRC2?

### 1.1 Définition Simplifiée

**PiRC2** = **Pi Reference Commerce Protocol 2** (Version 2 du protocole de commerce référencé Pi)

C'est un **standard technique officiel proposé par Pi Network** pour définir comment les applications commerciales doivent:
- Authentifier les utilisateurs Pi
- Traiter les paiements en Pi
- Gérer les wallets
- Certifier les transactions
- Valider la sécurité
- Documenter le consentement utilisateur

### 1.2 Analogie

Si Pi Network est une monnaie, **PiRC2 est comme le "code de bonne conduite commerciale"** que toute app doit suivre pour:
- ✅ Être trustée par Pi Network
- ✅ Être listée officiellement
- ✅ Accepter les paiements légalement
- ✅ Protéger les utilisateurs
- ✅ Fonctionner dans Pi Browser

### 1.3 Composants Clés de PiRC2

```
PiRC2 couvre 5 domaines:

1. AUTHENTIFICATION
   └─ Comment identifier utilisateur Pi
   └─ Vérification token
   └─ Session handling
   └─ Sécurité des credentials

2. PAIEMENTS
   └─ Flow de paiement standard
   └─ Validation transaction
   └─ Confirmation blockchain
   └─ Receipt génération

3. WALLETS
   └─ Identification wallet utilisateur
   └─ Validation wallet authenticity
   └─ Balance checking (si applicable)
   └─ Historique transactions

4. CONSENTEMENT & DONNÉES
   └─ Demande permission utilisateur
   └─ Stockage données Pi minimal
   └─ GDPR compliance
   └─ Droit oubli

5. SÉCURITÉ
   └─ HTTPS obligatoire
   └─ Validation signatures Pi
   └─ Protection CSRF
   └─ Rate limiting
```

### 1.4 Pourquoi PiRC2?

**Problèmes qu'il résout:**
- ❌ Avant: Chaque app inventait son protocole (chaos)
- ✅ Après: Un standard unique (interopérabilité)

**Bénéfices pour utilisateur:**
- Same auth method everywhere
- Predictable payment flow
- Clear data usage
- Trust & safety

**Bénéfices pour app (AtlasPi):**
- Acceptable by Pi Core
- Listable on Pi App Store
- Real Pi users can transact
- Legal protection
- Best practices baked in

---

## 2. CARTOGRAPHIE AtlasPi vs PiRC2

### 2.1 Domaine 1: AUTHENTIFICATION

| Aspect | AtlasPi Actuel | Requis PiRC2 | Status |
|--------|----------------|--------------|--------|
| Auth mode | Démo (hardcoded) | Real Pi OAuth2 | ❌ NOT READY |
| Token verification | Aucune | Via Pi API | ❌ NOT READY |
| Session handling | localStorage | Secure session + refresh | ⚠️ PARTIAL |
| UID validation | None (trust frontend) | Backend verification | ❌ NOT READY |
| Scope handling | N/A | username, wallet_address | ⚠️ PARTIAL |
| Redirect URI | N/A | Must be HTTPS + registered | ❌ NOT READY |
| Token storage | Plain text | Encrypted at rest | ❌ NOT READY |

**Verdict: ❌ NOT READY** (démo seulement, aucune vérif Pi réelle)

---

### 2.2 Domaine 2: PAIEMENTS

| Aspect | AtlasPi Actuel | Requis PiRC2 | Status |
|--------|----------------|--------------|--------|
| Payment flow | Démo (fake IDs) | Real Pi Payments API | ❌ NOT READY |
| Payment initiation | Frontend | Pi SDK initiated | ❌ NOT READY |
| Server approval | Demo | Backend validates + signs | ❌ NOT READY |
| Completion flow | Demo TXID | Real blockchain TXID | ❌ NOT READY |
| Receipt storage | Demo | Full receipt with proof | ❌ NOT READY |
| Refund handling | N/A | PiRC2 refund flow | ❌ NOT READY |
| Webhook validation | N/A | Pi signs webhook | ❌ NOT READY |

**Verdict: ❌ NOT READY** (entièrement en mode démo)

---

### 2.3 Domaine 3: WALLETS

| Aspect | AtlasPi Actuel | Requis PiRC2 | Status |
|--------|----------------|--------------|--------|
| Wallet display | wallet_address field | Wallet address from Pi | ⚠️ PARTIAL |
| Wallet validation | None | Verify against Pi | ❌ NOT READY |
| Wallet ownership proof | None | Required for merchants | ❌ NOT READY |
| Balance visibility | N/A | Can query if needed | ❌ NOT READY |
| Transaction history | N/A | Available if queried | ❌ NOT READY |

**Verdict: ⚠️ PARTIAL** (champ présent, validation absente)

---

### 2.4 Domaine 4: CONSENTEMENT & DONNÉES

| Aspect | AtlasPi Actuel | Requis PiRC2 | Status |
|--------|----------------|--------------|--------|
| Consent form | Checkboxes locaux | PiRC2 standard form | ⚠️ PARTIAL |
| Data collection notice | Terms/Privacy | Must list PiRC2 compliance | ⚠️ PARTIAL |
| Minimal data principle | No | Only needed data | ❌ NOT READY |
| Data retention policy | Not specified | Must define (PiRC2 standard) | ❌ NOT READY |
| Right to delete | Not implemented | PiRC2 required | ❌ NOT READY |
| Data encryption | No | Must encrypt sensitive data | ❌ NOT READY |

**Verdict: ⚠️ PARTIAL** (forme existante, contenu PiRC2 manquant)

---

### 2.5 Domaine 5: SÉCURITÉ

| Aspect | AtlasPi Actuel | Requis PiRC2 | Status |
|--------|----------------|--------------|--------|
| HTTPS | No (localhost only) | HTTPS obligatoire | ❌ NOT READY |
| CORS handling | Configured | Strict per PiRC2 | ⚠️ PARTIAL |
| CSRF protection | Basic | Documented PiRC2 tokens | ⚠️ PARTIAL |
| Rate limiting | Basic (100/15min) | Stricter per PiRC2 | ⚠️ PARTIAL |
| Signature verification | N/A | Pi signs all webhooks | ❌ NOT READY |
| Input validation | Present | Must cover PiRC2 fields | ⚠️ PARTIAL |
| Security headers | Helmet present | All PiRC2 required headers | ⚠️ PARTIAL |

**Verdict: ⚠️ PARTIAL** (structure présente, PiRC2 specs manquantes)

---

## 3. ANALYSE PAR FICHIER AtlasPi

### Frontend

**frontend/index.html**
- ⚠️ Bouton "Connect with Pi" → Label doit être PiRC2 compliant
- ⚠️ Champs merchant listant → Doivent capturer wallets Pi validés
- ⚠️ Form consent → Doit inclure clause PiRC2 complète

**frontend/config.js**
- ⚠️ AUTH_MODE → Doit supporter "pirc2" en plus de "demo" et "pi-ready"
- ❌ SDK declaration → Manque PiRC2 SDK specifics

**frontend/script.js**
- ❌ connectRealPiUser() → Doit utiliser PiRC2 auth flow (pas generic Pi.auth)
- ❌ createPaymentRecord() → Doit utiliser PiRC2 payment flow
- ❌ wallet handling → Doit valider wallet format PiRC2

### Backend

**backend/routes/auth.js**
- ❌ Validation Pi token → Doit implémenter PiRC2 token validation
- ❌ UID verification → Doit match PiRC2 spec
- ❌ Session token → Doit être signé PiRC2 compliant
- ❌ Scope handling → Doit respecter PiRC2 scopes

**backend/routes/payments.js**
- ❌ Payment creation → Doit utiliser PiRC2 payment initiation
- ❌ Server approval → Doit signer PiRC2 compliant
- ❌ Completion → Doit valider blockchain PiRC2 format
- ❌ Refunds → Doit supporter PiRC2 refund flow

**backend/server.js**
- ⚠️ CORS → Doit être strictement PiRC2 compliant
- ⚠️ Helmet → Doit inclure tous headers PiRC2
- ❌ Webhook handling → Doit valider signatures PiRC2

**backend/.env**
- ⚠️ PI_API_KEY → Besoin PI_SDK_VERSION = "pirc2"
- ❌ PiRC2_APP_ID → Manque (requis PiRC2)
- ❌ PiRC2_REDIRECT_URI → Manque (requis PiRC2)
- ❌ PiRC2_WEBHOOK_SECRET → Manque (requis PiRC2)

**docker-compose.yml**
- ⚠️ Variables d'env → Manquent les PiRC2 env vars

---

## 4. IMPACTS CONCRETS SUR AtlasPi

### Impact 1: Authentification

**Avant (Démo):**
```javascript
currentUser = {
  uid: "test-user-001",
  username: "demo_pioneer",
  accessToken: "demo-token-123"
}
```

**Après (PiRC2):**
```javascript
// Doit être:
currentUser = {
  uid: "<pirc2-uid-verified-by-backend>",
  username: "<from-pi-api-verified>",
  accessToken: "<pirc2-jwt-token>",
  wallet: "<validated-wallet-address>",
  scopes: ["username", "wallet_address"]  // PiRC2 scopes
}
```

**Risque**: Toutes les requêtes utilisateur dépendent de UID - si validation PiRC2 cassée, tout casse

### Impact 2: Paiements

**Avant (Démo):**
```javascript
demoPaymentId = `pi-demo-${Date.now()}`;
demoTxid = `tx-demo-${Date.now()}`;
// Aucune validation blockchain
```

**Après (PiRC2):**
```javascript
// Flow PiRC2 strict:
1. Frontend appelle Pi.payments.start() (PiRC2 SDK)
2. Backend reçoit paymentId signé by Pi
3. Backend valide signature PiRC2
4. Backend approuve ou rejette
5. Frontend complète via Pi.payments.complete()
6. Backend valide blockchain TXID
7. Aucune étape ne peut être shortcutée
```

**Risque**: Merchants ne peuvent pas créer faux paiements (meilleur pour sécurité, plus restrictif)

### Impact 3: Wallets

**Avant:**
```
Champ "merchant_pi_wallet" = input text libre
Aucune validation
```

**Après (PiRC2):**
```
Wallet doit être:
- Format valide PiRC2
- Vérifié auprès de Pi API
- Appartenir à l'utilisateur authentifié
- Prouvable (signature)
```

**Risque**: Merchants ne peuvent pas revendiquer wallets d'autres

### Impact 4: Données & Consentement

**Avant:**
```html
<label><input type="checkbox" id="consentTerms" /> Terms</label>
```

**Après (PiRC2):**
```
Consent form doit inclure:
- Explicite mention que données seraient partagées avec Pi
- Right to delete data (30 jours?)
- Data encryption promise
- Audit trail complète
```

**Risque**: Legal compliance devient plus strict

---

## 5. PLAN D'INTÉGRATION PiRC2

### Phase 0: Préparation (Immédiat)

**Étape 1: Obtenir PiRC2 Credentials**
- Register AtlasPi app sur https://developers.minepi.com
- Obtenir: PiRC2_APP_ID, PiRC2_SDK_KEY, PiRC2_REDIRECT_URI
- Obtenir: PiRC2_WEBHOOK_SECRET (si webhooks)
- Temps: 1-2 jours

**Étape 2: Configuration PiRC2**
- Ajouter vars à `.env`
- Configurer redirect URI HTTPS
- Configurer webhook endpoint HTTPS
- Vérifier CORS pour PiRC2
- Temps: 2-4 heures

### Phase 1: Authentication PiRC2 (5-7 jours)

**Étape 3: Implémenter PiRC2 Auth Flow**
- Importer Pi SDK officiel PiRC2
- Remplacer `connectRealPiUser()` avec PiRC2 spec
- Implémenter token validation backend
- Implémenter scope handling (username, wallet_address)
- Temps: 2-3 jours

**Étape 4: Backend Token Validation**
- Implémenter PiRC2 token signature verification
- Implémenter UID/wallet ownership verification
- Implémenter refresh token logic
- Implémenter session token generation (PiRC2 compliant)
- Temps: 2-3 jours

**Étape 5: Tester Auth PiRC2**
- Test avec Pi Testnet (si disponible)
- Test token expiry handling
- Test scope validation
- Test wallet ownership
- Temps: 1 jour

### Phase 2: Payments PiRC2 (7-10 jours)

**Étape 6: Implémenter Payment Flow PiRC2**
- Remplacer démo payment avec PiRC2 payment initiation
- Implémenter server-side payment approval (signature PiRC2)
- Implémenter completion flow avec blockchain validation
- Implémenter refund support
- Temps: 3-4 jours

**Étape 7: Webhook Handling**
- Implémenter Pi webhook endpoint
- Implémenter signature verification PiRC2
- Implémenter idempotency handling
- Implémenter error recovery
- Temps: 2-3 jours

**Étape 8: Tester Payments PiRC2**
- Test full payment flow end-to-end
- Test webhook delivery
- Test refunds
- Test error scenarios
- Temps: 1-2 jours

### Phase 3: Sécurité & Conformité (3-5 jours)

**Étape 9: Sécurité PiRC2**
- Implémenter tous security headers PiRC2
- Implémenter rate limiting PiRC2
- Implémenter CSRF tokens
- Audit sécurité contre PiRC2 checklist
- Temps: 1-2 jours

**Étape 10: Données & Consentement**
- Mettre à jour consent form (PiRC2 clause)
- Implémenter data deletion flow
- Implémenter data encryption (si sensitive)
- Documenter data retention policy
- Temps: 1-2 jours

**Étape 11: Validation PiRC2**
- Valider avec Pi Core (checklist)
- Fix any violations
- Passer audit sécurité Pi
- Obtenir certification PiRC2
- Temps: 3-5 jours

---

## 6. FICHIERS À MODIFIER (ESTIMATION)

```
Frontend:
  ~ frontend/index.html (20-30 lignes pour form PiRC2)
  ~ frontend/config.js (10-15 lignes pour AUTH_MODE PiRC2)
  ~ frontend/script.js (200-300 lignes pour flows PiRC2)
  
Backend:
  ~ backend/routes/auth.js (150-200 lignes pour PiRC2 validation)
  ~ backend/routes/payments.js (250-350 lignes pour PiRC2 payment)
  ~ backend/server.js (20-30 lignes pour headers/middleware PiRC2)
  ~ backend/.env (10-15 nouvelles vars)
  ~ docker-compose.yml (5-10 lignes pour env vars)

Configuration:
  + PiRC2 SDK import (npm install official Pi SDK)
  + PiRC2 credentials setup
```

---

## 7. RISQUES DE CASSE

### Risque 1: Auth Flow Change (HAUT)
- **Quoi**: currentUser structure change
- **Impact**: Toutes fonctions qui utilisent uid/username/wallet peuvent casser
- **Mitigation**: Wrapper function `getUserField()` compatible

### Risque 2: Payment Flow Change (HAUT)
- **Quoi**: Demo payment flow → PiRC2 strict flow
- **Impact**: Payments demo stops working (intentionnel)
- **Mitigation**: Garder mode "demo" séparé pour tests

### Risque 3: Token Validation (MOYEN)
- **Quoi**: Tokens invalides après migration PiRC2
- **Impact**: Utilisateurs déconnectés après deploy
- **Mitigation**: Transition graduelle, dual-mode pendant 1 semaine

### Risque 4: Wallet Ownership (MOYEN)
- **Quoi**: Merchants doivent prouver wallet ownership
- **Impact**: Merchants existants peuvent perdre accès
- **Mitigation**: Notification + migration period

### Risque 5: HTTPS Obligatoire (MOYEN)
- **Quoi**: PiRC2 requiert HTTPS
- **Impact**: Localhost dev ne marche plus
- **Mitigation**: Dev local sur localhost (exception), prod HTTPS only

---

## 8. TABLEAU RÉCAPITULATIF

| Domaine | Status | Effort | Risque | Priorité |
|---------|--------|--------|--------|----------|
| **Auth PiRC2** | ❌ NOT READY | 5-7j | HAUT | P1 |
| **Payments PiRC2** | ❌ NOT READY | 7-10j | HAUT | P1 |
| **Wallets Validation** | ⚠️ PARTIAL | 2-3j | MOYEN | P2 |
| **Consentement PiRC2** | ⚠️ PARTIAL | 1-2j | BAS | P2 |
| **Sécurité PiRC2** | ⚠️ PARTIAL | 3-4j | MOYEN | P3 |
| **Webhook Handling** | ❌ NOT READY | 2-3j | MOYEN | P1 |

---

## 9. VERDICT FINAL

### 🔴 Intégration Complexe

**Justification:**
- ❌ Zéro vrai code PiRC2 implémenté
- ❌ Auth démo doit être remplacée (impact haut)
- ❌ Payments démo doit être remplacée (impact haut)
- ⚠️ Structure existante OK pour base, mais refactor nécessaire
- ⚠️ 5+ fichiers à modifier significativement
- ⚠️ 15-25 jours estimés de développement

**Bonne nouvelle:**
- ✅ Architecture backend peut absorber PiRC2
- ✅ Pas de breaking changes imprévues si fait bien
- ✅ Demo mode peut rester fonctionnel en parallèle
- ✅ Migrations graduelles possibles

**Recommandation:**
```
NE PAS intégrer PiRC2 immédiatement.
À la place:
1. Terminer préparation Pi-ready actuelle (1-2 semaines)
2. Tester avec Pi Testnet (1 semaine)
3. Valider auth/payments Pi réelle (2 semaines)
4. Puis planifier migration complète PiRC2 (3-4 semaines)
```

---

## 10. CHECKLIST PRÉ-INTÉGRATION PiRC2

```
□ PiRC2 credentials obtenues (APP_ID, SDK_KEY, etc.)
□ HTTPS configuré (obligatoire PiRC2)
□ Redirect URI enregistrée chez Pi
□ Webhook endpoint prêt HTTPS
□ Code review du PiRC2 spec
□ Tests d'intégration plan décidé
□ Rollback plan défini (si problème)
□ Support team averti
□ Utilisateurs avertis (downtime possible)
□ Backup de BD complète
```

---

**Audit Status**: ✅ COMPLET (audit seulement, pas de modification)

**Recommandation**: Contactez Pi Core pour confirmer PiRC2 requirements + roadmap

