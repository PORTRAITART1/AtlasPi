cat > backend/routes/auth-pi.js << 'EOF'
const express = require("express");
const axios = require("axios");
const logger = require("../utils/logger.js");

const router = express.Router();

/**
 * POST /api/auth/pi
 * Authentifie un utilisateur via Pi Network
 * Body: { accessToken, userId }
 */
router.post("/", async (req, res) => {
    try {
        const { accessToken, userId } = req.body;

        if (!accessToken || !userId) {
            return res.status(400).json({
                ok: false,
                error: "accessToken and userId are required"
            });
        }

        // Vérifier le token via l'API Pi Network
        const piApiUrl = process.env.PI_API_BASE || "https://api.minepi.com";
        const response = await axios.get(`${piApiUrl}/v2/users/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.data || !response.data.user) {
            return res.status(401).json({
                ok: false,
                error: "Invalid Pi Network token"
            });
        }

        // Vérifier que l'userId correspond
        const piUser = response.data.user;
        if (piUser.uid !== userId) {
            return res.status(401).json({
                ok: false,
                error: "User ID mismatch"
            });
        }

        logger.info(`✅ Pi authentication successful for user: ${userId}`);

        res.json({
            ok: true,
            user: {
                id: piUser.uid,
                username: piUser.username,
                displayName: piUser.display_name,
                email: piUser.email
            },
            message: "Authentication successful"
        });

    } catch (error) {
        if (error.response) {
            // Erreur de l'API Pi Network
            logger.error("Pi Network API error:", error.response.status, error.response.data);
            return res.status(401).json({
                ok: false,
                error: "Pi Network authentication failed",
                details: error.response.data?.message || "Invalid token"
            });
        }

        logger.error("Error in Pi authentication route:", error);
        res.status(500).json({
            ok: false,
            error: "Internal server error"
        });
    }
});

/**
 * GET /api/auth/pi/verify
 * Vérifie si un token Pi est valide
 * Query: { accessToken }
 */
router.get("/verify", async (req, res) => {
    try {
        const { accessToken } = req.query;

        if (!accessToken) {
            return res.status(400).json({
                ok: false,
                error: "accessToken is required"
            });
        }

        const piApiUrl = process.env.PI_API_BASE || "https://api.minepi.com";
        const response = await axios.get(`${piApiUrl}/v2/users/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.data || !response.data.user) {
            return res.status(401).json({
                ok: false,
                error: "Invalid Pi Network token"
            });
        }

        res.json({
            ok: true,
            valid: true,
            user: {
                id: response.data.user.uid,
                username: response.data.user.username
            }
        });

    } catch (error) {
        res.status(401).json({
            ok: false,
            valid: false,
            error: "Invalid Pi Network token"
        });
    }
});

module.exports = router;
EOF