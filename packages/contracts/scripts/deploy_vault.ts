import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Network:", "Base Mainnet");

    // Default owner is the deployer initially, but should be transferred to Multisig
    const SupportVault = await ethers.getContractFactory("SupportVault");
    const vault = await SupportVault.deploy(deployer.address);

    await vault.waitForDeployment();

    const address = await vault.getAddress();
    console.log("SupportVault deployed to:", address);

    console.log("----------------------------------------------------");
    console.log("IMPORTANT: POST-DEPLOYMENT ACTIONS");
    console.log("1. Verify contract on Basescan: npx hardhat verify --network base", address, deployer.address);
    console.log("2. Transfer ownership to Multi-Sig Wallet for production security.");
    console.log("----------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
