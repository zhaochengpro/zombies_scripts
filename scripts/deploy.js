// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require('fs')
const path = require('path')
const provenance = require("../src/provenance.json")
const DB = require('./DBCon')
const connection = DB.connection();


async function main() {
  const delployers = await ethers.getSigners();
  console.log(
    "Deploying contracts with the account:",
    delployers[0].address
  );
  console.log("Account balance:", (await delployers[0].getBalance()).toString());

  ContainerBeacon = await hre.ethers.getContractFactory("ContainerBeacon");
  ContainerImplementation = await hre.ethers.getContractFactory("ContainerImplementation");
  ContainerProxy = await hre.ethers.getContractFactory("ContainerProxy");
  ContainerProxyManager = await hre.ethers.getContractFactory("ContainerProxyManager");

  ContainerCounterFactory = await hre.ethers.getContractFactory("ContainerCounterFactory");
  ContainerProxyFactory = await hre.ethers.getContractFactory("ContainerProxyFactory");

  ExternalStorage = await hre.ethers.getContractFactory("ExternalStorage");
  ExternalStorageAccess = await hre.ethers.getContractFactory("ExternalStorageAccess");

  AZ = await hre.ethers.getContractFactory("AZ");

  Lottery = await hre.ethers.getContractFactory("Lottery");

  // await ContractFactory();
  await DEPLOY(10);
  await INIT();
}

async function INIT() {
  await ExternalStorageAccessD.setMaxNumOfContainers(400);
  await ExternalStorageAccessD.setNumOfZombiesPerContainer(24);
  await ExternalStorageAccessD.setMaxNumOfActiveContainers(15);
  await ExternalStorageAccessD.setOpeningThreshhold(15);  // Effectively 25 - 10
  await AZD.setBaseURI("http://184.72.206.94:40189/zombies/", "http://184.72.206.94:40189/leaders/")
  // await InitData();

  // await initDataBase();
}

async function initDataBase() {
  let collections = provenance.collection;
  for (let i = 0; i < collections.length; i++) {
    let zombie = collections[i];
    let traits = zombie.traits;
    await insert(zombie, traits)
    await storeCIDSToMysql(zombie);
  }
}

function insert(zombie, traits) {
  return new Promise((resolve, reject) => {
    DB.insert(connection, "INSERT INTO zombies VALUES(?,?,?,?,?,?,?,?,?,?,?)", [
      zombie.tokenId,
      "",
      traits.bgColor,
      traits.body,
      traits.mouth,
      traits.eyes,
      traits.head,
      traits.neck,
      traits.earring,
      traits.eyewear,
      0
    ], (data) => {
      resolve(data)
    })
  })
}

function storeCIDSToMysql(zombie) {
  return new Promise((resolve, reject) => {
    DB.insert(connection, "INSERT INTO cids VALUES(?,?)", [
      zombie.tokenId,
      `http://184.72.206.94:40189/zombies/${zombie.tokenId}.png`,
    ], (data) => {
      resolve(data)
    })
  })
}

function sleep(milliseconds) { const date = Date.now(); let currentDate = null; do { currentDate = Date.now(); } while (currentDate - date < milliseconds); }

async function InitData() {
  let containers = [];
  const containerNum = await ContainerProxyFactoryD.getContainerId()
  const totalAmount = await ExternalStorageAccessD.getNumOfZombiesPerContainer();
  const maxNumOfContainer = await ExternalStorageAccessD.getMaxNumOfContainers();

  DB.insert(connection, "INSERT INTO AZ VALUE(?,?,?,?)", [
    new Date().getTime(),
    15,
    1,
    Number(maxNumOfContainer.toString(10))
  ], (data) => {

  })

  for (let i = 1; i < containerNum; i++) {
    const container = await ExternalStorageAccessD.getContainerAddrById(i);
    const amount = await ContainerCounterFactoryD.current(container);
    DB.insert(connection, "INSERT INTO containers VALUE(?,?,?,?,?,?)", [
      i,
      container,
      Number(amount.toString()),
      Number(totalAmount.toString()),
      1,
      0
    ], (data) => {
      console.log(data)
    })
  }
}

async function DEPLOY(ts) {
  let gasPrice_ = 30000000000
  ExternalStorageD = await ExternalStorage.deploy({ gasPrice: gasPrice_, gasLimit: 20000000 });  // 7.7
  ExternalStorageDAddr = ExternalStorageD.address;

  console.log("1");

  sleep(ts);

  ExternalStorageAccessD = await ExternalStorageAccess.deploy(ExternalStorageDAddr, { gasPrice: gasPrice_, gasLimit: 25000000 });
  ExternalStorageAccessDAddr = ExternalStorageAccessD.address;

  console.log("2");


  sleep(ts);

  AZD = await AZ.deploy(ExternalStorageAccessDAddr, { gasLimit: 25000000 });
  AZDAddr = AZD.address;

  console.log("Lottery")
  sleep(ts)

  LotteryD = await Lottery.deploy(AZD.address, { gasLimit: 25000000 });
  LotteryDAddr = LotteryD.address;

  console.log("5");
  sleep(ts);

  ContainerImplementationD = await ContainerImplementation.deploy(ExternalStorageAccessDAddr, { gasLimit: 25000000 });
  ContainerImplementationDAddr = ContainerImplementationD.address;

  console.log("6");
  sleep(ts);

  ContainerBeaconD = await ContainerBeacon.deploy(ContainerImplementationDAddr, { gasLimit: 25000000 });
  ContainerBeaconDAddr = ContainerBeaconD.address;

  console.log("7");
  sleep(ts);

  ContainerProxyD = await ContainerProxy.deploy(ContainerBeaconDAddr, ExternalStorageAccessDAddr, { gasLimit: 25000000 });
  ContainerProxyDAddr = ContainerProxyD.address;

  console.log("9");
  sleep(ts);

  ContainerCounterFactoryD = await ContainerCounterFactory.deploy(ExternalStorageAccessDAddr, { gasLimit: 25000000 });
  ContainerCounterFactoryDAddr = ContainerCounterFactoryD.address;

  console.log("10");
  sleep(ts);

  ContainerProxyFactoryD = await ContainerProxyFactory.deploy(ExternalStorageAccessDAddr, ContainerBeaconDAddr, { gasLimit: 25000000 });
  ContainerProxyFactoryDAddr = ContainerProxyFactoryD.address;

  console.log("8");
  sleep(ts);

  ContainerProxyManagerD = await ContainerProxyManager.deploy(ExternalStorageAccessDAddr, { gasLimit: 25000000 });
  ContainerProxyManagerDAddr = ContainerProxyManagerD.address;



  fs.writeFileSync(path.resolve(__dirname, "../src/address.json"), JSON.stringify({
    ExternalStorageDAddr,
    ExternalStorageAccessDAddr,
    AZDAddr,
    ContainerImplementationDAddr,
    ContainerBeaconDAddr,
    ContainerProxyDAddr,
    ContainerCounterFactoryDAddr,
    ContainerProxyFactoryDAddr,
    ContainerProxyManagerDAddr,
    LotteryDAddr
  }))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
