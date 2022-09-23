const { expect } = require("chai")
const hre = require("hardhat")
const { developmentNetworks } = require("../../helper-hardhat-config")
require("dotenv").config()

developmentNetworks.includes(hre.network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let deployer
          let user
          let fundMe
          let userContract
          const sendValue = hre.ethers.utils.parseEther("0.01")
          beforeEach(async function () {
              deployer = (await hre.getNamedAccounts()).deployer
              user = new hre.ethers.Wallet(process.env.PRIVATE_KEY_TWO)
              fundMe = await hre.ethers.getContract("FundMe", deployer)
              userContract = await hre.ethers.getContract(
                  "FundMe",
                  user.address
              )
              //   userContract = await fundMe.connect(user)
          })

          describe("fund", function () {
              afterEach(async function () {
                  const txResponse = await fundMe.withdraw()
                  await txResponse.wait(1)
              })

              it("Should require a minimum ETH amount", async function () {
                  await expect(
                      userContract.fund()
                  ).to.be.revertedWithCustomError(
                      fundMe,
                      "FundMe__MinimumAmount"
                  )
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  const txResponse = await fundMe.fund({ value: sendValue })
                  await txResponse.wait(1)
              })

              it("Should only allow the owner to withdraw", async function () {
                  await expect(
                      userContract.withdraw()
                  ).to.be.revertedWithCustomError(
                      userContract,
                      "FundMe__NotOwner"
                  )
              })

              it("Should withdraw from a single funder", async function () {
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
      })
