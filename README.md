# Chain Receipt System

> A production-ready system to convert blockchain transactions into professional, audit-ready PDF receipts.

Chain Receipt is a full-stack application designed to generate detailed financial receipts for blockchain transactions on the Base network. It bridges the gap between on-chain data and traditional accounting requirements.

## 🌟 Features

-   **Automated Receipt Generation**: Converts transaction hashes into downloadable PDF receipts.
-   **Smart Contract Integration**: Interacts with the `RegistryManager` on Base Mainnet.
-   **Internal Transactions**: Displays detailed smart contract execution transfers (ETH/Native) using Alchemy/Etherscan/Blockscout.
-   **Historical Pricing**: Fetches historical token prices using CoinGecko/DeFiLlama/Alchemy at the time of transaction.
-   **Enterprise-Grade PDF**: High-quality, printable PDF layout using Puppeteer.
-   **Admin Dashboard**: Manage subscription plans and ad profiles.
-   **Wallet Authentication**: Secure login using RainbowKit and Wagmi (SIWE).

## 🏗️ Tech Stack

### Frontend (`/client`)
-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Web3 Integration**:
    -   [RainbowKit](https://www.rainbowkit.com/)
    -   [Wagmi](https://wagmi.sh/)
    -   [Viem](https://viem.sh/)
-   **State Management**: React Query (TanStack Query)
-   **Icons**: Lucide React

### Backend (`/`)
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Blockchain Interaction**: Ethers.js v6
-   **Job Queue**: BullMQ & Redis
-   **PDF Generation**: Puppeteer & Handlebars
-   **Database**: PostgreSQL (via Supabase/Neon recommended)

### Smart Contracts (`/contracts`)
-   **Network**: Base (Ethereum L2)
-   **Framework**: Hardhat
-   **Library**: OpenZeppelin

## 🚀 Quick Start

### Prerequisites
-   Node.js v18+
-   Redis (for background jobs)
-   PostgreSQL

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd chain-receipt
    ```

2.  **Install Dependencies**:
    ```bash
    # Install root/backend dependencies
    npm install

    # Install frontend dependencies
    cd client
    npm install
    cd ..
    ```

3.  **Configuration**:
    Create a `.env` file in the root directory:
    ```ini
    PORT=3000
    ADMIN_ADDRESS=0xYourAdminAddress
    JWT_SECRET=your_super_secret_key
    RPC_URL_BASE=https://mainnet.base.org
    DATABASE_URL=postgresql://user:pass@localhost:5432/db
    REDIS_URL=redis://localhost:6379
    ALCHEMY_API_KEY=your_alchemy_key  # Required for Internal Txs on Base
    ETHERSCAN_API_KEY=your_etherscan_key # Fallback for other chains
    ```

    Create a `.env.local` in the `client` directory:
    ```ini
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id
    NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
    NEXT_PUBLIC_API_URL=http://localhost:3000
    ```

### Development

To start both the Backend and Frontend concurrently:

```bash
npm run dev:all
```

-   **Frontend**: [http://localhost:3001](http://localhost:3001)
-   **Backend**: [http://localhost:3000](http://localhost:3000)
-   **Admin Dashboard**: [http://localhost:3001/dashboard](http://localhost:3001/dashboard)

## 📂 Project Structure

```
├── client/                 # Next.js Frontend
│   ├── app/                # App Router Pages
│   ├── components/         # React Components
│   └── ...
├── contracts/              # Hardhat Smart Contracts
├── src/                    # Backend Source Code
│   ├── controllers/        # API Controllers
│   ├── services/           # Business Logic (BillService, PriceOracle, etc.)
│   └── index.ts            # Entry Point
├── templates/              # HTML/Handlebars Templates for PDFs
├── scripts/                # Utility Scripts
└── ...
```

## 📖 Documentation

-   [Deployment Guide](DEPLOYMENT.md): Detailed infrastructure and deployment instructions.
-   [Contributing](CONTRIBUTING.md): Guidelines for contributing to the project.

## 📄 License

Private. All rights reserved.
