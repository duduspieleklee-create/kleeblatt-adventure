import express from 'express';
import { SigningClient, TokenApi } from '@gala-chain/connect';

const PORT = process.env.PORT || 8002;
const PRIVATE_KEY = process.env.GALA_PRIVATE_KEY || '';
const CHAINCODE_URL = process.env.GALA_CHAINCODE_URL || '';

const signingClient = PRIVATE_KEY ? new SigningClient(PRIVATE_KEY) : null;

const app = express();
app.use(express.json());

const AWARD_AMOUNTS = [100, 80, 60, 50, 40, 30, 20, 15, 10, 5];

function winnerAmount(rank) {
  return AWARD_AMOUNTS[rank - 1] || 0;
}

function health() {
  return {
    status: 'ok',
    hasPrivateKey: !!PRIVATE_KEY,
    chaincodeUrl: CHAINCODE_URL,
  };
}

app.get('/health', (_req, res) => {
  res.json(health());
});

app.post('/mint-coins', async (req, res) => {
  const { walletAddress, rank } = req.body;

  if (!walletAddress || !rank) {
    return res.status(400).json({ error: 'walletAddress and rank required' });
  }

  const amount = winnerAmount(rank);
  if (amount === 0) {
    return res.status(400).json({ error: `Invalid rank: ${rank}` });
  }

  if (!signingClient) {
    return res.status(503).json({ error: 'Signing client not configured' });
  }

  try {
    const tokenApi = new TokenApi(CHAINCODE_URL, signingClient);

    const result = await tokenApi.MintToken({
      tokenClass: {
        collection: 'Kleeblatt',
        category: 'Coin',
        type: 'KleeblattCoin',
        additionalKey: 'v1',
      },
      owner: `eth|${walletAddress}`,
      quantity: amount,
    });

    res.json({
      success: true,
      walletAddress,
      rank,
      amount,
      txId: result.txHash || result.transactionHash || null,
    });
  } catch (err) {
    console.error('Mint failed:', err.message);
    res.status(500).json({
      error: 'Mint failed',
      detail: err.message,
    });
  }
});

app.post('/mint-batch', async (req, res) => {
  const { winners } = req.body;

  if (!winners || !Array.isArray(winners)) {
    return res.status(400).json({ error: 'winners array required' });
  }

  if (!signingClient) {
    return res.status(503).json({ error: 'Signing client not configured' });
  }

  const results = [];

  for (const winner of winners) {
    const amount = winnerAmount(winner.rank);
    if (amount === 0) continue;

    try {
      const tokenApi = new TokenApi(CHAINCODE_URL, signingClient);
      const result = await tokenApi.MintToken({
        tokenClass: {
          collection: 'Kleeblatt',
          category: 'Coin',
          type: 'KleeblattCoin',
          additionalKey: 'v1',
        },
        owner: `eth|${winner.walletAddress}`,
        quantity: amount,
      });

      results.push({
        rank: winner.rank,
        walletAddress: winner.walletAddress,
        amount,
        txId: result.txHash || result.transactionHash || null,
        status: 'success',
      });
    } catch (err) {
      console.error(`Mint failed for rank ${winner.rank}:`, err.message);
      results.push({
        rank: winner.rank,
        walletAddress: winner.walletAddress,
        amount,
        status: 'failed',
        error: err.message,
      });
    }
  }

  res.json({ results });
});

app.get('/leaderpoints', async (_req, res) => {
  res.json({
    status: 'not_implemented',
    note: 'Leaderpoints query requires deployed chaincode with GetBalances endpoint',
  });
});

app.listen(PORT, () => {
  console.log(`Kleeblatt coin service running on port ${PORT}`);
  console.log(health());
});
