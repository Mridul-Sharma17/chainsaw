# SplitChain

A decentralized expense-splitting dApp built on Ethereum with blockchain-verified uneven splits for true financial fairness.

## Features

- **Group Management**: Create expense-splitting groups with multiple members
- **Smart Expense Tracking**: Record expenses with automatic balance calculation
- **Even & Uneven Splits**: Split expenses equally or assign custom amounts per person
- **ETH Settlement**: Pay debts directly through smart contracts
- **Blockchain Transparency**: All transactions are verifiable on-chain

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20
- **Frontend**: Next.js 14, React, TailwindCSS
- **Blockchain**: Hardhat, Ethereum
- **Testing**: 44/44 tests passing

## Quick Start

```bash
# Install dependencies
yarn install

# Start local blockchain
yarn chain

# Deploy contracts (new terminal)
yarn deploy

# Start frontend (new terminal)
yarn start
```

Visit `http://localhost:3000`

## Smart Contract

- **Contract**: `SplitChain.sol`
- **Features**: Group creation, expense tracking, balance calculation, settlement
- **Innovation**: Uneven split validation with on-chain verification

## Testing

```bash
cd packages/hardhat
yarn test
```

Built with ❤️ using Scaffold-ETH 2