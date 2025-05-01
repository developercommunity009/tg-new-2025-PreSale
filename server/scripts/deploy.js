
require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const deployContract = async (privateKey, name, symbol, rawSupply) => {
    try {
        console.log( "ye", privateKey ,name, symbol, rawSupply);

        // Use the private key passed from the frontend
        const wallet = new hre.ethers.Wallet(privateKey, hre.ethers.provider);

        // Compile the contract
        // await hre.run('compile');

        const Contract = await hre.ethers.getContractFactory("MyToken", wallet);
        console.log( "ye111", privateKey ,name, symbol, rawSupply);

        // Fetch the current gas price from the provider
        const gasPrice = await hre.ethers.provider.getGasPrice();
        const latestBlock = await hre.ethers.provider.getBlock("latest");
        const baseFee = latestBlock.baseFeePerGas || gasPrice;

        // Estimate the gas required for deployment
        const estimatedGas = await Contract.signer.estimateGas(
            Contract.getDeployTransaction()
        );
        console.log( "ye22222", privateKey ,name, symbol, rawSupply);

        // Lower priority fee and calculate total gas fee
        const maxPriorityFeePerGas = hre.ethers.utils.parseUnits('0.3', 'gwei'); // Use a lower priority fee
        const maxFeePerGas = baseFee.add(maxPriorityFeePerGas); // Total fee (base + priority)

        console.log(`Estimated gas limit: ${estimatedGas.toString()}`);
        console.log(`Current base fee per gas: ${hre.ethers.utils.formatUnits(baseFee, 'gwei')} Gwei`);
        console.log(`Max priority fee per gas: ${hre.ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} Gwei`);
        console.log(`Max fee per gas: ${hre.ethers.utils.formatUnits(maxFeePerGas, 'gwei')} Gwei`);

        // Calculate total cost of the gas in ETH
        const gasCostInWei = estimatedGas.mul(maxFeePerGas);
        const gasCostInEth = hre.ethers.utils.formatEther(gasCostInWei);

        console.log(`Estimated gas cost for deployment: ${gasCostInEth} ETH`);

        // Check if wallet balance is sufficient
        const balance = await wallet.getBalance();
        console.log(`Wallet balance: ${hre.ethers.utils.formatEther(balance)} ETH`);

        if (balance.lt(gasCostInWei)) {
            throw new Error(`Insufficient balance. You need at least ${gasCostInEth} ETH, but your balance is ${hre.ethers.utils.formatEther(balance)} ETH.`);
        }

        // Deploy the contract with the estimated gas limit and fees
        const contract = await Contract.deploy();

        // {
        //     gasLimit: estimatedGas,
        //     maxPriorityFeePerGas: maxPriorityFeePerGas, // Low priority fee
        //     maxFeePerGas: maxFeePerGas // Total fee including base + tip
        // }

        // Wait for the deployment to complete
        await contract.deployed();

        console.log(`Contract deployed at address: ${contract.address}`);

        return {
            contractAddress: contract.address
        };
    } catch (error) {
        console.error('Deployment error:', error);
        throw error;
    }
};

module.exports = deployContract;



