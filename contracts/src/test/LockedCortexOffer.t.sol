// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import "forge-std/Test.sol";

import {IERC20, ICortexToken, IUSDC} from "../interfaces/Interfaces.sol";
import {OfferFactory} from "../OfferFactory.sol";
import {LockedCortexOffer} from "../LockedCortexOffer.sol";

import {FactoryDeployer} from "./user/FactoryDeployer.sol";
import {Trader} from "./user/Trader.sol";

contract LockedCortexOfferTest is Test {
    OfferFactory factory;

    FactoryDeployer factoryDeployer;
    Trader trader;

    Vm constant VM = Vm(HEVM_ADDRESS);

    // LIVE
    // address public constant USDC = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8;
    // ICortexToken CORTEX = ICortexToken(0xb21Be1Caf592A5DC1e75e418704d1B6d50B0d083);

    //TEST
    address public constant USDC = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    ICortexToken CORTEX =
        ICortexToken(0xAAB438C6881a8D7539d4A52724343bCdc54e32F1);

    function setUp() public {
        factoryDeployer = new FactoryDeployer();
        trader = new Trader();

        factory = factoryDeployer.factory();

        // give us 100k locked CORTEX to work with
        VM.startPrank(0x41BE3914FAE755e76C6b4E370d827C57891A4B82);
        CORTEX.mint(address(this), 100_000 * 1e18);
        CORTEX.lock(address(this), 100_000 * 1e18);
        CORTEX.totalBalanceOf(address(this));
        VM.stopPrank();

        // fund the offer user with 1m usdc
        VM.startPrank(0xd607632B2f058A31eC7dD86Dda1E3852D07eeC3E);
        IUSDC(USDC).mint(address(trader), 1_000_000 * 1e6);
        VM.stopPrank();
    }

    function testRevert_When_FillWithoutApproval() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 5 * 1e6);

        // fund the contract
        CORTEX.transferAll(address(offer));

        vm.expectRevert();
        trader.fillOffer(offer);
    }

    function testRevert_When_TraderCannotAfford() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 11 * 1e6);

        // fund the contract
        CORTEX.transferAll(address(offer));

        // would cost 1.1m USDC but we only have 1.0m
        vm.expectRevert();
        trader.fillOffer(offer);
    }

    function testFill() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 5 * 1e6);

        // fund the contract
        CORTEX.transferAll(address(offer));
        // approve USDC spending
        trader.approve(USDC, address(offer));

        uint256 prevBal = CORTEX.totalBalanceOf(address(offer));

        trader.fillOffer(offer);

        uint256 txFee = (5 * 1e6 * offer.fee()) / 10_000;
        uint256 maxFee = 25_000 * 1e6;
        txFee = txFee > maxFee ? maxFee : txFee;

        // buyer gets CORTEX
        assertEq(CORTEX.totalBalanceOf(address(trader)), prevBal);
        // trader gets USDC
        assertEq(IERC20(USDC).balanceOf(address(this)), 5 * 1e6 - txFee);
        // factory deployer gets fee
        assertEq(IERC20(USDC).balanceOf(address(factoryDeployer)), txFee);
    }

    function testWithdraw() public {
        VM.startPrank(address(trader));
        LockedCortexOffer offer = factory.createOffer(USDC, 5 * 1e6);
        VM.stopPrank();

        trader.approve(USDC, address(this));
        uint256 preBal = IERC20(USDC).balanceOf(address(trader));
        // transfer 1000 USDC to offer
        IERC20(USDC).transferFrom(address(trader), address(offer), 1000 * 1e6);

        // withdraw the lost USDC to the deployer
        trader.withdraw(offer, USDC);

        assertEq(IERC20(USDC).balanceOf(address(trader)), preBal);
    }

    function testRevert_When_CancelEmptyOffer() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 5 * 1e6);
        vm.expectRevert();
        offer.cancel();
    }

    function testCancel() public {
        LockedCortexOffer offer = factory.createOffer(USDC, 5 * 1e6);

        uint256 preBal = CORTEX.totalBalanceOf(address(this));
        // transfer all of our locked CORTEX
        CORTEX.transferAll(address(offer));
        // sanity check
        assertEq(CORTEX.totalBalanceOf(address(this)), 0);
        // get our locked CORTEX back by cancelling
        offer.cancel();
        assertEq(preBal, CORTEX.totalBalanceOf(address(this)));
    }
}
