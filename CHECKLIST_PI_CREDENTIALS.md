# 📋 CHECKLIST CREDENTIALS Pi - AtlasPi

## Fiche des Variables à Remplir

### Mode PIRC2-SANDBOX

| Variable | Rôle | Format | Obligatoire | Source |
|----------|------|--------|-------------|--------|
| **PI_API_KEY** | Clé d'accès à l'API Pi sandbox | String alphanumérique, 32+ caractères | ✅ OUI | Pi Network Sandbox Dashboard |
| **PI_SDK_APP_ID** | Identifiant unique de l'app Pi | UUID ou string, ex: `12345` | ✅ OUI | Pi Network Sandbox Console |
| **PI_SDK_APP_NAME** | Nom de l'application pour Pi | String alphanumérique, ex: `AtlasPi_Sandbox` | ⚠️ NON | Déjà fourni: `AtlasPi_Sandbox` |
| **PIRC2_CALLBACK_URL** | URL où Pi renvoie les résultats d'auth | `https://your-domain.com/callbacks/pi` | ✅ OUI | Votre domaine + endpoint |
| **PIRC2_WEBHOOK_SECRET** | Secret pour vérifier les signatures webhook Pi | String alphanumérique, 32+ caractères | ✅ OUI | Pi Network Sandbox Dashboard |
| **PIRC2_SERVER_KEY** | Clé privée server-to-server (si nécessaire) | String alphanumérique | ⚠️ NON | Pi Network Sandbox Dashboard |
| **PI_API_BASE_URL** | Endpoint API Pi sandbox | `https://sandbox-api.minepi.com` | ⚠️ NON | Déjà fourni |
| **PI_SANDBOX** | Flag sandbox mode | `true` | ⚠️ NON | Déjà fourni |

### Mode PIRC2-PRODUCTION

| Variable | Rôle | Format | Obligatoire | Source |
|----------|------|--------|-------------|--------|
| **PI_API_KEY** | Clé d'accès à l'API Pi mainnet | String alphanumérique, 32+ caractères | ✅ OUI | Pi Network Production Dashboard |
| **PI_SDK_APP_ID** | Identifiant unique de l'app Pi | UUID ou string | ✅ OUI | Pi Network Production Console |
| **PI_SDK_APP_NAME** | Nom de l'application pour Pi | String alphanumérique, ex: `AtlasPi_Production` | ⚠️ NON | Déjà fourni: `AtlasPi_Production` |
| **PIRC2_CALLBACK_URL** | URL où Pi renvoie les résultats d'auth | `https://your-production-domain.com/callbacks/pi` | ✅ OUI | Votre domaine prod + endpoint |
| **PIRC2_WEBHOOK_SECRET** | Secret pour vérifier les signatures webhook Pi | String alphanumérique, 32+ caractères | ✅ OUI | Pi Network Production Dashboard |
| **PIRC2_SERVER_KEY** | Clé privée server-to-server | String alphanumérique | ✅ OUI | Pi Network Production Dashboard |
| **PI_API_BASE_URL** | Endpoint API Pi mainnet | `https://api.minepi.com` | ⚠️ NON | Déjà fourni |
| **PI_SANDBOX** | Flag sandbox mode | `false` | ⚠️ NON | Déjà fourni |
| **FRONTEND_URL** | URL du frontend production | `https://your-production-domain.com` | ✅ OUI | Votre domaine |

---

## 🔑 Variables Détaillées

### PI_API_KEY (SANDBOX)
```
Rôle:         Authentification auprès de Pi Network Sandbox
Format:       String hexadécimal ou alphanumérique
Longueur:     Minimum 32 caractères
Exemple:      "sk_sandbox_abc1234567890def1234567890abcdefgh"
Où obtenir:   Pi Network Sandbox Dashboard → API Keys
Sécurité:     NE JAMAIS committer dans Git
             NE JAMAIS exposer en logs
```

### PI_SDK_APP_ID (SANDBOX)
```
Rôle:         Identifiant unique de votre app dans Pi Network
Format:       UUID ou string numérique
Exemple:      "550e8400-e29b-41d4-a716-446655440000"
Où obtenir:   Pi Network Sandbox Console → My Apps → App ID
Sécurité:     Peut être semi-public (moins sensible que API_KEY)
```

### PIRC2_CALLBACK_URL (SANDBOX)
```
Rôle:         URL où Pi envoie les résultats d'authentification
Format:       URL HTTPS complète avec endpoint
Exemple:      "https://atlaspi.dev-sandbox.com/callbacks/pi"
Où obtenir:   Votre domaine + endpoint que vous exposez
Sécurité:     Doit être publiquement accessible
             HTTPS requis en production
Endpoint:     POST /callbacks/pi (à implémenter en DAY 4)
```

### PIRC2_WEBHOOK_SECRET (SANDBOX)
```
Rôle:         Secret pour signer/vérifier les webhooks de Pi
Format:       String alphanumérique, 32+ caractères
Exemple:      "wh_sandbox_secret_abc1234567890def1234567890"
Où obtenir:   Pi Network Sandbox Dashboard → Webhooks → Secret
Sécurité:     TRÈS SENSIBLE - NE JAMAIS exposer
             Utilisé pour vérifier HMAC des webhooks Pi
```

### PIRC2_SERVER_KEY (SANDBOX - Optionnel)
```
Rôle:         Clé privée pour appels server-to-server Pi
Format:       String alphanumérique
Exemple:      "srv_sandbox_key_abc1234567890def1234567890"
Où obtenir:   Pi Network Sandbox Dashboard → Server Keys (si applicable)
Sécurité:     TRÈS SENSIBLE
Optionnel:    Peut ne pas être nécessaire selon la version Pi SDK
```

---

## ✅ CHECKLIST D'ACTIVATION - ÉTAPE PAR ÉTAPE

### Phase 1: Préparation (SANS modification .env)

- [ ] **Créer account Pi Network Business**
  - URL: https://business.minepi.com (sandbox)
  - Obtenir: Email de confirmation

- [ ] **Enregistrer l'application SANDBOX**
  - Dans Pi Network Sandbox Console
  - Name: `AtlasPi_Sandbox`
  - Callback URL: `https://your-domain/callbacks/pi`
  - Obtenir: PI_SDK_APP_ID

- [ ] **Générer API Keys SANDBOX**
  - Dans Pi Network Sandbox Dashboard
  - Type: REST API Key
  - Obtenir: PI_API_KEY (sandbox)

- [ ] **Générer Webhook Secret SANDBOX**
  - Dans Pi Network Dashboard → Webhooks
  - Obtenir: PIRC2_WEBHOOK_SECRET (sandbox)

- [ ] **Déterminer votre domaine SANDBOX**
  - Format: `https://your-domain.com`
  - Doit être accessible publiquement
  - Callback URL: `https://your-domain.com/callbacks/pi`

### Phase 2: Remplissage des Variables (SANDBOX)

- [ ] **Ouvrir le fichier:** `backend/.env.pirc2-sandbox`

- [ ] **Remplacer PI_API_KEY**
  ```bash
  # Avant:
  PI_API_KEY=PLACEHOLDER_PIRC2_SANDBOX_API_KEY
  
  # Après:
  PI_API_KEY=<votre-clé-sandbox>
  ```

- [ ] **Remplacer PI_SDK_APP_ID**
  ```bash
  # Avant:
  PI_SDK_APP_ID=PLACEHOLDER_PIRC2_SANDBOX_APP_ID
  
  # Après:
  PI_SDK_APP_ID=<votre-app-id-sandbox>
  ```

- [ ] **Ajouter PIRC2_CALLBACK_URL (nouveau)**
  ```bash
  # Ajouter cette ligne dans le fichier:
  PIRC2_CALLBACK_URL=https://your-domain.com/callbacks/pi
  ```

- [ ] **Ajouter PIRC2_WEBHOOK_SECRET (nouveau)**
  ```bash
  # Ajouter cette ligne dans le fichier:
  PIRC2_WEBHOOK_SECRET=<votre-webhook-secret-sandbox>
  ```

- [ ] **Vérifier les URLs**
  - FRONTEND_URL correct
  - PI_API_BASE_URL = `https://sandbox-api.minepi.com`
  - PI_SANDBOX = `true`

### Phase 3: Activation des Flags (SANDBOX)

- [ ] **Ouvrir:** `backend/.env.pirc2-sandbox`

- [ ] **Changer PIRC2_AUTH_ENABLED**
  ```bash
  # Avant:
  PIRC2_AUTH_ENABLED=false
  
  # Après:
  PIRC2_AUTH_ENABLED=true
  ```

- [ ] **Changer PIRC2_PAYMENTS_ENABLED**
  ```bash
  # Avant:
  PIRC2_PAYMENTS_ENABLED=false
  
  # Après:
  PIRC2_PAYMENTS_ENABLED=true
  ```

- [ ] **Changer PIRC2_MERCHANT_PI_ENABLED (optionnel pour DAY 4)**
  ```bash
  # Avant:
  PIRC2_MERCHANT_PI_ENABLED=false
  
  # Après (si prêt):
  PIRC2_MERCHANT_PI_ENABLED=true
  ```

### Phase 4: Redémarrage des Services

- [ ] **Sélectionner le mode:**
  ```bash
  # Linux/macOS:
  ./switch-env.sh pirc2-sandbox
  
  # Windows:
  switch-env.bat pirc2-sandbox
  ```

- [ ] **Redémarrer Docker:**
  ```bash
  docker compose down
  docker compose up --pull always
  ```

- [ ] **Attendre les logs:**
  - Vérifier: `App Mode: pirc2-sandbox`
  - Vérifier: `PIRC2 Auth Enabled: true`
  - Vérifier: `PIRC2 Payments Enabled: true`
  - ⚠️ Pas d'erreurs de credentials

### Phase 5: Tests d'Intégration

- [ ] **Tester Auth Pi**
  ```bash
  # Script: test-auth-pi.js (voir ci-dessous)
  node test-auth-pi.js
  ```

- [ ] **Tester Payment Create**
  ```bash
  node test-payments-pi.js create
  ```

- [ ] **Tester Payment Approve**
  ```bash
  node test-payments-pi.js approve <payment-id>
  ```

- [ ] **Tester Payment Complete**
  ```bash
  node test-payments-pi.js complete <payment-id>
  ```

- [ ] **Vérifier Frontend**
  - URL: `http://localhost:8080`
  - Status: `🔵 Pi-READY mode`
  - Boutons toujours présents
  - Auth demo toujours marche

- [ ] **Vérifier Merchant Flows**
  - Create merchant: OK
  - Search merchant: OK
  - Modération admin: OK

### Phase 6: Passage en PRODUCTION (Répéter pour prod)

- [ ] **Créer app PRODUCTION dans Pi Network**
  - Même processus que SANDBOX
  - Credentials différents (production)

- [ ] **Remplir .env.pirc2-production**
  ```bash
  # Identique à SANDBOX mais avec credentials production
  PI_API_KEY=<prod-key>
  PI_SDK_APP_ID=<prod-app-id>
  PIRC2_CALLBACK_URL=https://your-production-domain.com/callbacks/pi
  PIRC2_WEBHOOK_SECRET=<prod-secret>
  PIRC2_SERVER_KEY=<prod-server-key>
  ```

- [ ] **Activer flags PRODUCTION**
  ```bash
  PIRC2_AUTH_ENABLED=true
  PIRC2_PAYMENTS_ENABLED=true
  ```

- [ ] **Redémarrer avec mode production**
  ```bash
  ./switch-env.sh pirc2-production
  docker compose down
  docker compose up --pull always
  ```

- [ ] **Tester production** (avec script test-prod.js)

---

## 🔐 Vérifications de Sécurité

- [ ] **Aucun secret en logs**
  ```bash
  docker compose logs backend | grep PI_API_KEY
  # Résultat attendu: (rien - secret masqué)
  ```

- [ ] **Vérifier .env.pirc2-sandbox**
  ```bash
  # Aucune clé réelle commitée dans Git
  git status backend/.env.pirc2-*
  # Résultat: No changes tracked (fichiers ignorés ou modifiés localement)
  ```

- [ ] **Vérifier les logs masquent les secrets**
  ```bash
  docker compose logs backend | grep WEBHOOK_SECRET
  # Résultat: (rien - masked dans les logs)
  ```

---

## 📊 Prérequis Restants Avant Activation

Pour chaque mode (SANDBOX et PRODUCTION):

- [ ] Domaine accessible publiquement
- [ ] HTTPS activé sur `/callbacks/pi` endpoint
- [ ] Credentials valides de Pi Network
- [ ] Endpoint `/callbacks/pi` implémenté (DAY 4)
- [ ] Vérification HMAC webhook implémentée (DAY 4)
- [ ] Base de données sauvegardée
- [ ] Monitoring/alerting configuré
- [ ] Équipe avertie du changement
