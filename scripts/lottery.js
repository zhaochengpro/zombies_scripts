const axios = require("axios");
const { ethers, utils } = require('ethers');
const keccak256 = require("keccak256");
const Web3 = require("web3");
const { soliditySha3 } = require("web3-utils");
const { LotteryDAddr } = require("../src/address.json")
const { AZ, Lottery } = require('../src/eth');


let tokenIdArr = [];
let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

async function main() {
    let argv = process.argv;
    let wallet = await provider.getSigner(0);
    if (argv.length >= 3) {
        switch (argv[2]) {
            case "silver":
                revealSliverPrizeWinner(Number(argv[3]));
                break;
            case "setSilver":
                let sliverTokenIdList = JSON.parse(argv[3]);
                setSilverPrizeWinners(sliverTokenIdList);
                break;
            case "silverPrizeWinnersProof":
                let silverProof = await calculateWinnerProof(revealSliverPrizeWinner(Number(argv[3])));
                await Lottery.connect(wallet).setSilverPrizeWinnersProof(silverProof);
                console.log("set SilverPrizeWinnersProof success")
                break;
            case "verifySilver":
                await Lottery.connect(wallet).verifySilverPrizeWinners();
                const res = await Lottery.connect(wallet).silverPrizeWinnersVerified();
                console.log("silverPrizeWinnersVerified:", res)
                break;
            case "gold":
                revealGoldPrizeWinner(Number(argv[3]));
                break;
            case "setGold":
                let goldTokenIdList = JSON.parse(argv[3]);
                setGoldPrizeWinners(goldTokenIdList);
                break;
            case "goldPrizeWinnersPool":
                let goldProof = await calculateWinnerProof(revealGoldPrizeWinner(Number(argv[3])));
                await Lottery.connect(wallet).setGoldPrizeWinnersProof(goldProof);
                console.log("set goldPrizeWinnersProof success")
                break;
            case "verifyGold":
                await Lottery.connect(wallet).verifyGoldPrizeWinners();
                const goldRes = await Lottery.connect(wallet).goldPrizeWinnersVerified();
                console.log("silverPrizeWinnersVerified:", goldRes)
                break;
            case "diamond":
                revealDiamondPrizeWinner();
                break;
            case "setDiamond":
                let diamonTokenId = Number(argv[3]);
                setDiamondPrizeTokenId(diamonTokenId);
                break;
        }
    }
}

// verifyDiamondPrizeWinner()

async function verifyDiamondPrizeWinner() {
    const diamondWiner = await Lottery.connect(provider.getSigner()).verifyDiamondPrizeWinner();
    console.log(diamondWiner);
}


function revealSliverPrizeWinner(ethPrice) {
    let sliverWinner = revealPrizeWinner(ethPrice, 40);
    console.log("sliver prize winners tokenId list: ")
    console.log(sliverWinner)
    return sliverWinner;
}

function revealGoldPrizeWinner(btcPrice) {
    let goldWinner = revealPrizeWinner(btcPrice, 4);
    console.log("sliver gold winners tokenId list: ")
    console.log(goldWinner)
    return goldWinner;
}

async function revealDiamondPrizeWinner() {
    let addrString = "";
    let tokenId;
    for (let i = 0; i < 400; i++) {
        let owner = await AZ.connect(provider.getSigner()).ownerOf(9601 + i);
        addrString += owner;
    }
    while (true) {
        const hashB = keccak256(addrString);
        tokenId = toUint32(hashB) % 10000
        if (tokenIdArr.indexOf(tokenId) != -1 || tokenId == 0) continue
        else break;

    }
    console.log("sliver prize winners tokenId: ", tokenId)
    return tokenId;
}

async function setGoldPrizeWinners(winnerTokenIdList) {
    try {
        await Lottery.connect(provider.getSigner()).setGoldPrizeWinners(winnerTokenIdList)
        console.log("Stored gold prize winners tokenId to BlockChain")
    } catch (error) {
        console.log(error);
    }
}

async function setSilverPrizeWinners(winnerTokenIdList) {
    try {
        await Lottery.connect(provider.getSigner()).setSilverPrizeWinners(winnerTokenIdList)
        console.log("Stored silver prize winners tokenId to BlockChain")
    } catch (error) {
        console.log(error);
    }
}

async function setDiamondPrizeTokenId(winnerTokenIdList) {
    try {
        await Lottery.connect(provider.getSigner()).setDiamondPrizeTokenId(winnerTokenIdList)
        console.log("Stored diamond prize winners tokenId to BlockChain")
    } catch (error) {
        console.log(error);
    }
}


function revealPrizeWinner(cmcPrice, winnerAmount) {
    let revealedSliverAmount = 0;
    let arr = [];
    let hashB = intToByte(cmcPrice);
    while (true) {
        hashB = keccak256(hashB);
        let tokenId = toUint32(hashB) % 10000
        if (tokenIdArr.indexOf(tokenId) == -1 && tokenId != 0 && tokenId <= 9600) {
            tokenIdArr.push(tokenId);
            arr.push(tokenId);
            revealedSliverAmount++;
        } else {
            continue;
        }

        if (revealedSliverAmount >= winnerAmount) break

    }

    return arr;
}

async function calculateWinnerProof(tokenIds) {
    let owners = []
    const owner1 = await AZ.connect(provider.getSigner()).ownerOf(tokenIds[0]);
    owners.push(owner1)
    let hashProof = soliditySha3(owner1);
    for (let i = 1; i < tokenIds.length; i++) {
        const owner = await AZ.connect(provider.getSigner()).ownerOf(tokenIds[i]);
        hashProof = soliditySha3(hashProof, owner);
        owners.push(owner)
    }
    return hashProof;
}

function intToByte(i) {
    var b = i & 0xFF;
    var c = 0;
    if (b >= 128) {
        c = b % 128;
        c = -1 * (128 - c);
    } else {
        c = b;
    }
    return c
}

function getView(bytes) {
    var view = new DataView(new ArrayBuffer(bytes.length));
    for (var i = 0; i < bytes.length; i++) {
        view.setUint8(i, bytes[i]);
    }
    return view;
}

function toUint32(bytes) {
    return getView(bytes).getUint32();
}

function str2Buffer(str) {
    // 首先将字符串转为16进制
    let val = ""
    for (let i = 0; i < str.length; i++) {
        if (val === '') {
            val = str.charCodeAt(i).toString(16)
        } else {
            val += ',' + str.charCodeAt(i).toString(16)
        }
    }
    // 将16进制转化为ArrayBuffer
    return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    })).buffer
}

(() => {
    main()
})()