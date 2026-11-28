const BioWalletService = require('../services/BioWalletService');

class BioWalletController {
  createWallet(req, res) {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const result = BioWalletService.createWallet(userId);
    if (result.success) {
      return res.status(201).json(result);
    }
    return res.status(400).json(result);
  }

  getBalance(req, res) {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const result = BioWalletService.getBalance(userId);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(404).json(result);
  }

  transfer(req, res) {
    const { fromUserId, toAddress, amount } = req.body;
    if (!fromUserId || !toAddress || !amount) {
      return res.status(400).json({ success: false, error: 'fromUserId, toAddress, and amount are required' });
    }
    const result = BioWalletService.transfer(fromUserId, toAddress, amount);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  }

  getTransactions(req, res) {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const result = BioWalletService.getTransactions(userId);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(404).json(result);
  }

  stakeTokens(req, res) {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ success: false, error: 'userId and amount are required' });
    }
    const result = BioWalletService.stakeTokens(userId, amount);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  }

  unstakeTokens(req, res) {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ success: false, error: 'userId and amount are required' });
    }
    const result = BioWalletService.unstakeTokens(userId, amount);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  }
}

module.exports = new BioWalletController();