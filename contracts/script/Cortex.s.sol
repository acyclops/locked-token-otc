// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Cortex.sol";

contract MyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        Cortex CRX = new Cortex(
            "OTC Token",
            "OTC",
            1_000_000e18,
            1000e18,
            32758434,
            42758434
        );

        vm.stopBroadcast();
    }
}
