const axios = require('axios');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

async function rpc(method, params = []) {
  const res = await axios.post(
    RPC_URL,
    { jsonrpc: '2.0', id: 1, method, params },
    { timeout: 15000 }
  );
  if (res.data.error) throw new Error(res.data.error.message);
  return res.data.result;
}

async function getWalletData(walletAddress) {
  const hasHelius =
    HELIUS_KEY && HELIUS_KEY !== 'your_helius_api_key_here';

  return hasHelius
    ? getWithHelius(walletAddress)
    : getWithPublicRPC(walletAddress);
}

// ---- Helius path (enriched data: token names, symbols, logos) ----
async function getWithHelius(walletAddress) {
  const result = {
    walletAddress,
    dataSource: 'Helius',
    solBalance: null,
    solBalanceUSD: null,
    tokenCount: 0,
    tokenBalances: [],
    recentTransactions: [],
    transactionCount: null,
    errors: [],
  };

  // Balances
  try {
    const res = await axios.get(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_KEY}`,
      { timeout: 12000 }
    );
    const d = res.data;
    result.solBalance = (d.nativeBalance || 0) / 1e9;
    result.tokenBalances = (d.tokens || [])
      .filter(t => t.amount > 0)
      .map(t => ({
        mint: t.mint,
        symbol: t.symbol || null,
        name: t.name || null,
        balance: t.amount / Math.pow(10, t.decimals || 0),
        rawAmount: t.amount,
        decimals: t.decimals,
        logoURI: t.logoURI || null,
        pricePerToken: t.price || null,
        valueUSD: t.value || null,
      }));
    result.tokenCount = result.tokenBalances.length;
  } catch (err) {
    result.errors.push(`Helius balances: ${err.message}`);
    // Fallback to RPC for SOL balance
    try {
      const balanceResult = await rpc('getBalance', [walletAddress]);
      const lamports = balanceResult?.value ?? balanceResult;
      result.solBalance = lamports / 1e9;
    } catch (e) {
      result.errors.push(`RPC balance fallback: ${e.message}`);
    }
  }

  // Transactions
  try {
    const res = await axios.get(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_KEY}&limit=20`,
      { timeout: 12000 }
    );
    result.recentTransactions = (res.data || []).map(tx => ({
      signature: tx.signature,
      timestamp: tx.timestamp,
      blockTime: tx.timestamp,
      type: tx.type || null,
      source: tx.source || null,
      fee: tx.fee,
      status: tx.transactionError ? 'failed' : 'success',
      description: tx.description || null,
      tokenTransfers: (tx.tokenTransfers || []).map(t => ({
        mint: t.mint,
        fromUserAccount: t.fromUserAccount,
        toUserAccount: t.toUserAccount,
        tokenAmount: t.tokenAmount,
      })),
      nativeTransfers: (tx.nativeTransfers || []).map(t => ({
        fromUserAccount: t.fromUserAccount,
        toUserAccount: t.toUserAccount,
        amount: t.amount / 1e9,
      })),
    }));
    result.transactionCount = result.recentTransactions.length;
  } catch (err) {
    result.errors.push(`Helius transactions: ${err.message}`);
  }

  return result;
}

// ---- Public RPC path (no API key needed, returns mint addresses only) ----
async function getWithPublicRPC(walletAddress) {
  const result = {
    walletAddress,
    dataSource: 'Solana Public RPC (add HELIUS_API_KEY for token names/symbols)',
    solBalance: null,
    tokenCount: 0,
    tokenBalances: [],
    recentTransactions: [],
    transactionCount: null,
    errors: [],
  };

  // SOL balance
  try {
    const balanceResult = await rpc('getBalance', [walletAddress]);
    const lamports = balanceResult?.value ?? balanceResult;
    result.solBalance = lamports / 1e9;
  } catch (err) {
    result.errors.push(`SOL balance: ${err.message}`);
  }

  // SPL token accounts
  try {
    const tokenAccounts = await rpc('getTokenAccountsByOwner', [
      walletAddress,
      { programId: SPL_TOKEN_PROGRAM },
      { encoding: 'jsonParsed' },
    ]);

    if (tokenAccounts?.value) {
      result.tokenBalances = tokenAccounts.value
        .filter(acc => {
          const info = acc.account.data.parsed.info;
          return parseFloat(info.tokenAmount.uiAmountString) > 0;
        })
        .map(acc => {
          const info = acc.account.data.parsed.info;
          return {
            mint: info.mint,
            balance: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
            rawAmount: info.tokenAmount.amount,
          };
        });
      result.tokenCount = result.tokenBalances.length;
    }
  } catch (err) {
    result.errors.push(`Token accounts: ${err.message}`);
  }

  // Recent transactions (signatures only from public RPC)
  try {
    const signatures = await rpc('getSignaturesForAddress', [
      walletAddress,
      { limit: 20 },
    ]);

    if (signatures) {
      result.transactionCount = signatures.length;
      result.recentTransactions = signatures.map(sig => ({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime,
        confirmationStatus: sig.confirmationStatus,
        status: sig.err ? 'failed' : 'success',
        memo: sig.memo || null,
        error: sig.err || null,
      }));
    }
  } catch (err) {
    result.errors.push(`Transactions: ${err.message}`);
  }

  return result;
}

module.exports = { getWalletData };
