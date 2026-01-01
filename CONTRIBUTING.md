# Contributing to Chain Receipt

Thank you for your interest in contributing to the Chain Receipt system! We welcome contributions from the community to help make this project better.

## Code of Conduct

Please help us keep this project open and inclusive. Be respectful and considerate of others.

## How to Contribute

1.  **Fork the Repository**: Click the "Fork" button on the top right of the repository page.
2.  **Clone your Fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/chain-receipt.git
    cd chain-receipt
    ```
3.  **Create a Branch**:
    ```bash
    git checkout -b feature/amazing-feature
    ```
4.  **Make Changes**: Implement your feature or fix.
5.  **Commit Changes**:
    ```bash
    git commit -m "feat: Add amazing feature"
    ```
    *Please follow [Conventional Commits](https://www.conventionalcommits.org/).*
6.  **Push to Branch**:
    ```bash
    git push origin feature/amazing-feature
    ```
7.  **Open a Pull Request**: Submit your PR on the main repository.

## Development Setup

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   Git

### Installation

1.  Install dependencies for both backend and frontend:
    ```bash
    npm install
    cd client && npm install && cd ..
    ```

2.  Configure Environment Variables:
    -   Copy `.env.example` to `.env` (create one if missing based on `DEPLOYMENT.md`).
    -   Fill in the required values.

### Running Locally

To start both the backend and frontend simultaneously:

```bash
npm run dev:all
```

-   **Frontend**: [http://localhost:3001](http://localhost:3001)
-   **Backend**: [http://localhost:3000](http://localhost:3000)

## Project Structure

-   `/client`: Next.js Frontend application.
-   `/src`: Backend Node.js/Express application.
-   `/contracts`: Hardhat smart contract development environment.
-   `/scripts`: Utility scripts.

## Guidelines

-   **Code Style**: ensure your code matches the existing style (Prettier/ESLint).
-   **Testing**:
    -   Run tests before submitting if available (`npm run test`).
    -   **PDF Verification**: When modifying `BillService.ts`, always verify that PDFs utilize the new Two-Pass layout and that Internal Transactions appear for complex calls (e.g. Uniswap/Router).
-   **Documentation**: Update README or other docs if your change affects usage.
