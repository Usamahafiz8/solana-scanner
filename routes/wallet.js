const express = require('express');
const router = express.Router();
const { getWalletData } = require('../services/wallet');

router.get('/:walletAddress', async (req, res) => {
  try {
    const data = await getWalletData(req.params.walletAddress);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
