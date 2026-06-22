# Solana Token Scanner API

Demo/prototype API to scan Solana tokens and wallets.

## Setup

```bash
npm install
```

Edit `.env` and add your API keys:

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `HELIUS_API_KEY` | https://dev.helius.xyz (free) | For wallet token names/symbols |
| `SOLANA_TRACKER_API_KEY` | https://solanatracker.io (free) | For extra risk data |

## Run

```bash
npm start        # production
npm run dev      # auto-reload with nodemon
```

Server starts at `http://localhost:3000`

---

## Endpoints

### 1. Token Stats
```
GET /api/token/:tokenAddress/stats
```
Fetches live data from DexScreener — price, market cap, volume, liquidity, pair age, buys/sells, etc.

**Example:**
```
GET /api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/stats
```

---

### 2. Token Risk Score
```
GET /api/token/:tokenAddress/risk
```
Aggregates risk data from RugCheck and (optionally) Solana Tracker.
Returns mint authority, freeze authority, liquidity lock %, top holder concentration, risk warnings.

**Example:**
```
GET /api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/risk
```

---

### 3. Wallet Scanner
```
GET /api/wallet/:walletAddress
```
Returns SOL balance, all token holdings, and recent transactions.
Uses Helius if `HELIUS_API_KEY` is set (gives token names/symbols/logos), otherwise falls back to public Solana RPC.

**Example:**
```
GET /api/wallet/3h1zGmCwsRJnVk5BuRNMLsPaQu1y2aqXqXDWYCgrp5UG
```

---

## Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Message here"
}
```

## Test Token (BONK)
```
DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```
