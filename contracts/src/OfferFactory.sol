// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LockedCortexOffer} from "./LockedCortexOffer.sol";

contract OfferFactory is Ownable {
    uint256 public fee = 250; // in bps
    LockedCortexOffer[] public offers;

    event OfferCreated(address offerAddress, address tokenWanted, uint256 amountWanted);

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    function createOffer(address _tokenWanted, uint256 _amountWanted) public returns (LockedCortexOffer) {
        LockedCortexOffer offer = new LockedCortexOffer(msg.sender, _tokenWanted, _amountWanted, fee);
        offers.push(offer);
        emit OfferCreated(address(offer), _tokenWanted, _amountWanted);
        return offer;
    }

    function getActiveOffersByOwner() public view returns (LockedCortexOffer[] memory, LockedCortexOffer[] memory) {
        LockedCortexOffer[] memory myBids = new LockedCortexOffer[](offers.length);
        LockedCortexOffer[] memory otherBids = new LockedCortexOffer[](offers.length);

        uint256 myBidsCount;
        uint256 otherBidsCount;
        for (uint256 i; i < offers.length; i++) {
            LockedCortexOffer offer = LockedCortexOffer(offers[i]);
            if (offer.hasCortex() && !offer.hasEnded()) {
                if (offer.seller() == msg.sender) {
                    myBids[myBidsCount++] = offers[i];
                } else {
                    otherBids[otherBidsCount++] = offers[i];
                }
            }
        }

        return (myBids, otherBids);
    }

    function getActiveOffers() public view returns (LockedCortexOffer[] memory) {
        LockedCortexOffer[] memory activeOffers = new LockedCortexOffer[](offers.length);
        uint256 count;
        for (uint256 i; i < offers.length; i++) {
            LockedCortexOffer offer = LockedCortexOffer(offers[i]);
            if (offer.hasCortex() && !offer.hasEnded()) {
                activeOffers[count++] = offer;
            }
        }

        return activeOffers;
    }

    function getActiveOffersByRange(uint256 start, uint256 end) public view returns (LockedCortexOffer[] memory) {
        LockedCortexOffer[] memory activeOffers = new LockedCortexOffer[](end - start);

        uint256 count;
        for (uint256 i = start; i < end; i++) {
            if (offers[i].hasCortex() && !offers[i].hasEnded()) {
                activeOffers[count++] = offers[i];
            }
        }

        return activeOffers;
    }
}
