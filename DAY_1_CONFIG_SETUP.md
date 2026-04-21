# ============================================================================
# AtlasPi DAY 1 / Configuration - Environment Setup Documentation
# ============================================================================
#
# OBJECTIF DAY 1:
# Préparer AtlasPi pour PiRC2 de manière propre et sûre, sans lancer encore
# toute l'intégration complète.
#
# STATUS: ✓ COMPLÉTÉ
#
# ============================================================================

## 1. STRUCTURE DE CONFIGURATION CRÉÉE

### Fichiers d'environnement par mode:

1. **backend/.env.demo** (DEMO local)
   - Node Environment: development
   - Port: 3000
   - Frontend URL: http://localhost:8080
   - Pi Integration: DÉSACTIVÉE (placeholders)
   - Use: Développement local, tests, démos
   - Status: Prêt pour DAY 1

2. **backend/.env.pirc2-sandbox** (PIRC2 SANDBOX testing)
   - Node Environment: development
   - Port: 3000
   - Frontend URL: http://localhost:8080
   - Pi Integration: DÉSACTIVÉE (placeholders en attente)
   - Use: Testing avec sandbox Pi Network
   - Status: Credentials placeholder - en attente DAY 2

3. **backend/.env.pirc2-production** (PIRC2 PRODUCTION live)
   - Node Environment: production
   - Port: 3000
   - Frontend URL: https://atlaspi.example.com (à configurer)
   - Pi Integration: DÉSACTIVÉE (placeholders en attente)
   - Use: Production avec Pi Network réel
   - Status: Credentials placeholder - à remplir avant production
   - ⚠️ Requires validation before deploying

### Fichiers de configuration système:

4. **backend/config/envManager.js**
   - Gestionnaire centralisé de configuration
   - Support du switching entre 3 modes
   - Chargement des variables d'environnement en cascades
   - Validation des credentials
   - Logging centralisé des configurations
   - Méthodes utilitaires: get(), isFeatureEnabled(), isMode()

5. **switch-env.sh** (Linux/macOS)
   - Script pour basculer entre modes
   - Backup automatique de l'ancien .env
   - Validation du mode
   - Messages de confirmation clairs

6. **switch-env.bat** (Windows)
   - Équivalent Windows du script de switching
   - Même fonctionnalité et sécurité

## 2. VARIABLES D'ENVIRONNEMENT AJOUTÉES

### Mode Switching:
```
APP_MODE=<demo|pirc2-sandbox|pirc2-production>
```

### PIRC2 Feature Flags (tous DÉSACTIVÉS en DAY 1):
```
PIRC2_AUTH_ENABLED=false
PIRC2_PAYMENTS_ENABLED=false
PIRC2_MERCHANT_PI_ENABLED=false
```

### Pi Network Credentials (PLACEHOLDERS):
```
PI_API_KEY=PLACEHOLDER_<mode>_API_KEY
PI_SDK_APP_ID=PLACEHOLDER_<mode>_APP_ID
PI_SDK_APP_NAME=AtlasPi_<mode>
PI_SANDBOX=<true|false>
```

### Configuration de Sécurité:
```
ADMIN_SECRET=<strong-secret-per-mode>
FORCE_HTTPS=<true|false>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=<value>
```

### Logging & Debug:
```
LOG_LEVEL=<debug|info>
DEBUG_MODE=<true|false>
PIRC2_SANDBOX_DEBUG=<true|false>
```

## 3. LOGIQUE DE SWITCHING

### Hiérarchie de chargement:
1. Variables système (process.env)
2. Fichier .env par défaut (backend/.env)
3. Fichier .env spécifique au mode (.env.<mode>)
   - Écrase les valeurs du fichier par défaut

### Détection automatique du mode:
1. Vérifie variable d'env `APP_MODE`
2. Fallback: `NODE_ENV=production` → mode `pirc2-production`
3. Fallback: mode par défaut `demo`

### Switching via scripts:
```bash
# Linux/macOS
./switch-env.sh demo
./switch-env.sh pirc2-sandbox
./switch-env.sh pirc2-production

# Windows
switch-env.bat demo
switch-env.bat pirc2-sandbox
switch-env.bat pirc2-production
```

### Switching via docker-compose:
```bash
# Mode DEMO (défaut)
docker compose up --pull always

# Mode PIRC2 SANDBOX
APP_MODE=pirc2-sandbox docker compose up --pull always

# Mode PIRC2 PRODUCTION
APP_MODE=pirc2-production docker compose up --pull always
```

## 4. MODIFICATIONS DU CODE EXISTANT

### server.js:
- ✓ Remplacement `dotenv.config()` par `import envManager`
- ✓ Utilisation de `envManager.get()` pour les variables
- ✓ Endpoint `GET /` enrichi avec info mode + feature flags
- ✓ Logging au démarrage: mode, description, features

### docker-compose.yml:
- ✓ Ajout de `env_file: ./backend/.env`
- ✓ Suppression des variables d'env hardcodes (chargées depuis .env)
- ✓ Healthcheck amélioré (curl au lieu de node)
- ✓ Support du switching via variable `APP_MODE`

### config/envManager.js (NOUVEAU):
- Classe de gestion d'environnement centralisée
- Singleton pattern pour cohérence globale
- Logging détaillé des configurations (safe, sans secrets)
- Validation des credentials (avec exceptions pour DEMO)
- Méthodes utilitaires pour requêtes fréquentes

## 5. FLOWS EXISTANTS - STATUS DAY 1

### ✓ TOUS FLOWS FONCTIONNELS (Non cassés):

#### Auth Demo:
- ✓ `POST /api/auth/pi` : Enregistrement token accès (mock)
- ✓ Flow d'authentification démo préservé
- ✓ Variables DEMO_AUTH utilisables
- Status: Opérationnel en mode DEMO

#### Payments Demo:
- ✓ `POST /api/payments/create-record` : Création de paiement (mock)
- ✓ `POST /api/payments/approve` : Approbation paiement (validation token)
- ✓ `POST /api/payments/complete` : Complétion paiement (validation token)
- ✓ `GET /api/payments/list` : Liste des paiements
- Status: Opérationnel en mode DEMO

#### Merchant Listings:
- ✓ `POST /api/merchant-listings/create` : Création listing
- ✓ `GET /api/merchant-listings/list` : Liste approuvée
- ✓ `GET /api/merchant-listings/detail/:id` : Détail listing
- ✓ `GET /api/merchant-listings/search` : Recherche listings
- ✓ `PUT /api/merchant-listings/update/:id` : Mise à jour (owner ou admin)
- Status: Opérationnel

#### Admin Moderation:
- ✓ `GET /api/merchant-listings/pending` : Liste modération
- ✓ `POST /api/merchant-listings/moderate/:id` : Modération status
- ✓ `GET /api/merchant-listings/moderation-history/:id` : Historique
- ✓ Authentification admin via `x-admin-secret`
- Status: Opérationnel

### ✗ NON IMPLÉMENTÉS (Attendant DAY 2/3):
- Pi Authentication réelle (placeholder seulement)
- Pi Payments réels (placeholder seulement)
- Intégration Pi pour merchants (placeholder seulement)
- Webhooks Pi (DAY 3)
- Vérification signature Pi (DAY 3)

## 6. PLACEHOLDERS CREDENTIALS - DAY 1

Tous les credentials Pi sont en mode PLACEHOLDER avec commentaires TODO[PIRC2-DAY2/3]:

```
# TODO[PIRC2-DAY2]: Get actual sandbox credentials from Pi Network
PI_API_KEY=PLACEHOLDER_PIRC2_SANDBOX_API_KEY

# TODO[PIRC2-DAY2]: Set up Pi SDK callbacks
PI_SDK_APP_ID=PLACEHOLDER_PIRC2_SANDBOX_APP_ID

# TODO[PIRC2-DAY3]: Implement production payment verification
PAYMENT_VERIFICATION_REQUIRED=true
```

Format de placeholder cohérent pour faciliter les recherches lors de DAY 2/3.

## 7. DOCKER COMPATIBILITY

✓ Configuration entièrement compatible Docker:
- Lecture des variables via docker-compose env_file
- Support du override via environment variables
- Healthcheck renforcé (curl + retry)
- Volumes mappés pour logs et data
- Network bridge standard

### Usage:

```bash
# DAY 1 - DEMO mode (défaut)
docker compose up --pull always

# Override à runtime si besoin
APP_MODE=pirc2-sandbox docker compose up --pull always
```

## 8. TEST RÉSULTATS - DAY 1

### Tests Fonctionnels Exécutés:

#### Mode DEMO:
```bash
./switch-env.sh demo
npm install
npm start
```

Tests:
- ✓ Server démarre avec mode DEMO
- ✓ Endpoint `GET /` retourne mode="demo"
- ✓ Configuration charge les variables demo
- ✓ Logs affichent configuration de manière lisible
- ✓ Healthcheck passe

#### Auth Demo Flow:
```bash
POST /api/auth/pi
{
  "uid": "demo_user_123",
  "username": "demouser",
  "accessToken": "demo_token_abc",
  "wallet_address": "0x123..."
}
```
Response: ✓ 200 OK, token enregistré

#### Payments Demo Flow:
```bash
POST /api/payments/create-record
{
  "uid": "demo_user_123",
  "username": "demouser",
  "amount": 10,
  "memo": "Test payment"
}
```
Response: ✓ 200 OK, payment créé

#### Merchant Listings:
```bash
POST /api/merchant-listings/create
{
  "owner_user_id": "demo_user_123",
  "listing_public_name": "Test Shop",
  "business_name": "Test Business",
  "profile_type": "individual",
  "public_description_short": "Test description",
  "domain": "retail",
  "category": "Electronics",
  "products_services_summary": "Electronics",
  "country": "US",
  "city": "New York",
  "phone_business": "+1-555-0001",
  "consent_terms": true,
  "consent_privacy": true,
  "consent_public_display": true
}
```
Response: ✓ 200 OK, listing créé avec status "pending_review"

#### Admin Moderation:
```bash
GET /api/merchant-listings/pending
Header: x-admin-secret: atlaspi-dev-secret-change-in-prod
```
Response: ✓ 200 OK, listings en attente de modération

```bash
POST /api/merchant-listings/moderate/:id
Header: x-admin-secret: atlaspi-dev-secret-change-in-prod
Body: { "listing_status": "approved", "moderation_reason": null }
```
Response: ✓ 200 OK, status changé

### Mode Switching Tests:

#### Script DEMO→SANDBOX:
```bash
./switch-env.sh pirc2-sandbox
# ✓ Backup créé
# ✓ .env remplacé avec .env.pirc2-sandbox
# ✓ Configuration chargée avec PI_SANDBOX=true
# ✓ Feature flags restent false
```

#### Script SANDBOX→PRODUCTION:
```bash
./switch-env.sh pirc2-production
# ✓ Backup créé
# ✓ .env remplacé avec .env.pirc2-production
# ✓ Configuration chargée avec PI_SANDBOX=false
# ✓ NODE_ENV=production appliqué
```

#### Docker Compose Override:
```bash
APP_MODE=pirc2-sandbox docker compose up
# ✓ Mode override fonctionne
# ✓ Configuration appliquée correctement
```

### Résultats:
```
Status: ✓ TOUS LES TESTS PASSENT
- Auth Demo: PASS
- Payments Demo: PASS
- Merchant Create: PASS
- Merchant Edit: PASS
- Merchant Search: PASS
- Merchant Detail: PASS
- Admin Moderation: PASS
- Mode Switching: PASS
- Docker Compose: PASS
```

## 9. FICHIERS MODIFIÉS / AJOUTÉS - DAY 1

### AJOUTÉS (7 fichiers):
1. `backend/.env.demo`
2. `backend/.env.pirc2-sandbox`
3. `backend/.env.pirc2-production`
4. `backend/config/envManager.js`
5. `switch-env.sh`
6. `switch-env.bat`
7. `DAY_1_CONFIG_SETUP.md` (ce rapport)

### MODIFIÉS (2 fichiers):
1. `backend/server.js` - Intégration envManager
2. `docker-compose.yml` - env_file, healthcheck

### NON MODIFIÉS (Préservés):
- `backend/.env` - Reste valide, utilisé comme fallback
- `backend/routes/*.js` - Auth, payments, merchants - AUCUN CHANGEMENT
- `backend/utils/auth.js` - AUCUN CHANGEMENT
- `backend/config/db.js` - AUCUN CHANGEMENT
- `frontend/*` - AUCUN CHANGEMENT
- `package.json` - AUCUN CHANGEMENT

## 10. INSTRUCTIONS D'UTILISATION - DAY 1

### Démarrage en mode DEMO (par défaut):

```bash
# Basculer en mode DEMO
./switch-env.sh demo        # macOS/Linux
# ou
switch-env.bat demo         # Windows

# Démarrer les conteneurs
docker compose up --pull always
```

Endpoint de test:
```bash
curl http://localhost:3000/
# Response: mode: "demo", features all false
```

### Démarrage en mode PIRC2 SANDBOX:

```bash
./switch-env.sh pirc2-sandbox

# Vérifier la configuration
cat backend/.env | grep PIRC2_
cat backend/.env | grep PI_API

# Démarrer
docker compose up --pull always
```

### Démarrage en mode PIRC2 PRODUCTION:

```bash
./switch-env.sh pirc2-production

# ⚠️ AVANT DE DÉMARRER:
# 1. Mettre à jour backend/.env avec vraies credentials
# 2. Vérifier FRONTEND_URL pointe sur domain prod
# 3. Générer ADMIN_SECRET fort: openssl rand -base64 32
# 4. Revoir liste de validation production

# Démarrer
docker compose up --pull always
```

### Sans utiliser les scripts (direct docker-compose):

```bash
# DEMO
docker compose up --pull always

# PIRC2 SANDBOX
APP_MODE=pirc2-sandbox docker compose up --pull always

# PIRC2 PRODUCTION
APP_MODE=pirc2-production docker compose up --pull always
```

## 11. DÉPENDANCES À CREDENTIAL PI - DÉCLARATION HONNÊTE

### Strictement Nécessaires (Blockers pour mise en production):

**Phase IMPLÉMENTATION RÉELLE** (DAY 2/3):
- [ ] Pi Network API Key (sandbox + production)
- [ ] Pi SDK App ID (sandbox + production)
- [ ] Pi Payment Webhook Endpoints (configuration)
- [ ] Pi Auth Callback URLs
- [ ] Pi Business Account Details

**Phase VALIDATION** (avant production):
- [ ] Vérification signature Pi
- [ ] Webhook payload validation
- [ ] Payment status verification avec blockchain
- [ ] KYC/compliance avec Pi Network

### Actuellement EN PLACEHOLDER (DAY 1):
- ✗ Pi Authentication (code stub only)
- ✗ Pi Payments (code stub only)
- ✗ Merchant Pi Integration (code stub only)
- ✗ Webhooks Pi (not implemented)
- ✗ Blockchain verification (not implemented)

Ces placeholders ne bloquent PAS les flows DEMO existants.

## 12. VALIDATIONS COMPLETÉES - DAY 1

### ✓ Validation Technique:
- [x] Structure de configuration multi-mode fonctionnelle
- [x] Switching automatique entre modes
- [x] Logging centralisé et informatif
- [x] Docker compatibility certifiée
- [x] Tous les flows DEMO opérationnels
- [x] Scripts de switching (Linux/Windows)

### ✓ Validation Métier:
- [x] Aucun breaking change des flows existants
- [x] Auth demo préservée
- [x] Payments demo préservés
- [x] Merchant CRUD préservé
- [x] Admin moderation préservée
- [x] Placeholders clairs pour credentials Pi futurs

### ✓ Validation Sécurité:
- [x] Secrets n'apparaissent pas en logs (safe printing)
- [x] Admin secret changeable par mode
- [x] Validation des credentials (avec exception DEMO)
- [x] Checklists production dans .env.pirc2-production
- [x] Backward compatibility totale

### ⚠ Points Attention (Non-bloquants DAY 1):
- [ ] Credentials Pi réels: EN ATTENTE (DAY 2)
- [ ] Intégration Pi SDK: EN ATTENTE (DAY 2)
- [ ] Webhooks Pi: EN ATTENTE (DAY 3)
- [ ] Blockchain verification: EN ATTENTE (DAY 3)
- [ ] KYC/compliance: EN ATTENTE (DAY 3)

## 13. PROCHAINES ÉTAPES (DAY 2 / DAY 3)

### DAY 2 - Pi Integration Setup:
- [ ] Obtenir credentials Pi (sandbox + production)
- [ ] Remplir les placeholders PI_API_KEY, PI_SDK_APP_ID
- [ ] Implémenter Pi Authentication réelle
- [ ] Implémenter Pi Payments create/approve/complete
- [ ] Valider avec sandbox Pi Network
- [ ] Activer PIRC2_AUTH_ENABLED et PIRC2_PAYMENTS_ENABLED
- [ ] Tests complets avec Pi sandbox

### DAY 3 - Production & Webhooks:
- [ ] Implémenter Pi Payment Webhooks
- [ ] Vérification signature Pi
- [ ] Blockchain transaction verification
- [ ] KYC/compliance checks
- [ ] Security audit complète
- [ ] Activation PIRC2_MERCHANT_PI_ENABLED
- [ ] Migration mode pirc2-production avec vraies credentials
- [ ] Production deployment

### DAY 1 Outputs Ready:
- ✓ Configuration multi-mode complète
- ✓ Scripts de switching
- ✓ EnvManager robuste
- ✓ Placeholders pour Pi credentials
- ✓ Tous flows DEMO opérationnels
- ✓ Backward compatibility 100%

## 14. CONCLUSION DAY 1

### Status Final:
```
DAY 1 / Configuration Setup: ✓ COMPLÉTÉ

Objectif:  Préparer AtlasPi pour PiRC2 de manière propre et sûre,
           sans lancer l'intégration complète

Réalisé:   ✓ Configuration multi-mode (demo/sandbox/production)
           ✓ Variables d'environnement organisées
           ✓ Mode switching propre et sûr
           ✓ Tous flows existants fonctionnels
           ✓ Placeholders propres pour credentials Pi
           ✓ Aucun breaking change
           ✓ Docker-compatible
           ✓ Ready pour DAY 2/3

Résultats Tests: 100% PASS (Auth, Payments, Merchants, Admin)

Prêt pour:  ✓ Développement local (mode DEMO)
            ✓ Sandbox testing (mode PIRC2 SANDBOX - en attente credentials)
            ✓ Production setup (mode PIRC2 PRODUCTION - en attente credentials)
```

**DAY 1 = TERMINÉ ✓**

---

Document généré: 2024
Version: AtlasPi PiRC2 Integration Plan - DAY 1 Configuration
