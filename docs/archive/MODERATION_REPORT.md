# AtlasPi Merchant Listings Moderation - Implementation Report

## 📝 Fichiers modifiés

### Frontend
1. **frontend/index.html**
   - Ajout de la section moderation avec ID `#merchant-moderation-section`
   - Interface simple: champ secret, checkbox pour afficher les fiches en attente, bouton charger
   - Style cohérent avec AtlasPi (dégradés, bordures)
   - Menu principal: lien vers la section moderation (en rouge)

2. **frontend/script.js**
   - Fonction `loadPendingListings()`: charge les fiches pending_review avec admin secret
   - Fonction `moderateListing()`: envoie le changement de statut au backend
   - Affichage des fiches en grille: infos + sélecteur de statut + bouton appliquer
   - Gestion des erreurs et messages de statut en temps réel

### Backend
3. **backend/routes/merchantListings.js**
   - Nouvel endpoint: `GET /api/merchant-listings/pending`
     - Authentification par header `x-admin-secret`
     - Retourne les fiches avec statut pending_review, rejected, ou suspended
   - Endpoint existant: `POST /api/merchant-listings/moderate/:id` (conservé)
     - Accepte les statuts: pending_review, approved, rejected, suspended
     - Protection par admin secret

## 🔐 Logique de sécurité

**Admin Secret:**
- Variable d'environnement: `ADMIN_SECRET`
- Défaut (dev): `atlaspi-dev-secret-change-in-prod`
- Transmission: header HTTP `x-admin-secret`
- Secret **JAMAIS exposé** ailleurs que dans cette action explicite

**Filtrage des fiches:**
- Public (search/list): uniquement statut `approved`
- Admin (pending): statut `pending_review`, `rejected`, `suspended`
- Les fiches non-approuvées sont complètement invisibles publiquement

## 📊 Statuts supportés

| Statut | Visible publiquement | Modérable | Signification |
|--------|---------------------|-----------|---------------|
| `pending_review` | ❌ Non | ✅ Oui | En attente de modération |
| `approved` | ✅ Oui | ✅ Oui | Approuvée et visible |
| `rejected` | ❌ Non | ✅ Oui | Rejetée (admin decision) |
| `suspended` | ❌ Non | ✅ Oui | Suspendue (problème) |

## 🧪 Tests effectués

### Test 1: Création fiche pending_review
```
POST /api/merchant-listings/create
Body: {listing_public_name: "Test Cafe Moderation", ...}
Résultat: ✅ PASS
- ID: 26
- Statut retourné: pending_review
```

### Test 2: Fiche introuvable en recherche public
```
GET /api/merchant-listings/search?name=Test%20Cafe%20Moderation
Résultat: ✅ PASS
- Résultats: 0 (invisible publiquement)
```

### Test 3: Accès admin sans secret
```
GET /api/merchant-listings/pending (sans header x-admin-secret)
Résultat: ✅ PASS
- Status HTTP: 403
- Message: "Unauthorized. Invalid or missing admin secret."
```

### Test 4: Chargement fiches en attente (avec secret)
```
GET /api/merchant-listings/pending
Header: x-admin-secret: atlaspi-dev-secret-change-in-prod
Résultat: ✅ PASS
- Count: 24 fiches (pending/rejected/suspended)
- ID 26 trouvée: Test Cafe Moderation
```

### Test 5: Modération → Approved
```
POST /api/merchant-listings/moderate/26
Body: {listing_status: "approved"}
Header: x-admin-secret: atlaspi-dev-secret-change-in-prod
Résultat: ✅ PASS
- Message: "Listing status changed to approved"
```

### Test 6: Fiche approuvée apparaît en recherche
```
GET /api/merchant-listings/search?name=Test%20Cafe%20Moderation
Résultat: ✅ PASS
- Résultats: 1 fiche trouvée
- Statut: approved
```

### Test 7: Modération → Rejected
```
POST /api/merchant-listings/moderate/26
Body: {listing_status: "rejected"}
Header: x-admin-secret: atlaspi-dev-secret-change-in-prod
Résultat: ✅ PASS
- Message: "Listing status changed to rejected"
```

### Test 8: Fiche rejetée disparaît de la recherche
```
GET /api/merchant-listings/search?name=Test%20Cafe%20Moderation
Résultat: ✅ PASS
- Résultats: 0 (invisible publiquement après rejection)
```

## ✅ Vérifications de compatibilité

| Fonctionnalité | Statut | Détails |
|---------------|--------|---------|
| Login démo | ✅ PASS | Inchangé, test de payment toujours OK |
| Create listing | ✅ PASS | Fiches créées en pending_review par défaut |
| Edit listing | ✅ PASS | Inchangé, peut éditer fiche en attente |
| Search listings | ✅ PASS | Filtre automatiqueument les approved |
| Detail listing | ✅ PASS | Refuse l'accès aux non-approved |
| Payments demo | ✅ PASS | Inchangé, token validation active |
| Menu navigation | ✅ PASS | Lien moderation ajouté |

## 📍 Extraits de code clés

### Endpoint GET /pending
```javascript
router.get("/pending", (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
  const headerSecret = req.headers["x-admin-secret"];

  if (!headerSecret || headerSecret !== adminSecret) {
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Invalid or missing admin secret."
    });
  }

  db.all(
    `SELECT ... FROM merchant_listings 
     WHERE listing_status IN ("pending_review", "rejected", "suspended")
     ORDER BY id DESC`,
    [],
    (err, rows) => { ... }
  );
});
```

### Frontend loadPendingListings()
```javascript
async function loadPendingListings() {
  const secret = adminSecret ? adminSecret.value.trim() : "";

  if (!secret) {
    moderationStatus.innerHTML = '❌ Please enter the admin secret key.';
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/merchant-listings/pending`, {
    method: "GET",
    headers: {
      "x-admin-secret": secret
    }
  });

  const data = await response.json();
  // Afficher les fiches avec sélecteur de statut...
}
```

## 🎯 Limitationsconnues & Améliorations futures

1. **Admin Secret en variable d'environnement**
   - À mettre en production via `.env` sécurisé
   - Actuellement: valeur par défaut (dev only)

2. **Pas d'audit trail**
   - Les changements de statut ne sont pas loggés avec username admin
   - À implémenter: table moderation_log avec qui et quand

3. **Pas de raison de modération**
   - Admin ne peut pas noter pourquoi une fiche est rejetée/suspendue
   - À implémenter: champ moderation_reason, notification marchands

4. **Interface minimale**
   - Design simple et lisible (par design)
   - Pas de filtres, pagination, export
   - Acceptable pour environnement de test/démo

5. **Pas de notification marchand**
   - Lorsqu'une fiche est rejetée, le marchand n'est pas notifié
   - À implémenter: email ou système de notification

## ✨ Résumé

✅ Modération d'interface simple et sécurisée  
✅ Secret admin jamais exposé au frontend  
✅ Fiches pending invisibles publiquement  
✅ Workflow complet: pending → approved/rejected/suspended  
✅ Compatible avec existant (create, edit, search, payment)  
✅ Tests validant tous les cas d'usage  

**Prêt pour test en environnement.**
