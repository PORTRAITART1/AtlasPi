import React, { useState, useEffect } from 'react';

const BioWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        // Plus tard : appel API vers le backend
        setBalance(0);
        setTransactions([]);
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement wallet:', error);
        setLoading(false);
      }
    };
    loadWalletData();
  }, []);

  if (loading) {
    return <div className="loading">Chargement du BioWallet...</div>;
  }

  return (
    <div className="biowallet-container">
      <h2>🧬 BioWallet</h2>
      <div className="balance-section">
        <h3>Solde : {balance} BioCoins</h3>
      </div>
      <div className="transactions-section">
        <h3>Transactions récentes</h3>
        {transactions.length === 0 ? (
          <p>Aucune transaction pour le moment.</p>
        ) : (
          <ul>
            {transactions.map((tx, index) => (
              <li key={index}>{tx}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BioWallet;