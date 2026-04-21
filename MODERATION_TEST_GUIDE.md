# Guide de test de la modération AtlasPi

## 🚀 Démarrage rapide

1. **Démarrer le backend**
   ```bash
   cd backend
   npm start
   ```

2. **Ouvrir le frontend**
   ```
   http://localhost:3000/index.html
   ```

3. **Aller à la section moderation**
   - Scroller jusqu'à "Moderate Merchant Listings" (section rouge)
   - Ou cliquer sur "⚠️ Moderation" dans le menu

## 📋 Étapes de test complètes

### Étape 1: Créer une fiche en attente
1. Scroller vers "Add a Merchant Listing" section
2. Remplir le formulaire:
   - **Public Listing Name**: "Test Moderation Fiche 001"
   - **Business Name**: "Test Business"
   - **Description**: "Une fiche pour tester la modération"
   - **Domain**: "test"
   - **Category**: "testing"
   - **Products/Services**: "Test services"
   - **Country**: "FR"
   - **City**: "Paris"
   - **Phone**: "+33600000000"
   - Cocher les 3 accords requis
3. Cliquer "Create Merchant Listing"
4. ✅ Vérifier le message de création avec UUID

### Étape 2: Vérifier invisible en recherche
1. Scroller vers "Saved Merchant Listings"
2. Chercher par nom: "Test Moderation Fiche"
3. Cliquer "Load Merchant Listings"
4. ✅ Vérifier: "No merchant listings match your search."

### Étape 3: Accéder à la modération
1. Scroller vers "Moderate Merchant Listings" section
2. Dans le champ "Admin Secret Key", entrer:
   ```
   atlaspi-dev-secret-change-in-prod
   ```
3. Cocher "Show Pending Listings for Review"
4. Cliquer "Load Pending Listings"
5. ✅ Vérifier: Voir plusieurs fiches pending_review

### Étape 4: Modérer la fiche
1. Trouver la fiche créée à l'étape 1 ("Test Moderation Fiche 001")
2. Dans le sélecteur de statut (à droite), garder: "✅ Approved"
3. Cliquer "✓ Apply Moderation"
4. ✅ Vérifier message: "Listing #X status changed to approved"
5. ✅ Vérifier: La fiche disparaît de la liste (elle est approved maintenant)

### Étape 5: Vérifier visibilité après modération
1. Scroller vers "Saved Merchant Listings"
2. Chercher par nom: "Test Moderation Fiche"
3. Cliquer "Load Merchant Listings"
4. ✅ Vérifier: La fiche apparaît maintenant dans les résultats

### Étape 6: Tester le rejet
1. Créer une deuxième fiche (même process étape 1) avec un nom différent
2. Allez à moderation, charger les fiches pending
3. Sélectionner "❌ Rejected" pour cette fiche
4. Cliquer "✓ Apply Moderation"
5. ✅ Vérifier: Message de changement de statut
6. Chercher la fiche en recherche → ✅ introuvable

### Étape 7: Tester la sécurité (sans secret)
1. Scroller vers "Moderate Merchant Listings"
2. Laisser le champ "Admin Secret Key" **vide**
3. Cliquer "Load Pending Listings"
4. ✅ Vérifier: Message d'erreur "Please enter the admin secret key."

### Étape 8: Tester secret invalide
1. Dans le champ secret, entrer: `wrong-secret-123`
2. Cliquer "Load Pending Listings"
3. ✅ Vérifier: Message d'erreur "❌ Error: Unauthorized. Invalid or missing admin secret."

## 🎯 Cas de test API (curl ou Postman)

### Charger les fiches pending (avec secret valide)
```bash
curl -X GET http://localhost:3000/api/merchant-listings/pending \
  -H "x-admin-secret: atlaspi-dev-secret-change-in-prod"
```
✅ Status: 200, retour des fiches pending

### Charger les fiches pending (sans secret)
```bash
curl -X GET http://localhost:3000/api/merchant-listings/pending
```
✅ Status: 403, erreur "Unauthorized"

### Modérer une fiche (ID 26 par exemple)
```bash
curl -X POST http://localhost:3000/api/merchant-listings/moderate/26 \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: atlaspi-dev-secret-change-in-prod" \
  -d '{"listing_status": "approved"}'
```
✅ Status: 200, statut changé à approved

### Modérer avec statut invalide
```bash
curl -X POST http://localhost:3000/api/merchant-listings/moderate/26 \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: atlaspi-dev-secret-change-in-prod" \
  -d '{"listing_status": "invalid_status"}'
```
✅ Status: 400, erreur sur statut invalide

## 📊 Tableau de vérification

| Test | Résultat | Notes |
|------|----------|-------|
| Créer fiche → pending | ✅ / ❌ | Doit avoir statut pending_review |
| Fiche pending invisible | ✅ / ❌ | Search ne retourne rien |
| Charger pending sans secret | ✅ / ❌ | Doit avoir erreur 403 |
| Charger pending avec secret | ✅ / ❌ | Doit lister les fiches |
| Modérer → Approved | ✅ / ❌ | Fiche devient visible |
| Modérer → Rejected | ✅ / ❌ | Fiche reste invisible |
| Fiche approuvée visible | ✅ / ❌ | Search la retrouve |
| Fiche rejetée invisible | ✅ / ❌ | Search ne la retrouve pas |
| Secret invalide → rejet | ✅ / ❌ | Doit avoir erreur 403 |

## ⚙️ Configuration environnement

**Production:**
Ajouter à `.env`:
```
ADMIN_SECRET=votre-secret-très-sécurisé-changez-moi
```

**Development:**
- Valeur défaut: `atlaspi-dev-secret-change-in-prod`
- Suffit pour tester localement

## 📞 Troubleshooting

### Backend ne démarre pas
```bash
cd backend && npm install
npm start
```

### 503 Service Unavailable
→ Backend n'est pas accessible. Vérifier qu'il tourne sur port 3000.

### "No pending listings to review"
→ Créez d'abord une fiche via le formulaire "Add a Merchant Listing" pour avoir quelque chose à modérer.

### Secret invalide accepté
→ Vérifier que `ADMIN_SECRET` est correctement défini ou utiliser la valeur par défaut: `atlaspi-dev-secret-change-in-prod`

### Fiche toujours invisible après "Approved"
→ Recharger la page. La fiche doit réapparaître en rechargant via "Load Merchant Listings"
