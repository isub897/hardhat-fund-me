// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";
import "hardhat/console.sol";

error FundMe__MinimumAmount();
error FundMe__TransactionFailure();
error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 private constant MIN_USD = 10 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface internal priceFeed;

    modifier OnlyOwner() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address priceFeedAddress) {
        priceFeed = AggregatorV3Interface(priceFeedAddress);
        i_owner = msg.sender;
    }

    receive() external payable {
        console.log("receive() triggered");
        fund();
    }

    fallback() external payable {
        console.log("fallback() triggered");
        fund();
    }

    function fund() public payable {
        if (msg.value.convertToUsd(priceFeed) < MIN_USD)
            revert FundMe__MinimumAmount();
        if (s_addressToAmountFunded[msg.sender] == 0) {
            s_funders.push(msg.sender);
        }
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public OnlyOwner {
        for (uint256 index = 0; index < s_funders.length; index++) {
            s_addressToAmountFunded[s_funders[index]] = 0;
        }
        s_funders = new address[](0);
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        if (!sent) revert FundMe__TransactionFailure();
    }

    function getMinUsd() public pure returns (uint256) {
        return MIN_USD;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address _address)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[_address];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }
}
