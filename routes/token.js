const express = require('express');
const router = express.Router();
const { getTokenStats } = require('../services/dexscreener');
const { getTokenRisk } = require('../services/rugcheck');

router.get('/:tokenAddress/stats', async (req, res) => {
  try {
    const data = await getTokenStats(req.params.tokenAddress);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:tokenAddress/risk', async (req, res) => {
  try {
    const data = await getTokenRisk(req.params.tokenAddress);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
