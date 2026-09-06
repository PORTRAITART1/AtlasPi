const express = require('express');
const router = express.Router();
const BioWalletController = require('../controllers/BioWalletController');

// Créer un wallet
router.post('/wallet/create', (req, res) => BioWalletController.createWallet(req, res));

// Obtenir le solde
router.get('/wallet/balance/:userId', (req, res) => BioWalletController.getBalance(req, res));

// Transférer des tokens
router.post('/wallet/transfer', (req, res) => BioWalletController.transfer(req, res));

// Obtenir les transactions
router.get('/wallet/transactions/:userId', (req, res) => BioWalletController.getTransactions(req, res));

// Staker des tokens
router.post('/wallet/stake', (req, res) => BioWalletController.stakeTokens(req, res));

// Unstaker des tokens
router.post('/wallet/unstake', (req, res) => BioWalletController.unstakeTokens(req, res));

module.exports = router;