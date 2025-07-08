// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import {LockedCortexOffer} from "../../LockedCortexOffer.sol";
import {OfferFactory} from "../../OfferFactory.sol";

contract FactoryDeployer {
    OfferFactory public factory;

    constructor() {
        factory = new OfferFactory();
    }

    function setFee(uint256 f) public {
        factory.setFee(f);
    }

    function withdraw(LockedCortexOffer offer, address token) public {
        offer.withdrawTokens(token);
    }
}
