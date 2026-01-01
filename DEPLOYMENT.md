# Deployment & Infrastructure Guide

This guide outlines the infrastructure requirements and steps to deploy the Chain Receipt system, including the Blockchain components, Backend API, and Frontend application.

## 1. Blockchain Components (Base Network)

-   **Target Network**: Base Mainnet (Chain ID: 8453)
-   **Infrastructure Needed**:
    -   **Deployer Wallet**: Secure wallet (Ledger/Trezor recommended) with ETH on Base for gas.
    -   **RPC Provider**: Alchemy, Infura, or QuickNode (Base Mainnet URL).
    -   **Etherscan/Basescan API Key**: For verifying contract source code.
-   **Deployment**:
    -   Contract: `RegistryManager`
    -   Location: On-Chain (Base). The deployed address must be configured in both Frontend and Backend environments.

## 2. Backend Infrastructure (Node.js/Express)

-   **Recommended Platforms**: Railway, Render, or AWS ECS.
-   **Architecture**:
    -   **API Service**: Main Node.js/Express application.
    -   **Worker Service**: Separate process for BullMQ (PDF generation/Parsing) to prevent blocking the main API.
-   **Environment Variables**:
    Create a `.env` file (or configure platform secrets) with the following:
    ```ini
    PORT=3000
    ADMIN_ADDRESS=0x...          # Admin Wallet Address
    JWT_SECRET=...               # Secure random string
    PRIVATE_KEY=...              # Wallet Private Key (for transactions/signing)
    RPC_URL_BASE=...             # Base Mainnet RPC URL
    DATABASE_URL=...             # PostgreSQL Connection String
    REDIS_URL=...                # Redis Connection String
    S3_ACCESS_KEY=...            # For PDF Storage
    S3_SECRET_KEY=...
    S3_BUCKET_NAME=...
    ALCHEMY_API_KEY=...          # Critical for Base Internal Txs & Pricing
    ETHERSCAN_API_KEY=...        # Fallback for Internal Txs
    ```

## 3. Database & Caching

-   **PostgreSQL**:
    -   **Usage**: Application data, user records, transaction logs.
    -   **Hosting**: Supabase, Neon, AWS RDS, or Railway Plugin.
-   **Redis**:
    -   **Usage**: BullMQ Job Queue, Rate Limiting, Price Caching.
    -   **Hosting**: Upstash, Railway, or AWS ElastiCache.

## 4. Frontend Application (Next.js)

-   **Recommended Platforms**: Vercel (Optimized for Next.js), Netlify, or AWS Amplify.
-   **Build Settings**:
    -   Framework Preset: Next.js
    -   Build Command: `npm run build`
    -   Output Directory: `.next`
-   **Environment Variables**:
    ```ini
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=... # From WalletConnect Cloud
    NEXT_PUBLIC_CONTRACT_ADDRESS=...          # Deployed RegistryManager Address
    NEXT_PUBLIC_API_URL=...                   # URL of your deployed Backend
    ```

## 5. Storage (Artifacts)

-   **Object Storage**: AWS S3, Cloudflare R2, or DigitalOcean Spaces.
-   **Purpose**: Storing generated PDF receipts.
-   **Configuration**:
    -   Bucket should be private.
    -   Enable signed URL generation for secure access.

## 6. External Services

-   **CoinGecko / DeFiLlama**: For fetching historical token prices.
-   **WalletConnect**: Required for RainbowKit/Wagmi wallet connections.
