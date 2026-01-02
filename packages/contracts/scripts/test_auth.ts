import { AuthService } from '../src/services/AuthService';
import { ethers } from 'ethers';

async function testAuth() {
    process.env.ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Hardhat Account #0
    const auth = new AuthService();

    console.log('--- Testing Auth Service ---');

    // 1. Generate Nonce
    const nonce = auth.generateNonce();
    console.log('1. Generated Nonce:', nonce);

    // 2. Sign Nonce (Simulating Frontend)
    // Using Hardhat default private key for Account #0
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(nonce);
    console.log('2. Signed Message');

    // 3. Verify Login (Success Case)
    try {
        const response = await auth.loginAdmin(wallet.address, signature, nonce);
        console.log('[PASS] Admin Login Successful. Token:', response.token.substring(0, 20) + '...');
    } catch (e) {
        console.error('[FAIL] Admin Login:', e);
    }

    // 4. Verify Login (Failure Case - Wrong Address)
    try {
        const fakeWallet = ethers.Wallet.createRandom();
        const fakeSig = await fakeWallet.signMessage(nonce);
        await auth.loginAdmin(fakeWallet.address, fakeSig, nonce);
        console.error('[FAIL] Random Wallet Login should have failed but succeeded');
    } catch (e) {
        console.log('[PASS] Random Wallet Login correctly failed:', (e as Error).message);
    }
}

testAuth();
