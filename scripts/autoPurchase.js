const { ethers, utils } = require("ethers");
const { ExternalStorageAccess } = require("../src/eth");

function autoPurchase() {
    return new Promise(async (resolve, reject) => {
        let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
        for (let i = 1; i <= 400; i++) {
            let container = await ExternalStorageAccess.connect(provider.getSigner()).getContainerAddrById(i);
            console.log("current container id: ", i);
            console.log("current container: ", container);
            let wallet = await provider.getSigner(i % 99);
            let from = await wallet.getAddress();
            console.log("current account: ", from)
            const buyZombiesInterface = new ethers.utils.Interface(["function buyZombies(uint256)"]);
            const buyData = buyZombiesInterface.encodeFunctionData("buyZombies", [5]);
            const transactionData = {
                from: from,
                to: container,
                value: utils.parseEther((5 * 0.0001).toFixed(4)),
                data: buyData
            }
            
            // const estimateGas = await web3.eth.estimateGas(transactionData);
            // transactionData.gas = parseInt(estimateGas * 1.05);
            await wallet.sendTransaction(transactionData)
            console.log("puchase amount: ", 5)

            const buyData1 = buyZombiesInterface.encodeFunctionData("buyZombies", [5]);
            const transactionData1 = {
                from: from,
                to: container,
                value: utils.parseEther((5 * 0.0001).toFixed(4)),
                data: buyData1
            }
            // const estimateGas1 = await web3.eth.estimateGas(transactionData1);
            // transactionData1.gas = parseInt(estimateGas1 * 1.05);
            await wallet.sendTransaction(transactionData1);
            console.log("puchase amount: ", 5)
            const buyData2 = buyZombiesInterface.encodeFunctionData("buyZombies", [5]);
            const transactionData2 = {
                from: from,
                to: container,
                value: utils.parseEther((5 * 0.0001).toFixed(4)),
                data: buyData2
            }
            // const estimateGas2 = await web3.eth.estimateGas(transactionData2);
            // transactionData2.gas = parseInt(estimateGas2 * 1.05);
            await wallet.sendTransaction(transactionData2);
            console.log("puchase amount: ", 5)
            const buyData3 = buyZombiesInterface.encodeFunctionData("buyZombies", [5]);
            const transactionData3 = {
                from: from,
                to: container,
                value: utils.parseEther((5 * 0.0001).toFixed(4)),
                data: buyData3
            }
            // const estimateGas3 = await web3.eth.estimateGas(transactionData3);
            // transactionData3.gas = parseInt(estimateGas3 * 1.05);
            await wallet.sendTransaction(transactionData3);
            console.log("puchase amount: ", 5)
            const buyData4 = buyZombiesInterface.encodeFunctionData("buyZombies", [3]);
            const transactionData4 = {
                from: from,
                to: container,
                value: utils.parseEther((3 * 0.0001).toFixed(4)),
                data: buyData4
            }
            // const estimateGas4 = await web3.eth.estimateGas(transactionData4);
            // transactionData4.gas = parseInt(estimateGas4 * 1.05);
            await wallet.sendTransaction(transactionData4);
            console.log("puchase amount: ", 3)
            const buyData5 = buyZombiesInterface.encodeFunctionData("buyZombies", [1]);
            const transactionData5 = {
                from: from,
                to: container,
                value: utils.parseEther((1 * 0.0001).toFixed(4)),
                data: buyData5
            }
            // const estimateGas5 = await web3.eth.estimateGas(transactionData5);
            // transactionData5.gas = parseInt(estimateGas5 * 1.05);
            await wallet.sendTransaction(transactionData5);
            console.log("puchase amount: ", 1)
            console.log("\n");
        }
    })
    
}

(async () => {
    await autoPurchase();
})()
