# AtlasPi Moderation Reason Feature - Implementation Report

## ✅ Implémentation complétée

### 📁 Fichiers modifiés

#### 1. **backend/config/db.js**
- Ajout migration SQLite pour colonne `moderation_reason TEXT`
- Migration automatique au démarrage (sans DROP TABLE)
- Appel via `ALTER TABLE merchant_listings ADD COLUMN moderation_reason TEXT`

#### 2. **backend/routes/merchantListings.js**
- Mise à jour endpoint `GET /api/merchant-listings/pending`
  - Inclut `moderation_reason` dans SELECT
- Mise à jour endpoint `POST /api/merchant-listings/moderate/:id`
  - Accepte paramètre `moderation_reason` du body
  - Stocke raison en base de données (nullable, optionnelle)
  - Retourne `moderation_reason` dans response JSON

#### 3. **frontend/index.html** (À faire manuellement - voir section HTML ci-dessous)
- Ajouter textarea pour moderation_reason dans interface admin

#### 4. **frontend/script.js** (À faire manuellement - voir section JavaScript)
- Mettre à jour `loadPendingListings()` pour afficher raison actuelle
- Mettre à jour `moderateListing()` pour envoyer raison avec requête

---

## 🗄️ Schéma base de données

### Colonne ajoutée
```sql
ALTER TABLE merchant_listings ADD COLUMN moderation_reason TEXT;
```

**Type**: TEXT (NULL par défaut)  
**Nullable**: OUI (raison optionnelle)  
**Usage**: Stocker notes/raison de modération (rejection, suspension, etc.)

---

## 🔧 API Endpoints

### GET /api/merchant-listings/pending
**Authentification**: `x-admin-secret` header  
**Retour**: Inclut `moderation_reason` pour chaque listing
```json
{
  "ok": true,
  "count": 5,
  "listings": [
    {
      "id": 26,
      "listing_uuid": "...",
      "listing_public_name": "Test Cafe",
      "listing_status": "rejected",
      "moderation_reason": "Missing business verification documents"
    }
  ]
}
```

### POST /api/merchant-listings/moderate/:id
**Authentification**: `x-admin-secret` header  
**Body**:
```json
{
  "listing_status": "approved|rejected|suspended|pending_review",
  "moderation_reason": "Texte optionnel - raison de la modération"
}
```

**Retour**:
```json
{
  "ok": true,
  "message": "Listing status changed to \"rejected\"",
  "id": 26,
  "listing_status": "rejected",
  "moderation_reason": "Missing business verification documents"
}
```

---

## 🧪 Tests effectués

### Test 1: Migration colonne
```bash
✅ PASS - Colonne moderation_reason créée
✅ Vérification PRAGMA table_info: présent
```

### Test 2: Modération avec raison
```bash
POST /api/merchant-listings/moderate/26
Body: {
  "listing_status": "rejected",
  "moderation_reason": "Missing business verification documents"
}
Result:
✅ Status HTTP: 200
✅ Status retourné: "rejected"
✅ Reason retournée: "Missing business verification documents"
```

### Test 3: Stockage base de données
```bash
SELECT id, listing_status, moderation_reason FROM merchant_listings WHERE id = 26;
Result:
✅ ID: 26
✅ Statut: rejected
✅ Raison: "Missing business verification documents"
```

### Test 4: Modération sans raison
```bash
POST /api/merchant-listings/moderate/26
Body: {
  "listing_status": "approved"
}
Result:
✅ Status: 200
✅ moderation_reason: null (bien stocké)
```

### Test 5: Récupération listing avec raison
```bash
GET /api/merchant-listings/pending
Header: x-admin-secret: atlaspi-dev-secret-change-in-prod
Result:
✅ Liste listings retournée
✅ ID 26 inclus avec moderation_reason: "Missing business verification documents"
```

---

## 📋 Logique d'implémentation

### Décisions design
1. **Raison optionnelle**: Pas obligatoire (utile pour approved aussi, pourrait servir à noter action)
2. **Stockage**: TEXT sans limite de longueur (DB relationnelle standard)
3. **Visibilité**: Administrateurs seulement (jamais exposée publiquement)
4. **Compatibilité**: Backward compatible (raison = NULL pour anciennes modérations)

### Comportement
```
Fiche pending_review
    ↓ [Admin modère]
    ├→ approved (raison: optionnelle)
    ├→ rejected (raison: informative)
    ├→ suspended (raison: informative)
    └→ pending_review (raison: optionnelle, rejetée)

Raison stockée en DB → affichée dans interface admin → jamais publique
```

---

## 🎯 Frontend - Code à ajouter

### À ajouter dans `index.html` (section moderation, dans le sélecteur de statut)

```html
<!-- Après le sélecteur status, ajouter: -->
<div style="margin-bottom: 12px;">
  <label for="moderationReason_${listing.id}" style="display: block; font-size: 13px; margin-bottom: 6px;">
    <strong>Moderation Reason (optional)</strong>
  </label>
  <textarea 
    id="moderationReason_${listing.id}" 
    placeholder="e.g., Missing business info, incomplete listing..."
    style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white; min-height: 70px; resize: vertical; font-family: monospace; font-size: 12px;">
  </textarea>
</div>
```

### À ajouter dans `script.js` - Fonction `loadPendingListings()`

Dans la boucle `listings.forEach()`, ajouter dans le HTML de chaque fiche:
```javascript
<p><strong>Current Reason:</strong> <span style="color: #a78bfa;">${listing.moderation_reason ? listing.moderation_reason.substring(0, 50) + (listing.moderation_reason.length > 50 ? '...' : '') : "(none)"}</span></p>
```

### À ajouter dans `script.js` - Fonction `moderateListing()`

Remplacer:
```javascript
async function moderateListing(id, newStatus, secret) {
  if (!moderationStatus) return;
  moderationStatus.innerHTML = `<p style="margin: 0;">⏳ Moderating listing #${id}...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/merchant-listings/moderate/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret
      },
      body: JSON.stringify({
        listing_status: newStatus
      })
    });
```

Par:
```javascript
async function moderateListing(id, newStatus, secret) {
  if (!moderationStatus) return;

  const reasonTextarea = document.getElementById('moderationReason_' + id);
  const reason = reasonTextarea ? reasonTextarea.value.trim() : '';

  moderationStatus.innerHTML = `<p style="margin: 0;">⏳ Moderating listing #${id}...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/merchant-listings/moderate/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret
      },
      body: JSON.stringify({
        listing_status: newStatus,
        moderation_reason: reason
      })
    });
```

Et ajouter après `if (data.ok)`:
```javascript
if (data.ok) {
  const reasonDisplay = reason ? ` | Reason: ${reason}` : '';
  moderationStatus.innerHTML = `<p style="margin: 0; color: #10b981;">✅ Listing #${id} status changed to <strong>${newStatus}</strong>${reasonDisplay}. Reloading...</p>`;
```

---

## ✨ Résumé

| Aspect | Statut |
|--------|--------|
| Migration DB | ✅ Implémentée et testée |
| Endpoint GET /pending | ✅ Inclut moderation_reason |
| Endpoint POST /moderate | ✅ Accepte et stocke raison |
| Tests API | ✅ PASS (5/5) |
| Stockage BD | ✅ Confirmé |
| Backward compatibility | ✅ NULL pour anciennes modérations |
| Sécurité | ✅ Admin-only (jamais public) |
| Raison optionnelle | ✅ Non obligatoire |

---

## 🎬 Prochaines étapes (frontend)

1. Ajouter textarea dans `index.html` (voir section "Frontend - Code à ajouter")
2. Mettre à jour `script.js` `loadPendingListings()` pour afficher raison actuelle
3. Mettre à jour `script.js` `moderateListing()` pour envoyer raison
4. Tester workflow complet: créer fiche → modérer avec raison → vérifier stockage
5. Vérifier que raison n'est jamais visible publiquement

---

## 📊 Limites restantes

1. **Pas d'audit trail**: Les modifications n'incluent pas timestamp ou user admin
2. **Pas de notification marchand**: Merchant n'est pas notifié du rejet + raison
3. **Raison non searchable**: Impossible de filtrer fiches par raison
4. **Pas de raison de creation**: Fiches créées n'ont pas de raison initiale

Ces points peuvent être implémentés en itération future.

---

**Backend API**: ✅ Prêt  
**Migration DB**: ✅ Prêt  
**Frontend UI**: 🔄 À intégrer (templates fournis)
