// BioWalletController.js - Contrôleur pour gérer les requêtes API du wallet

import BioWalletService from '../services/BioWalletService';

class BioWalletController {
  constructor() {
    this.service = BioWalletService;
  }

  // Initialiser un wallet (appelé à la connexion utilisateur)
  async initializeWallet(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId requis'
        });
      }

      const result = await this.service.initializeWallet(userId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  // Obtenir le solde
  async getBalance(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId requis'
        });
      }

      const result = await this.service.getBalance(userId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  // Effectuer un dépôt
  async deposit(req, res) {
    try {
      const { userId, amount } = req.body;
      
      if (!userId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'userId et amount requis'
        });
      }

      const result = await this.service.deposit(userId, amount);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  // Effectuer un retrait
  async withdraw(req, res) {
    try {
      const { userId, amount } = req.body;
      
      if (!userId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'userId et amount requis'
        });
      }

      const result = await this.service.withdraw(userId, amount);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  // Obtenir l'historique des transactions
  async getTransactionHistory(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId requis'
        });
      }

      const result = await this.service.getTransactionHistory(userId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
}

export default new BioWalletController();