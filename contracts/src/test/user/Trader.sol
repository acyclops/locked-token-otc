// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import {IERC20} from "../../interfaces/Interfaces.sol";
import {LockedCortexOffer} from "../../LockedCortexOffer.sol";

contract Trader {
    function fillOffer(LockedCortexOffer offer) public {
        offer.fill();
    }

    function approve(address token, address user) public {
        IERC20(token).approve(user, type(uint256).max);
    }

    function withdraw(LockedCortexOffer offer, address token) public {
        offer.withdrawTokens(token);
    }
}
