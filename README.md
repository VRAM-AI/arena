# 🎮 VRAM Arena

**A prediction market where AI agents play Connect 4 autonomously and users bet on the winner.**

## What is VRAM Arena?

VRAM Arena is a **trustless prediction market** built for the **Walrus Hackathon**. AI agents compete in Connect 4 battles while users place bets on outcomes. Every move is recorded immutably on **Walrus**, ensuring transparency and auditability.

### How It Works

1. **AI Agents Compete** – Six autonomous bots play Connect 4 battles
2. **Users Bet** – Place predictions on which agent will win
3. **Walrus Records Everything** – Every agent move is stored immutably on Walrus
4. **Smart Contract Settles** – Contract queries Walrus for verified outcomes and settles bets on-chain
5. **Transparent & Trustless** – Walrus proves every move happened exactly as recorded

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + TailwindCSS
- **Storage**: Walrus (immutable data storage)
- **Blockchain**: Sui (smart contracts)
- **Wallet**: Sui Wallet integration

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

✅ **6 AI Bots** with unique strategies and win rates  
✅ **Live Connect 4 Battles** with animated gameplay  
✅ **Walrus Integration** – All battle data stored immutably  
✅ **Sui Smart Contracts** – On-chain bet settlement  
✅ **Prediction Market** – Bet on battle outcomes  
✅ **Game History** – Track all past battles and results  
✅ **Real-time Stats** – View your bets and winnings  

## Walrus Integration

**Every battle is recorded on Walrus:**
- Game state (board positions)
- Move history
- Winner and timestamp
- Immutable proof of game outcomes

After each battle, data is stored on Walrus and retrievable via blob ID. The smart contract uses this verified data to settle predictions.

## Smart Contract

Deployed on Sui Testnet:
```
Package ID: 0x77e500a5738468dd0f7820ed6c7ac333bf5d04eeeff8442c6a5ae8e04445dd31
```

See `arena_oracle/` for Move source code.

## Project Structure

```
vram-arena-demo/
├── arena_oracle/          # Sui Move smart contracts
├── app/                   # Next.js frontend
│   ├── components/        # React components
│   │   ├── Connect4Game.tsx
│   │   ├── PolymarketBettingV2.tsx
│   │   ├── GameHistory.tsx
│   │   └── PlayerStats.tsx
│   ├── utils/
│   │   └── walrusClient.ts    # Walrus integration
│   └── data/
│       └── botsData.json      # AI bot configurations
└── README.md
```

## Hackathon: Walrus

VRAM Arena showcases Walrus as:
- **Immutable game state storage**
- **Verifiable data source for smart contracts**
- **Transparent audit trail for prediction markets**

Walrus ensures that every game outcome can be cryptographically verified, making the prediction market fully trustless.

---

**Built for Walrus Hackathon** 🦭
