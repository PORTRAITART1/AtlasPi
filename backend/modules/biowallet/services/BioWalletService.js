const BioWalletModel = require('../models/BioWalletModel');

class BioWalletService {
  createWallet(userId) {
    try {
      const existingWallet = BioWalletModel.getWalletByUserId(userId);
      if (existingWallet) {
        return { success: false, error: 'Wallet already exists', wallet: existingWallet };
      }
      const wallet = BioWalletModel.createWallet(userId);
      return { success: true, wallet };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getBalance(userId) {
    try {
      const balance = BioWalletModel.getBalance(userId);
      if (!balance) {
        return { success: false, error: 'Wallet not found' };
      }
      return { success: true, balance };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  transfer(fromUserId, toAddress, amount) {
    try {
      const fromWallet = BioWalletModel.getWalletByUserId(fromUserId);
      if (!fromWallet) {
        return { success: false, error: 'Sender wallet not found' };
      }
      if (fromWallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Débit
      BioWalletModel.updateBalance(fromWallet.id, -amount);
      BioWalletModel.createTransaction(fromWallet.id, 'send', amount, fromWallet.address, toAddress);

      // Crédit (simplifié - dans une vraie implémentation, on chercherait le wallet destinataire)
      BioWalletModel.createTransaction(fromWallet.id, 'receive', amount, fromWallet.address, toAddress);

      return {
        success: true,
        transaction: {
          from: fromWallet.address,
          to: toAddress,
          amount,
          status: 'completed'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTransactions(userId) {
    try {
      const transactions = BioWalletModel.getTransactions(userId);
      return { success: true, transactions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  stakeTokens(userId, amount) {
    try {
      const result = BioWalletModel.stakeTokens(userId, amount);
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true, staked: result.staked };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  unstakeTokens(userId, amount) {
    try {
      const result = BioWalletModel.unstakeTokens(userId, amount);
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true, unstaked: result.unstaked };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BioWalletService();