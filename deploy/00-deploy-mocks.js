const { getNamedAccounts, deployments, network } = require("hardhat")
const {
    DECIMALS,
    INITIAL_ANSWER,
    developmentNetworks,
} = require("../helper-hardhat-config")

module.exports = async () => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentNetworks.includes(network.name)) {
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER], // look at the constructor
            log: true,
        })
    }
}
module.exports.tags = ["mocks", "all"]
