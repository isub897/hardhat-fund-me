const {
    networkConfig,
    developmentNetworks,
} = require("../helper-hardhat-config")
const { getNamedAccounts, deployments, network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async () => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let usdPriceFeedAddress
    if (developmentNetworks.includes(network.name)) {
        const mockAggregatorContract = await deployments.get("MockV3Aggregator")
        usdPriceFeedAddress = mockAggregatorContract.address
    } else {
        usdPriceFeedAddress = networkConfig[chainId]["usdPriceFeedAddress"]
    }

    const args = [usdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentNetworks.includes(network.name)) {
        await verify(fundMe.address, args)
    }
}
module.exports.tags = ["fundme", "all"]
