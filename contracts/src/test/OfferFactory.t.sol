// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import 'forge-std/Test.sol';

import {OfferFactory} from "../OfferFactory.sol";
import {LockedCortexOffer} from "../LockedCortexOffer.sol";

contract OfferFactoryTest is Test {
    OfferFactory factory;

    // LIVE
    // address public USDC = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8;

    address public USDC = 0xd896C4F18848db1f723ee10055D3aB609ABDF8a5;

    function setUp() public {
        factory = new OfferFactory();
    }

    function testSetFee() public {
        assertEq(factory.fee(), 250);
        factory.setFee(350);
        assertEq(factory.fee(), 350);
    }

    function testSetFeeDoesntPropagate() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 1000);

        uint256 oldFee = offer.fee();
        factory.setFee(oldFee + 100);
        assertEq(oldFee, offer.fee());
        assertTrue(oldFee != factory.fee());
    }

    function testCreateOffer() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 10);

        assertEq(address(factory.offers(0)), address(offer));
        assertEq(offer.factory(), address(factory));
        assertEq(offer.seller(), address(this));
        assertEq(offer.tokenWanted(), USDC);
        assertEq(offer.amountWanted(), 10);
    }
}
