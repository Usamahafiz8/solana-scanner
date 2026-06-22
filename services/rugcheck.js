const axios = require('axios');

const RUGCHECK_BASE = 'https://api.rugcheck.xyz/v1/tokens';
const SOLANA_TRACKER_BASE = 'https://data.solanatracker.io/risk';

function scoreToLevel(score) {
  if (score === null || score === undefined) return 'UNKNOWN';
  if (score < 300) return 'LOW';
  if (score < 700) return 'MEDIUM';
  return 'HIGH';
}

async function getTokenRisk(mint) {
  const result = {
    mint,
    overallRiskScore: null,
    riskLevel: 'UNKNOWN',
    summary: {},
    rugcheck: null,
    solanaTracker: null,
  };

  // ---- RugCheck ----
  try {
    const res = await axios.get(`${RUGCHECK_BASE}/${mint}/report/summary`, {
      timeout: 12000,
    });
    const d = res.data;
    result.rugcheck = d;

    // Flatten the most useful fields into summary
    result.summary.score = d.score;
    result.summary.rugged = d.rugged ?? false;
    result.summary.mintAuthority = d.token?.mintAuthority ?? null;
    result.summary.freezeAuthority = d.token?.freezeAuthority ?? null;
    result.summary.tokenSupply = d.token?.supply;
    result.summary.decimals = d.token?.decimals;
    result.summary.metadataMutable = d.tokenMeta?.mutable ?? null;
    result.summary.metadataName = d.tokenMeta?.name;
    result.summary.metadataSymbol = d.tokenMeta?.symbol;
    result.summary.updateAuthority = d.tokenMeta?.updateAuthority ?? null;
    result.summary.creator = d.creator ?? null;
    result.summary.totalMarketLiquidity = d.totalMarketLiquidity ?? null;
    result.summary.totalLPProviders = d.totalLPProviders ?? null;

    // Top holder concentration
    if (Array.isArray(d.topHolders)) {
      result.summary.topHolders = d.topHolders.slice(0, 5).map(h => ({
        address: h.address,
        pct: h.pct,
        insider: h.insider ?? false,
      }));
      result.summary.top5HolderPct = d.topHolders
        .slice(0, 5)
        .reduce((sum, h) => sum + (h.pct || 0), 0)
        .toFixed(2);
    }

    // Risk warnings
    if (Array.isArray(d.risks)) {
      result.summary.warnings = d.risks.map(r => ({
        name: r.name,
        description: r.description,
        level: r.level,
        score: r.score,
      }));
    }

    // Liquidity lock info from markets
    if (Array.isArray(d.markets) && d.markets.length > 0) {
      result.summary.markets = d.markets.map(m => ({
        marketType: m.marketType,
        liquidityA: m.liquidityA,
        liquidityB: m.liquidityB,
        lpLocked: m.lp?.lpLockedPct ?? null,
        lpLockedUSD: m.lp?.lpLockedUSD ?? null,
        lpBurned: m.lp?.lpBurned ?? null,
      }));
    }

    result.overallRiskScore = d.score ?? null;
    result.riskLevel = scoreToLevel(d.score);
  } catch (err) {
    result.rugcheck = { error: `RugCheck failed: ${err.message}` };
  }

  // ---- Solana Tracker ----
  const apiKey = process.env.SOLANA_TRACKER_API_KEY;
  if (apiKey && apiKey !== 'your_solana_tracker_key_here') {
    try {
      const res = await axios.get(`${SOLANA_TRACKER_BASE}/${mint}`, {
        headers: { 'x-api-key': apiKey },
        timeout: 10000,
      });
      const d = res.data;
      result.solanaTracker = d;

      // If rugcheck score was absent, use Solana Tracker score
      if (result.overallRiskScore === null && d?.score !== undefined) {
        result.overallRiskScore = d.score;
        result.riskLevel = scoreToLevel(d.score);
      }

      result.summary.solanaTrackerScore = d?.score ?? null;
      result.summary.solanaTrackerRisks = d?.risks ?? null;
    } catch (err) {
      result.solanaTracker = { error: `Solana Tracker failed: ${err.message}` };
    }
  } else {
    result.solanaTracker = {
      skipped: 'Add SOLANA_TRACKER_API_KEY to .env for additional risk data',
    };
  }

  return result;
}

module.exports = { getTokenRisk };
