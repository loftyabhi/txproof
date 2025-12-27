# Deployment Requirements & Infrastructure Guide

## 1. Blockchain Components (Base Network)
*   **Target Network**: Base Mainnet (Chain ID: 8453)
*   **Infrastructure Needed**:
    *   **Deployer Wallet**: Use a secure wallet (Ledger/Trezor via Frame or a generated key) with ETH on Base for gas.
    *   **RPC Provider**: Alchemy, Infura, or QuickNode account (Base Mainnet URL).
    *   **Etherscan/Basescan API Key**: For verifying the contract source code.
*   **Deployment Location**: On-Chain (Base). Address will be hardcoded in Frontend/Backend.

## 2. Backend Infrastructure (Node.js/NestJS)
*   **Deployment Target**: VPS (Hetzner, DigitalOcean) or PaaS (Railway, Render, AWS ECS).
    *   *Recommendation*: **Railway** or **Render** for ease of use with Worker processes.
*   **Requirements**:
    *   **Main API Service**: Long-running Node.js process.
    *   **Worker Service**: Separate process for BullMQ (PDF generation/Parsing) to avoid blocking the API.
    *   **Environment Variables**:
        *   `PRIVATE_KEY` (Admin wallet for signing/withdrawals - secure heavily!)
        *   `RPC_URL_BASE`
        *   `DATABASE_URL`
        *   `REDIS_URL`
        *   `S3_ACCESS_KEY` / `S3_SECRET_KEY`

## 3. Database & Caching
*   **PostgreSQL**:
    *   **Location**: Managed SQL (Supabase, Neon, AWS RDS, or Railway Plugin).
    *   **Size**: Start small (e.g., 512MB-1GB RAM), scale as transaction history grows.
*   **Redis**:
    *   **Location**: Upstash (Serverless) or Managed Redis (Railway/AWS).
    *   **Usage**: BullMQ Job Queue, Rate Limiting, Price Caching.

## 4. Frontend Application (Next.js)
*   **Deployment Target**: **Vercel** (Recommended for Next.js) or Netlify/AWS Amplify.
*   **Requirements**:
    *   Node.js 18+ Environment.
    *   **Environment Variables**:
        *   `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` (Get from WalletConnect Cloud).
        *   `NEXT_PUBLIC_CONTRACT_ADDRESS` (After contract deployment).
        *   `NEXT_PUBLIC_API_URL` (URL of your deployed Backend).

## 5. Storage (Artifacts)
*   **Object Storage**: AWS S3, Cloudflare R2, or DigitalOcean Spaces.
    *   **Usage**: Storing generated PDF receipts.
    *   **Config**: Private bucket with signed URL generation enabled.

## 6. External Services (API Keys)
*   **CoinGecko / DeFiLlama**: Free tier usually sufficient for starting; Pro required for high throughput.
*   **WalletConnect**: Project ID for RainbowKit/Wagmi.
