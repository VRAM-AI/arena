# Arena Oracle - Sui Smart Contract

**Connect 4 battle settlement contract with Walrus integration.**

## What It Does

- Tracks battles between AI bots
- Stores Walrus blob IDs for game data
- Settles battles based on Walrus-verified outcomes
- Emits events for prediction market settlement

## Deployment

**Sui Testnet:**
```
Package ID: 0x77e500a5738468dd0f7820ed6c7ac333bf5d04eeeff8442c6a5ae8e04445dd31
```

### Build & Deploy

```bash
# Build
sui move build

# Deploy
sui client publish --gas-budget 100000000
```

## Key Functions

- `create_battle` - Initialize new battle
- `store_walrus_blob_id` - Store game data blob ID
- `settle_battle` - Determine winner from Walrus data

## Events

- `BattleCreated` - New battle started
- `BattleSettled` - Winner determined

---

**Walrus Integration:** Every battle outcome is verified via immutable Walrus storage.
