// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function convertToUsd(uint256 ethAmount, AggregatorV3Interface _priceFeed)
        internal
        view
        returns (uint256)
    {
        AggregatorV3Interface priceFeed = _priceFeed;
        (, int256 price, , , ) = priceFeed.latestRoundData();
        uint256 usdPricePerEth = uint256(price * 1e10);
        uint256 amountInUsd = (usdPricePerEth * ethAmount) / 1e18;
        return (amountInUsd);
    }
}
