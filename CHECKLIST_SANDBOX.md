# Checklist de test Sandbox — AtlasPi

## Prérequis
- [ ] Pi Browser installé sur mobile
- [ ] Compte Pi avec KYC validé
- [ ] Pi API Key Sandbox obtenue sur develop.pinet.com
- [ ] Node.js installé localement

## Étape 1 — Configuration Developer Portal
- [ ] Ouvrir Pi Browser → Pi Utilities → Develop → AtlasPi
- [ ] Vérifier que le réseau est "Pi Testnet"
- [ ] Configurer Development URL : http://localhost:3000
- [ ] Récupérer l'URL Sandbox fournie par le portail

## Étape 2 — Démarrage local
- [ ] Renseigner backend/.env.sandbox (PI_API_KEY, DATABASE_URL, JWT_SECRET, SESSION_SECRET, ADMIN_SECRET)
- [ ] Lancer backend/start-sandbox.bat (port 3000)
- [ ] Lancer frontend/start-sandbox.bat (port 3000)
- [ ] Vérifier http://localhost:3000 → page AtlasPi visible

## Étape 3 — Test du flux de paiement
- [ ] Ouvrir l'URL Sandbox dans Pi Browser
- [ ] Autoriser le Sandbox (Pi Utilities → Authorize Sandbox)
- [ ] Se connecter avec Pi.authenticate()
- [ ] Cliquer sur "Create Payment"
- [ ] Vérifier que l'approbation passe (200 OK)
- [ ] Vérifier que la finalisation passe (200 OK)
- [ ] Vérifier que le paiement est marqué "completed"

## Étape 4 — Vérifications backend
- [ ] Logs : "Approved ✅" présent
- [ ] Logs : "Completion verification" présente le txid vérifié
- [ ] Logs : aucune erreur 400 ou 500
- [ ] Base de données : statut du paiement = completed

## Étape 5 — Validation finale
- [ ] Un paiement test complet a réussi
- [ ] Aucune erreur dans les logs
- [ ] Le flux approve → complete est fonctionnel
