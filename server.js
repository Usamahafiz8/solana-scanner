require('dotenv').config();
const express = require('express');
const tokenRoutes = require('./routes/token');
const walletRoutes = require('./routes/wallet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.use('/api/token', tokenRoutes);
app.use('/api/wallet', walletRoutes);

app.listen(PORT, () => {
  console.log(`Solana Token Scanner running at http://localhost:${PORT}`);
});
