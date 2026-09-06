import { Router } from 'express';
import BioWalletController from '../controllers/BioWalletController.js';

const router = Router();

// Route santé
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'BioWallet is running',
    version: '1.0.0'
  });
});

// Routes wallet
router.get('/balance/:userId', BioWalletController.getBalance);
router.post('/transfer', BioWalletController.transfer);
router.get('/transactions/:userId', BioWalletController.getTransactions);
router.post('/create', BioWalletController.createWallet);
router.post('/stake', BioWalletController.stakeTokens);
router.post('/unstake', BioWalletController.unstakeTokens);

export default router;