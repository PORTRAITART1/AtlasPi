// BioWalletService.js - Service pour la logique métier du wallet

import BioWalletModel from '../models/BioWalletModel';

class BioWalletService {
  constructor() {
    this.model = BioWalletModel;
  }

  // Initialiser un wallet pour un utilisateur
  async initializeWallet(userId) {
    try {
      // Vérifier si le wallet existe déjà
      const existingWallet = this.model.getWallet(userId);
      if (existingWallet) {
        return { success: true, wallet: existingWallet, message: 'Wallet déjà existant' };
      }

      // Créer un nouveau wallet avec un solde initial de 0
      const newWallet = this.model.createWallet(userId, 0);
      return { success: true, wallet: newWallet, message: 'Wallet créé avec succès' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Obtenir le solde du wallet
  async getBalance(userId) {
    try {
      const wallet = this.model.getWallet(userId);
      if (!wallet) {
        return { success: false, error: 'Wallet non trouvé' };
      }
      return { success: true, balance: wallet.balance };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Effectuer un dépôt
  async deposit(userId, amount) {
    try {
      if (amount <= 0) {
        return { success: false, error: 'Le montant doit être positif' };
      }

      const updatedWallet = this.model.updateBalance(userId, amount);
      this.model.addTransaction(userId, {
        type: 'deposit',
        amount,
        description: `Dépôt de ${amount}`
      });

      return { success: true, wallet: updatedWallet, message: 'Dépôt effectué avec succès' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Effectuer un retrait
  async withdraw(userId, amount) {
    try {
      if (amount <= 0) {
        return { success: false, error: 'Le montant doit être positif' };
      }

      const wallet = this.model.getWallet(userId);
      if (!wallet) {
        return { success: false, error: 'Wallet non trouvé' };
      }

      if (wallet.balance < amount) {
        return { success: false, error: 'Solde insuffisant' };
      }

      const updatedWallet = this.model.updateBalance(userId, -amount);
      this.model.addTransaction(userId, {
        type: 'withdraw',
        amount,
        description: `Retrait de ${amount}`
      });

      return { success: true, wallet: updatedWallet, message: 'Retrait effectué avec succès' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Obtenir l'historique des transactions
  async getTransactionHistory(userId) {
    try {
      const transactions = this.model.getTransactions(userId);
      return { success: true, transactions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new BioWalletService();