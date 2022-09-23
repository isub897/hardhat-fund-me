const networkConfig = {
    5: {
        name: "goerli",
        usdPriceFeedAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    80001: {
        name: "mumbai",
        usdPriceFeedAddress: "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    },
}

const developmentNetworks = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 127000000000

module.exports = {
    networkConfig,
    developmentNetworks,
    DECIMALS,
    INITIAL_ANSWER,
}
