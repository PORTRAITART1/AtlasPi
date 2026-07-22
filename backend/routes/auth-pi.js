// backend/routes/auth-pi.js
// Pi Network Authentication Routes

import express from 'express';
import axios from 'axios';

const router = express.Router();

const PI_API_BASE_URL = process.env.PI_API_BASE_URL || 'https://api.minepi.com';
const PI_API_KEY      = process.env.PI_API_KEY;

function log(...args)      { console.log('[auth-pi]',   ...args); }
function logError(...args) { console.error('[auth-pi]', ...args); }

// ─── POST /api/auth/pi/validate ───────────────────────────────────────────────
router.post('/validate', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken manquant' });
  }

  if (!PI_API_KEY) {
    logError('PI_API_KEY manquant dans les variables d\'environnement');
    return res.status(500).json({ error: 'Configuration serveur incomplète' });
  }

  try {
    log('Validation du token via Pi API...');

    const response = await axios.get(`${PI_API_BASE_URL}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Pi-App-Api-Key': PI_API_KEY
      },
      timeout: 10000
    });

    const piUser = response.data;
    log('Pi user validé:', piUser.username);

    if (req.session) {
      req.session.piUser        = piUser;
      req.session.piAccessToken = accessToken;
      req.session.authenticated = true;
    }

    return res.json({
      ok:   true,
      user: {
        uid:      piUser.uid,
        username: piUser.username
      }
    });

  } catch (err) {
    const status = err.response?.status;
    const msg    = err.response?.data?.error || err.message;
    logError(`Validation échouée [${status}]:`, msg);

    if (status === 401) {
      return res.status(401).json({ error: 'Token Pi invalide ou expiré' });
    }
    return res.status(500).json({ error: `Erreur validation Pi: ${msg}` });
  }
});

// ─── GET /api/auth/pi/session ─────────────────────────────────────────────────
router.get('/session', (req, res) => {
  if (req.session?.authenticated && req.session?.piUser) {
    return res.json({
      authenticated: true,
      user: {
        uid:      req.session.piUser.uid,
        username: req.session.piUser.username
      }
    });
  }
  return res.json({ authenticated: false, user: null });
});

// ─── POST /api/auth/pi/signout ────────────────────────────────────────────────
router.post('/signout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) logError('Erreur destruction session:', err);
    });
  }
  res.clearCookie('connect.sid', {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });
  return res.json({ ok: true, message: 'Déconnecté' });
});

export default router;
