const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const path = require('path');

// ✅ Créer automatiquement le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Dossier data créé : ${dataDir}`);
}

class BioWalletModel {
  constructor() {
    this.dbPath = path.join(__dirname, '..', '..', 'data', 'atlaspi.db');
    this.db = null;
    this.init();
  }

  init() {
    this.db = new Database(this.dbPath);
    this.createTables();
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        address TEXT UNIQUE NOT NULL,
        balance REAL DEFAULT 0,
        staked_balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('send', 'receive', 'stake', 'unstake', 'reward')),
        amount REAL NOT NULL,
        from_address TEXT,
        to_address TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
        tx_hash TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id)
      );
    `);
  }

  createWallet(userId) {
    const address = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    const stmt = this.db.prepare('INSERT INTO wallets (user_id, address) VALUES (?, ?)');
    const result = stmt.run(userId, address);
    return { id: result.lastInsertRowid, userId, address, balance: 0, staked_balance: 0 };
  }

  getWalletByUserId(userId) {
    return this.db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
  }

  getBalance(userId) {
    const wallet = this.getWalletByUserId(userId);
    return wallet ? { balance: wallet.balance, staked_balance: wallet.staked_balance } : null;
  }

  updateBalance(walletId, amount) {
    const stmt = this.db.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(amount, walletId);
  }

  stakeTokens(userId, amount) {
    const wallet = this.getWalletByUserId(userId);
    if (!wallet) return null;
    if (wallet.balance < amount) return { error: 'Insufficient balance' };
    
    const updateStmt = this.db.prepare('UPDATE wallets SET balance = balance - ?, staked_balance = staked_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(amount, amount, wallet.id);
    
    this.createTransaction(wallet.id, 'stake', amount, null, null);
    return { success: true, staked: amount };
  }

  unstakeTokens(userId, amount) {
    const wallet = this.getWalletByUserId(userId);
    if (!wallet) return null;
    if (wallet.staked_balance < amount) return { error: 'Insufficient staked balance' };
    
    const updateStmt = this.db.prepare('UPDATE wallets SET balance = balance + ?, staked_balance = staked_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(amount, amount, wallet.id);
    
    this.createTransaction(wallet.id, 'unstake', amount, null, null);
    return { success: true, unstaked: amount };
  }

  createTransaction(walletId, type, amount, fromAddress, toAddress) {
    const txHash = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const stmt = this.db.prepare(
      'INSERT INTO transactions (wallet_id, type, amount, from_address, to_address, tx_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(walletId, type, amount, fromAddress, toAddress, txHash, 'completed');
    return { id: result.lastInsertRowid, txHash, type, amount, status: 'completed' };
  }

  getTransactions(userId) {
    const wallet = this.getWalletByUserId(userId);
    if (!wallet) return [];
    return this.db.prepare('SELECT * FROM transactions WHERE wallet_id = ? ORDER BY created_at DESC').all(wallet.id);
  }

  close() {
    if (this.db) this.db.close();
  }
}

module.exports = new BioWalletModel();