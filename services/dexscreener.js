const axios = require('axios');

const BASE_URL = 'https://api.dexscreener.com/latest/dex/tokens';

async function getTokenStats(tokenAddress) {
  const response = await axios.get(`${BASE_URL}/${tokenAddress}`, { timeout: 10000 });
  const pairs = response.data.pairs;

  if (!pairs || pairs.length === 0) {
    throw new Error('No trading pairs found for this token address');
  }

  // Pick the pair with highest USD liquidity
  const pair = [...pairs].sort(
    (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
  )[0];

  return {
    tokenName: pair.baseToken?.name,
    symbol: pair.baseToken?.symbol,
    contractAddress: pair.baseToken?.address,
    currentPriceUSD: pair.priceUsd,
    priceNative: pair.priceNative,
    marketCap: pair.marketCap,
    fdv: pair.fdv,
    liquidity: {
      usd: pair.liquidity?.usd,
      base: pair.liquidity?.base,
      quote: pair.liquidity?.quote,
    },
    volume: {
      h24: pair.volume?.h24,
      h6: pair.volume?.h6,
      h1: pair.volume?.h1,
      m5: pair.volume?.m5,
    },
    priceChange: {
      h24: pair.priceChange?.h24,
      h6: pair.priceChange?.h6,
      h1: pair.priceChange?.h1,
      m5: pair.priceChange?.m5,
    },
    transactions: {
      h24: { buys: pair.txns?.h24?.buys, sells: pair.txns?.h24?.sells },
      h6: { buys: pair.txns?.h6?.buys, sells: pair.txns?.h6?.sells },
      h1: { buys: pair.txns?.h1?.buys, sells: pair.txns?.h1?.sells },
    },
    pairCreatedAt: pair.pairCreatedAt,
    pairAgeHours: pair.pairCreatedAt
      ? Math.floor((Date.now() - pair.pairCreatedAt) / 3600000)
      : null,
    chainId: pair.chainId,
    dexId: pair.dexId,
    pairAddress: pair.pairAddress,
    quoteToken: {
      name: pair.quoteToken?.name,
      symbol: pair.quoteToken?.symbol,
      address: pair.quoteToken?.address,
    },
    info: {
      logoUrl: pair.info?.imageUrl,
      header: pair.info?.header,
      websites: pair.info?.websites || [],
      socials: pair.info?.socials || [],
    },
    boosts: pair.boosts || null,
    totalPairsFound: pairs.length,
    otherPairs: pairs.slice(1, 6).map(p => ({
      dex: p.dexId,
      pairAddress: p.pairAddress,
      liquidityUSD: p.liquidity?.usd,
      volume24h: p.volume?.h24,
    })),
  };
}

module.exports = { getTokenStats };
