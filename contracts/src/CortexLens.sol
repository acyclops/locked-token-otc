// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import {IERC20, ICortexToken, ILockedCortexOffer, IOfferFactory, IOwnable} from "./interfaces/Interfaces.sol";

contract CortexLens {
    // address public constant USDC = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8;
    // ICortexToken CORTEX = ICortexToken(0xb21Be1Caf592A5DC1e75e418704d1B6d50B0d083);

    // TESTNET
    address public constant USDC = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    ICortexToken CORTEX =
        ICortexToken(0xAAB438C6881a8D7539d4A52724343bCdc54e32F1);

    function getVolume(
        IOfferFactory factory
    ) public view returns (uint256 sum) {
        address factoryOwner = IOwnable(address(factory)).owner();

        uint256 volume = IERC20(USDC).balanceOf(factoryOwner) * (10 ** 12);
        sum = volume * 40;
    }

    function getOfferInfo(
        ILockedCortexOffer offer
    )
        public
        view
        returns (
            uint256 cortexBalance,
            address tokenWanted,
            uint256 amountWanted
        )
    {
        return (
            CORTEX.totalBalanceOf(address(offer)),
            offer.tokenWanted(),
            offer.amountWanted()
        );
    }

    function getActiveOffersPruned(
        IOfferFactory factory
    ) public view returns (ILockedCortexOffer[] memory) {
        ILockedCortexOffer[] memory activeOffers = factory.getActiveOffers();
        // determine size of memory array
        uint count;
        for (uint i; i < activeOffers.length; i++) {
            if (address(activeOffers[i]) != address(0)) {
                count++;
            }
        }
        ILockedCortexOffer[] memory pruned = new ILockedCortexOffer[](count);
        for (uint j; j < count; j++) {
            pruned[j] = activeOffers[j];
        }
        return pruned;
    }

    function getAllActiveOfferInfo(
        IOfferFactory factory
    )
        public
        view
        returns (
            address[] memory offerAddresses,
            uint256[] memory cortexBalances,
            address[] memory tokenWanted,
            uint256[] memory amountWanted
        )
    {
        ILockedCortexOffer[] memory activeOffers = getActiveOffersPruned(
            factory
        );
        uint256 offersLength = activeOffers.length;
        offerAddresses = new address[](offersLength);
        cortexBalances = new uint256[](offersLength);
        tokenWanted = new address[](offersLength);
        amountWanted = new uint256[](offersLength);
        for (uint256 i; i < activeOffers.length; i++) {
            cortexBalances[i] = CORTEX.totalBalanceOf(address(activeOffers[i]));
            offerAddresses[i] = address(activeOffers[i]);
            tokenWanted[i] = activeOffers[i].tokenWanted();
            amountWanted[i] = activeOffers[i].amountWanted();
        }
    }
}
