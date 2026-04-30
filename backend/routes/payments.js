import express from "express";

const router = express.Router();

// Demo/payment fallback endpoints used by the existing demo flow
router.get("/status", (req, res) => {
  res.json({ ok: true, message: "Payment service ready" });
});

router.post("/process", (req, res) => {
  res.json({ ok: true, message: "Payment processed" });
});

export default router;
