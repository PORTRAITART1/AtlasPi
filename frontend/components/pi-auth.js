// frontend/pi-auth.js
// Pi Network Authentication - Real Implementation

(function() {
  'use strict';

  const BACKEND_URL = window.BACKEND_URL || 'https://atlaspi-backend.onrender.com';

  function log(...args) { console.log('[PiAuth]', ...args); }
  function logError(...args) { console.error('[PiAuth]', ...args); }

  const state = {
    initialized: false,
    authenticating: false,
    authenticated: false,
    user: null,
    accessToken: null,
    error: null
  };

  function setStatus(message, type = 'info') {
    const el = document.getElementById('pi-auth-status');
    if (el) {
      el.textContent = message;
      el.className = `pi-auth-status pi-auth-status--${type}`;
    }
    log(`[${type}] ${message}`);
  }

  function setUserDisplay(user) {
    const userEl     = document.getElementById('pi-user-display');
    const usernameEl = document.getElementById('pi-username');
    const signInBtn  = document.getElementById('pi-signin-btn');
    const signOutBtn = document.getElementById('pi-signout-btn');
    if (user) {
      if (userEl)     userEl.style.display     = 'block';
      if (usernameEl) usernameEl.textContent   = `@${user.username}`;
      if (signInBtn)  signInBtn.style.display  = 'none';
      if (signOutBtn) signOutBtn.style.display = 'inline-block';
    } else {
      if (userEl)     userEl.style.display     = 'none';
      if (signInBtn)  signInBtn.style.display  = 'inline-block';
      if (signOutBtn) signOutBtn.style.display = 'none';
    }
  }

  async function initializePiSDK() {
    if (state.initialized) return true;
    if (typeof Pi === 'undefined') {
      logError('Pi SDK not found - must run inside Pi Browser');
      setStatus('⚠️ Ouvrez cette app dans Pi Browser', 'error');
      return false;
    }
    try {
      setStatus('🔄 Initialisation du SDK Pi...', 'loading');
      let sandboxMode = false;
      try {
        const r = await fetch(`${BACKEND_URL}/api/payments/network/info`);
        if (r.ok) {
          const c = await r.json();
          sandboxMode = c.sandbox === true;
          log('Backend config:', c);
        }
      } catch(e) { log('Config fetch failed, sandbox=false'); }

      // ✅ await Pi.init fully before anything else
      await Pi.init({ version: '2.0', sandbox: sandboxMode });
      state.initialized = true;
      log('✅ Pi SDK initialized, sandbox=' + sandboxMode);
      setStatus('✅ SDK Pi initialisé', 'success');
      return true;
    } catch(err) {
      logError('Pi.init failed:', err);
      setStatus('❌ Échec init SDK Pi', 'error');
      return false;
    }
  }

  function onIncompletePaymentFound(payment) {
    log('⚠️ Incomplete payment found:', payment);
    fetch(`${BACKEND_URL}/api/pi-payments/complete-pi-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        paymentId: payment.identifier,
        txid: payment.transaction?.txid || null
      })
    })
    .then(r => r.json())
    .then(d => log('Incomplete payment handled:', d))
    .catch(e => logError('Incomplete payment error:', e));
  }

  async function validateTokenOnBackend(accessToken) {
    try {
      log('Sending token to backend...');
      const res = await fetch(`${BACKEND_URL}/api/auth/pi/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken })
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
      return { ok: true, user: data.user };
    } catch(err) {
      logError('Backend validation failed:', err);
      return { ok: false, error: err.message };
    }
  }

  async function authenticateWithPi() {
    if (state.authenticating) return null;
    if (!state.initialized) {
      const ok = await initializePiSDK();
      if (!ok) return null;
    }
    state.authenticating = true;
    setStatus('�� Authentification Pi...', 'loading');
    try {
      // ✅ scope "username" uniquement
      const authResult = await Pi.authenticate(['username'], onIncompletePaymentFound);
      log('Pi.authenticate result:', authResult);
      if (!authResult?.accessToken) throw new Error('Pas de accessToken reçu');

      state.accessToken = authResult.accessToken;
      const validation = await validateTokenOnBackend(authResult.accessToken);
      if (!validation.ok) throw new Error(validation.error);

      state.authenticated = true;
      state.user = validation.user;
      state.error = null;

      localStorage.setItem('pi_user', JSON.stringify(state.user));
      localStorage.removeItem('pi_access_token');

      setUserDisplay(state.user);
      setStatus(`✅ Connecté : @${state.user.username}`, 'success');

      window.dispatchEvent(new CustomEvent('piAuthSuccess', {
        detail: { user: state.user, accessToken: state.accessToken }
      }));
      log('✅ Auth complete:', state.user);
      return state.user;

    } catch(err) {
      logError('Auth failed:', err);
      state.error = err.message;
      state.authenticated = false;
      setStatus(`❌ Échec : ${err.message}`, 'error');
      window.dispatchEvent(new CustomEvent('piAuthError', { detail: { error: err.message } }));
      return null;
    } finally {
      state.authenticating = false;
    }
  }

  async function signOut() {
    try {
      await fetch(`${BACKEND_URL}/api/auth/pi/signout`, {
        method: 'POST', credentials: 'include'
      });
    } catch(e) { log('Signout non-critical error:', e); }
    state.authenticated = false;
    state.user = null;
    state.accessToken = null;
    localStorage.removeItem('pi_user');
    localStorage.removeItem('pi_access_token');
    setUserDisplay(null);
    setStatus('👋 Déconnecté', 'info');
    window.dispatchEvent(new CustomEvent('piAuthSignout'));
  }

  async function checkExistingSession() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/pi/session`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          state.authenticated = true;
          state.user = data.user;
          state.accessToken = null;
          localStorage.setItem('pi_user', JSON.stringify(state.user));
          localStorage.removeItem('pi_access_token');
          setUserDisplay(state.user);
          setStatus(`✅ Session active : @${state.user.username}`, 'success');
          log('Session restaurée:', state.user);
          return true;
        }
      }
    } catch(e) { log('Session check failed:', e); }
    return false;
  }

  async function autoInit() {
    log('🚀 Auto-init Pi Auth...');
    const hasSession = await checkExistingSession();
    if (hasSession) return;
    const sdkReady = await initializePiSDK();
    if (!sdkReady) return;
    await authenticateWithPi();
  }

  function bindButtons() {
    const signInBtn  = document.getElementById('pi-signin-btn');
    const signOutBtn = document.getElementById('pi-signout-btn');
    if (signInBtn)  signInBtn.addEventListener('click',  () => authenticateWithPi());
    if (signOutBtn) signOutBtn.addEventListener('click', () => signOut());
  }

  // ✅ Public API
  window.PiAuth = {
    init:            initializePiSDK,
    authenticate:    authenticateWithPi,
    signOut:         signOut,
    getUser:         () => state.user,
    getToken:        () => state.accessToken,
    isAuthenticated: () => state.authenticated,
    getState:        () => ({ ...state })
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bindButtons(); autoInit(); });
  } else {
    bindButtons();
    autoInit();
  }

})();
