// BioWallet.jsx - Composant React pour l'interface du wallet

import React, { useState, useEffect } from 'react';
import BioWalletService from '../services/BioWalletService';

const BioWallet = ({ userId }) => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  // Initialiser le wallet au chargement
  useEffect(() => {
    if (userId) {
      initializeWallet();
    }
  }, [userId]);

  const initializeWallet = async () => {
    setLoading(true);
    const result = await BioWalletService.initializeWallet(userId);
    if (result.success) {
      setWallet(result.wallet);
      setBalance(result.wallet.balance);
      setMessage('Wallet prêt !');
    } else {
      setMessage('Erreur: ' + result.error);
    }
    setLoading(false);
  };

  const handleDeposit = async () => {
    if (!amount || amount <= 0) {
      setMessage('Montant invalide');
      return;
    }

    setLoading(true);
    const result = await BioWalletService.deposit(userId, parseFloat(amount));
    if (result.success) {
      setBalance(result.wallet.balance);
      setMessage('Dépôt effectué ! ✅');
      setAmount('');
    } else {
      setMessage('Erreur: ' + result.error);
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!amount || amount <= 0) {
      setMessage('Montant invalide');
      return;
    }

    setLoading(true);
    const result = await BioWalletService.withdraw(userId, parseFloat(amount));
    if (result.success) {
      setBalance(result.wallet.balance);
      setMessage('Retrait effectué ! ✅');
      setAmount('');
    } else {
      setMessage('Erreur: ' + result.error);
    }
    setLoading(false);
  };

  const toggleTransactions = async () => {
    if (!showTransactions) {
      const result = await BioWalletService.getTransactionHistory(userId);
      if (result.success) {
        setTransactions(result.transactions);
      }
    }
    setShowTransactions(!showTransactions);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '500px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#4a90d9', marginBottom: '20px' }}>
        💰 BioWallet
      </h2>

      {loading && (
        <div style={{ color: '#888', marginBottom: '10px' }}>
          Chargement...
        </div>
      )}

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '6px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>
          Solde actuel
        </h3>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#4a90d9'
        }}>
          {balance.toFixed(2)} €
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Montant"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px'
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDeposit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            💵 Dépôt
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            💸 Retrait
          </button>
        </div>
      </div>

      <button
        onClick={toggleTransactions}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: showTransactions ? '#6c757d' : '#4a90d9',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        {showTransactions ? 'Masquer l\'historique' : 'Afficher l\'historique'}
      </button>

      {showTransactions && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#333', marginBottom: '10px' }}>
            📋 Historique des transactions
          </h4>
          {transactions.length === 0 ? (
            <p style={{ color: '#888' }}>Aucune transaction</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {transactions.map((tx, index) => (
                <li key={index} style={{
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: tx.type === 'deposit' ? '#d4edda' : '#f8d7da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {tx.type === 'deposit' ? '✅ Dépôt' : '❌ Retrait'} : {tx.amount} €
                  <br />
                  <small style={{ color: '#888' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BioWallet;