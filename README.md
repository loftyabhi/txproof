# GChain Receipt System

A production-ready system to convert blockchain transactions into professional, audit-ready PDF receipts.

## 🚀 Quick Start

You can start both the Backend (API) and Frontend (Client) with a single command:

```bash
npm run dev:all
```

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Backend**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3001/dashboard](http://localhost:3001/dashboard)

### Manual Startup (Two Terminals)

If you prefer separate terminals:
1. **Backend**: `npm run dev` (in this root directory)
2. **Frontend**: `cd client` and then `npm run dev`

---

## 🛠️ Configuration

### Environment Variables
Edit the `.env` file in the root directory:

```ini
PORT=3000
ADMIN_ADDRESS=0x... # Your Admin Wallet Address for Dashboard Access
JWT_SECRET=...      # Secure random string
```

### Admin Dashboard
Access the dashboard to manage:
- **Subscription Plans** (Pricing, Validity)
- **Ad Profiles** (Inject ads into PDFs)

**Auth**: Connect the wallet matching `ADMIN_ADDRESS` in `.env`.

---

## 🏗️ Architecture

- **Backend**: Node.js, Express, Puppeteer (PDF Gen), Ethers.js
- **Frontend**: Next.js 15, Tailwind CSS, RainbowKit
- **Smart Contract**: Base (Ethereum L2) - `RegistryManager`

## 📝 License
Private.
