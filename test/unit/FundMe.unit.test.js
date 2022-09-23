const { expect } = require("chai")
const hre = require("hardhat")
const { developmentNetworks } = require("../../helper-hardhat-config")

!developmentNetworks.includes(hre.network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let deployer
          let fundMe
          let mockV3Aggregator
          const sendValue = hre.ethers.utils.parseEther("1")
          beforeEach(async function () {
              await hre.deployments.fixture(["all"])
              deployer = (await hre.getNamedAccounts()).deployer
              fundMe = await hre.ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await hre.ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("Should initialize with the correct price feed address", async function () {
                  expect(await fundMe.getPriceFeed()).to.equal(
                      mockV3Aggregator.address
                  )
              })
          })

          describe("receive", function () {
              it("Should call fund() if receive() is called", async function () {
                  const accounts = await hre.ethers.getSigners()
                  const txResponse = await accounts[1].sendTransaction({
                      to: fundMe.address,
                      value: sendValue,
                  })
                  expect(await fundMe.getFunders(0)).to.equal(
                      accounts[1].address
                  )
                  expect(
                      await fundMe.getAddressToAmountFunded(accounts[1].address)
                  ).to.equal(hre.ethers.utils.parseEther("1"))
              })
          })

          describe("fallback", function () {
              it("Should call fund() if fallback() is called", async function () {
                  const accounts = await hre.ethers.getSigners()
                  const txResponse = await accounts[2].sendTransaction({
                      data: "0x00",
                      to: fundMe.address,
                      value: sendValue,
                  })
                  expect(await fundMe.getFunders(0)).to.equal(
                      accounts[2].address
                  )
                  expect(
                      await fundMe.getAddressToAmountFunded(accounts[2].address)
                  ).to.equal(hre.ethers.utils.parseEther("1"))
              })
          })

          describe("fund", function () {
              it("Should revert if min ETH not sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWithCustomError(
                      fundMe,
                      "FundMe__MinimumAmount"
                  )
              })

              it("Shouldn't add funder to funders array more than once", async function () {
                  let txResponse = await fundMe.fund({ value: sendValue })
                  await txResponse.wait(1)
                  txResponse = await fundMe.fund({ value: sendValue })
                  await txResponse.wait(1)
                  expect(
                      await hre.ethers.provider.getBalance(fundMe.address)
                  ).to.equal(hre.ethers.utils.parseEther("2"))
                  await expect(fundMe.getFunders(1)).to.be.reverted
              })

              it("Should update amount funded by funder", async function () {
                  let txResponse = await fundMe.fund({ value: sendValue })
                  await txResponse.wait(1)
                  txResponse = await fundMe.fund({ value: sendValue })
                  await txResponse.wait(1)
                  expect(
                      await fundMe.getAddressToAmountFunded(deployer)
                  ).to.equal(hre.ethers.utils.parseEther("2"))
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  const txResponse = await fundMe.fund({ value: sendValue })
              })

              it("Should only allow contract owner to withdraw", async function () {
                  const namedAccounts = await hre.ethers.getSigners()
                  const attackerConnectedContract = await fundMe.connect(
                      namedAccounts[1]
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("Should update amount funded by funder to 0", async function () {
                  const txResponse = await fundMe.withdraw()
                  await txResponse.wait(1)
                  expect(
                      await fundMe.getAddressToAmountFunded(deployer)
                  ).to.equal("0")
              })

              it("Should withdraw ETH from a single funder", async function () {
                  const startingBalanceDeployer =
                      await hre.ethers.provider.getBalance(deployer)
                  const startingBalanceFundMe =
                      await hre.ethers.provider.getBalance(fundMe.address)

                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)

                  const endingBalanceDeployer =
                      await hre.ethers.provider.getBalance(deployer)

                  const endingBalanceFundMe =
                      await hre.ethers.provider.getBalance(fundMe.address)
                  expect(endingBalanceFundMe).to.equal("0")

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  expect(
                      startingBalanceDeployer.add(startingBalanceFundMe)
                  ).to.equal(endingBalanceDeployer.add(gasCost))
              })

              it("Should withdraw ETH from multiple funders", async function () {
                  const accounts = await hre.ethers.getSigners()
                  for (let i = 1; i < 5; i++) {
                      const connectedFundMeContract = await fundMe.connect(
                          accounts[i]
                      )
                      const txResponse = await connectedFundMeContract.fund({
                          value: sendValue,
                      })
                      await txResponse.wait(1)
                  }
                  expect(
                      await hre.ethers.provider.getBalance(fundMe.address)
                  ).to.equal(hre.ethers.utils.parseEther("5"))

                  const startingBalanceDeployer =
                      await hre.ethers.provider.getBalance(deployer)
                  const startingBalanceFundMe =
                      await hre.ethers.provider.getBalance(fundMe.address)

                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)

                  const endingBalanceDeployer =
                      await hre.ethers.provider.getBalance(deployer)
                  const endingBalanceFundMe =
                      await hre.ethers.provider.getBalance(fundMe.address)

                  expect(endingBalanceFundMe).to.equal("0")

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  expect(
                      startingBalanceDeployer.add(startingBalanceFundMe)
                  ).to.equal(endingBalanceDeployer.add(gasCost))
              })
          })

          describe("getter functions", function () {
              it("getMinUsd() should return minimum USD required to fund", async function () {
                  expect("10000000000000000000").to.equal(
                      await fundMe.getMinUsd()
                  ) // $10USD
              })

              it("getOwner() should return the address of the contract owner", async function () {
                  expect(await fundMe.getOwner()).to.equal(deployer)
              })

              it("getBalance() to return the total balance of the contract", async function () {
                  expect(await fundMe.getBalance()).to.equal(
                      await hre.ethers.provider.getBalance(fundMe.address)
                  )
              })
          })
      })
