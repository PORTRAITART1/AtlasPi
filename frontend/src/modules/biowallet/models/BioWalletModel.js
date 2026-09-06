// BioWalletModel.js - Modèle pour gérer les données du wallet utilisateur

class BioWalletModel {
    constructor() {
      this.wallets = new Map(); // Stockage local (remplacé par une base de données plus tard)
    }
  
    // Créer un nouveau wallet
    createWallet(userId, initialBalance = 0) {
      const wallet = {
        userId,
        balance: initialBalance,
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.wallets.set(userId, wallet);
      return wallet;
    }
  
    // Récupérer un wallet par userId
    getWallet(userId) {
      return this.wallets.get(userId) || null;
    }
  
    // Mettre à jour le solde
    updateBalance(userId, amount) {
      const wallet = this.wallets.get(userId);
      if (!wallet) {
        throw new Error('Wallet non trouvé');
      }
      wallet.balance += amount;
      wallet.updatedAt = new Date().toISOString();
      return wallet;
    }
  
    // Ajouter une transaction
    addTransaction(userId, transaction) {
      const wallet = this.wallets.get(userId);
      if (!wallet) {
        throw new Error('Wallet non trouvé');
      }
      wallet.transactions.push({
        ...transaction,
        timestamp: new Date().toISOString()
      });
      wallet.updatedAt = new Date().toISOString();
      return wallet;
    }
  
    // Récupérer toutes les transactions
    getTransactions(userId) {
      const wallet = this.wallets.get(userId);
      return wallet ? wallet.transactions : [];
    }
  }
  
  // Export pour utilisation dans d'autres modules
  export default new BioWalletModel();