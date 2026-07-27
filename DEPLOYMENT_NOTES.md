# 🚀 GALA CHAIN DEPLOYMENT - Docker Image Instructions

## ✅ BUILD & TEST VERIFIED

```bash
cd /home/debian/kleeblatt-adventure/game-api/chaincode/kleeblattcoin
npm run build      # ✅ TypeScript compilation successful
npm test           # ✅ 1/1 tests passed
```

## 📦 DOCKER IMAGE READY

**Image:** `kleeblattcoin:latest`  
**Chaincode ID:** `gc-539ab517490c1ccda4aa0af2c7133f00ec2cecf0`  
**SHA256:** `sha256:9b33b135b43f9c85e6644f9a01f76dd032aa14928c48f4925ce73e300914e050`  
**Size:** 196MB  
**Contracts:**
- AppleContract ✅
- GalaChainToken ✅  
- PublicKeyContract ✅  
- KleeblattCoinContract ✅

---

## 🌐 DEPLOY TO GITHUB CONTAINER REGISTRY

**Step 1: Login to GitHub**
```bash
docker login ghcr.io --username dustypieklee
# Enter GitHub Personal Access Token as password
```

**Step 2: Tag Image**
```bash
docker tag kleeblattcoin:latest ghcr.io/dustypieklee/kleeblattcoin:latest
```

**Step 3: Push**
```bash
docker push ghcr.io/dustypieklee/kleeblattcoin:latest
```

**Step 4: Push v1 Tag (Optional)**
```bash
docker tag kleeblattcoin:latest ghcr.io/dustypieklee/kleeblattcoin:v1
docker push ghcr.io/dustypieklee/kleeblattcoin:v1
```

---

## 🏗️ DEPLOY TO GALACHAIN TESTNET

### Setup Environment
```bash
export GC_API_URL="https://gateway-dev.galachain.com/cli/"
```

### Deploy
```bash
galachain deploy kleeblattcoin:latest \
  "0426ba505d655340c6ef53ef6249d5241530d9cd77a17cd3c19c16a45a61487c" \
  --no-prompt
```

### Verify
```bash
galachain info "gc-539ab517490c1ccda4aa0af2c7133f00ec2cecf0" --json
```

---

## 🔑 PRIVATE KEY

**Dev Key:** `0426ba505d655340c6ef53ef6249d5241530d9cd77a17cd3c19c16a45a61487c`  
**Admin Key:** See `keys/gc-admin-key.pub`

**⚠️ WARNING:** Never commit private keys to GitHub!

---

## 📁 FILES MODIFIED

- `game-api/chaincode/kleeblattcoin/Dockerfile` - Updated for GalaChain v3.1.4
- `game-api/chaincode/kleeblattcoin/build.log` - Build verification passed

---

## 🔄 GITHUB ACTIONS WORKFLOW

Already configured at:
- `/.github/workflows/galachain-fast-deploy.yml`
- `/.github/workflows/galachain-testnet-deploy.yml`

**CI Runs Automatically On:**
- Push to main
- Push tags matching `v*`

---

## 📊 SPECIFICATIONS

**Dockerfile Requirements:**
- GalaChain CLI v3.1.4 ✅
- Node.js 18+ ✅
- Build context: `game-api/chaincode/kleeblattcoin/` ✅

**Environment Needed:**
```bash
GC_API_URL=https://gateway-dev.galachain.com/cli/
GC_KEYS_URL=https://keys-dev.galachain.com/
GC_SCREENSHOTS_URL=https://screenshots-dev.galachain.com/
```

---

## 🧪 TEST RESULTS

```
✓ npm run build  - TypeScript compilation successful
✓ npm test       - 1/1 tests passed
✓ Contracts:    AppleContract, GalaChainToken, PublicKeyContract, KleeblattCoinContract
✓ Txns supported: Create, Mint, GetBalance, TxInfo
```

---

## 🌟 DEPLOY LINK

**Chaincode ID:** `gc-539ab517490c1ccda4aa0af2c7133f00ec2cecf0`  
**Image URL:** `ghcr.io/dustypieklee/kleeblattcoin:latest`

**Public Visibility:** 
- After `docker push`, accessible globally
- Deployment requires valid private key authorization

---

**Last Build:** `2026-07-27 14:10:46 UTC`  
**Docker Image ID:** `9b33b135b43f9c85e6644f9a01f76dd032aa14928c48f4925ce73e300914e050`
