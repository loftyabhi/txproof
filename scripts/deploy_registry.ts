import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const RegistryManager = await ethers.getContractFactory("RegistryManager");
    // Pass the deployer as the initial owner
    const registry = await RegistryManager.deploy(deployer.address);

    await registry.waitForDeployment();

    const address = await registry.getAddress();

    console.log("RegistryManager deployed to:", address);
    console.log("Owner:", deployer.address);

    console.log("\nIMPORTANT: Update the following files with this address:");
    console.log("1. client/src/abis/RegistryManager.ts");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
