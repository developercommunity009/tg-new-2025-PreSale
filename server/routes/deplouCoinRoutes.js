const express = require('express');
const router = express.Router();
const deployContract = require('../scripts/deploy');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_ENDPOINT));
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const { verifyContractOnEtherscan, generateSolidityFile } = require('../genrateAndVerify');

const protectDeploy = (req, res, next) => {
    const user = req.user; // Assuming req.user is populated with the authenticated user's data

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    if (user.role === 'admin'){
        return next();
      }
    if (user.role === 'user' && user.deployfun === true) {
        return next(); // Allow access for regular users if deployfun is false
    } else {
        return res.status(403).json({ message: 'Access denied: Contract deployment already done or not allowed' });
    }
};




router.post('/credentials', protectDeploy, async (req, res) => {

    const { formData } = req.body;


    const { name, symbol, rawSupply, taxwallet, buytax, selltax, discord, github, twitter, website } = formData;
    console.log(name, symbol, rawSupply, taxwallet, buytax, selltax, discord, github, twitter, website );

    const supply = web3.utils.toWei(rawSupply, 'ether'); // Convert raw supply to wei

    try {
        // Generate the Solidity file before deploying the contract
        await generateSolidityFile(name, symbol, supply, taxwallet, buytax, selltax, discord, github, twitter, website);

        // Deploy the contract and wait for it to complete
        const deploymentResult = await deployContract(name, symbol, supply, taxwallet, buytax, selltax);

        // if (!deploymentResult || !deploymentResult.contractAddress) {
        //     throw new Error("Contract instance or address is undefined");
        // }

        console.log(`Deployment successful! Contract address: ${deploymentResult.contractAddress}`);

        await sleep(60000);  // Adjust the time as needed

        // Verify the contract on Etherscan after deployment
        await verifyContractOnEtherscan(
            deploymentResult.contractAddress,
            [name, symbol, supply, taxwallet, buytax, selltax]
        );


        if (req.user.role === 'user') {
            req.user.deployfun = false;  // Mark deployment as done
            await req.user.save(); // Save the updated user object to the database
        }


        // Send a success response with the deployment details
        res.json({
            message: 'Contract deployed successfully',
            contractAddress: deploymentResult.contractAddress
        });
    } catch (error) {
        // Handle any errors during deployment or verification
        console.error('Error:', error);
        res.status(500).json({ message: 'Process failed', error: error.message });
    }
});

module.exports = router;
