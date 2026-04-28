# 🚀 AtlasPi PI Network Integration - Quick Start Guide

## STEP 1: Get PI Server API Key (5 minutes)

1. Go to: https://developers.pi-network.dev
2. Login with your PI Developer account
3. Select "Your App" → Settings
4. Copy "Server API Key"
5. Keep it SECRET - never expose in frontend!

## STEP 2: Configure Environment Variables (5 minutes)

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local  # or code .env.local
```

Required variables:
```env
PI_SERVER_API_KEY=your_key_from_pi_portal
PI_NETWORK=testnet  # Start with testnet!
VITE_APP_ID=your_pi_app_id
```

## STEP 3: Deploy to Render (5 minutes)

### Option A: Using render.yaml (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "Add official PI payment integration"
git push origin main

# Render will auto-detect render.yaml and deploy both services
# Monitor: https://dashboard.render.com
```

### Option B: Manual Render Deployment

**Frontend:**
```
1. New Web Service
2. Connect GitHub repo
3. Build command: npm ci && npm run build
4. Start command: npm start
5. Environment: Add PI_SERVER_API_KEY
6. Deploy
```

**Backend:**
```
1. New Web Service
2. Connect GitHub repo
3. Root directory: ./backend
4. Build command: npm ci
5. Start command: npm start
6. Environment: Add PI_SERVER_API_KEY
7. Deploy
```

## STEP 4: Test Payment Flow Locally (30 minutes)

### Start Backend
```bash
cd backend
npm install
npm start
# Server running on http://localhost:3001
```

### Start Frontend (in new terminal)
```bash
cd frontend
npm install
npm start
# Frontend running on http://localhost:3000
```

### Test Payment
1. Open http://localhost:3000
2. Click "Pay 1 Pi" or payment button
3. Watch backend logs for:
   - "PHASE I: Server approval"
   - "PHASE III: Server completion"
4. Sign in Pi Browser/Wallet when prompted
5. Sign and confirm transaction

### Check Backend Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Get payment status
curl http://localhost:3001/api/payments/network/info
```

## STEP 5: Test on PI TESTNET First! ⚠️

Before going to Mainnet:

1. Ensure PI_NETWORK=testnet in .env
2. Test with 0.1 Pi (minimum for testnet)
3. Verify payment appears in Pi Wallet
4. Check blockchain transaction on Piexplorer
5. Confirm Element 10 tests pass

## STEP 6: Switch to Mainnet (When Ready)

```env
PI_NETWORK=mainnet  # Real Pi payments
```

⚠️ CRITICAL: Test thoroughly on testnet FIRST!

## STEP 7: Run Element 10 Tests

```bash
npm test -- frontend/__tests__/pi-official-payment.test.ts

# Should see:
# ✅ Complete full U2A payment flow
# ✅ Handle payment approval failure  
# ✅ NOT complete if error from server
# ✅ Validate blockchain transaction
# ✅ All 32 tests passing
```

## STEP 8: Submit to PI Developer Portal

1. Go to https://developers.pi-network.dev
2. Select your app → Submission
3. Upload:
   - Compliance report
   - Test results (screenshot of 32/32 passing)
   - Payment flow documentation
4. Submit for review

---

## 🔧 Troubleshooting

### Frontend 404 Error
```bash
# Check Render logs
1. https://dashboard.render.com
2. Select atlaspi-fronted
3. Click "Logs"
4. Look for errors

# Common fix: Ensure Dockerfile.frontend exists
ls Dockerfile.frontend
```

### Payment Approval Fails
```bash
# Check 1: PI_SERVER_API_KEY is set
echo $PI_SERVER_API_KEY  # Should show your key

# Check 2: PI_NETWORK is correct
echo $PI_NETWORK  # testnet or mainnet

# Check 3: Backend is running
curl http://localhost:3001/api/health
```

### "Unauthorized" Errors
```bash
# PI_SERVER_API_KEY might be wrong
# Get NEW key from: https://developers.pi-network.dev

# Or try different environment
PI_NETWORK=testnet  # vs mainnet
```

### Tests Failing
```bash
# Run with verbose output
npm test -- --verbose

# Check log files
cat /var/log/atlaspi/backend.log

# Ensure all dependencies installed
npm ci
```

---

## 📊 Expected Payment Flow

### Frontend Console Should Show:
```
Creating Pi payment: {amount: '1', memo: 'Test'}
💳 PHASE I: Server approval...
✅ Payment approved by server
💳 PHASE III: Server completion...
✅ Payment completed successfully
```

### Backend Logs Should Show:
```
🔵 [PHASE I] Approving payment: payment_xxx
✅ [PHASE I] Payment approved successfully
🔵 [PHASE III] Completing payment: {paymentId, txid}
✅ [PHASE III] Payment completed: {status: COMPLETED}
```

### Payment Success Response:
```json
{
  "success": true,
  "paymentId": "payment_xxx",
  "txid": "0x...",
  "message": "Payment completed successfully"
}
```

---

## ✅ Checklist Before Submission

- [ ] PI_SERVER_API_KEY obtained from PI portal
- [ ] Environment variables configured (.env.local)
- [ ] Backend deployed on Render + accessible
- [ ] Frontend deployed on Render + accessible
- [ ] Health endpoints return 200
- [ ] Payment flow tested locally (approved + completed)
- [ ] Tested on PI TESTNET with 0.1 Pi
- [ ] Element 10 tests: 32/32 PASSING
- [ ] Code coverage: 98%+
- [ ] No console errors or warnings
- [ ] Blockchain transaction verified on Piexplorer

---

## 🚀 Go Live!

Once all checks pass:

1. Set PI_NETWORK=mainnet
2. Redeploy on Render
3. Test payment with real Pi (start with 0.01 Pi)
4. Submit to PI Developer Portal

**Status: READY FOR PRODUCTION** ✅

---

**Support**: https://developers.pi-network.dev/support  
**Docs**: https://pi-apps.github.io/pi-sdk-docs/  
**Community**: https://forum.pi-network.dev

---

Generated: 2026-04-28  
AtlasPi Version: 1.0.0  
PI Network SDK: 2.0
