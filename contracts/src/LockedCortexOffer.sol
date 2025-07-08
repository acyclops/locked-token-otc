// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import {IERC20, ICortexToken, IOwnable} from "./interfaces/Interfaces.sol";

contract LockedCortexOffer {
    address public immutable factory;
    address public immutable seller;
    address public immutable tokenWanted;
    uint256 public immutable amountWanted;
    uint256 public immutable fee; //bps
    bool public hasEnded = false;

    ICortexToken CORTEX = ICortexToken(0xb21Be1Caf592A5DC1e75e418704d1B6d50B0d083);

    event OfferFilled(address buyer, uint256 cortexAmount, address token, uint256 tokenAmount);
    event OfferCanceled(address seller, uint256 cortexAmount);

    constructor(
        address _seller,
        address _tokenWanted,
        uint256 _amountWanted,
        uint256 _fee
    ) {
        factory = msg.sender;
        seller = _seller;
        tokenWanted = _tokenWanted;
        amountWanted = _amountWanted;
        fee = _fee;
    }

    // release trapped funds
    function withdrawTokens(address token) public {
        require(msg.sender == seller);
        if (token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            payable(seller).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            safeTransfer(token, seller, balance);
        }
    }

    function fill() public {
        require(hasCortex(), "no CORTEX balance");
        require(!hasEnded, "sell has been previously cancelled");
        uint256 balance = CORTEX.totalBalanceOf(address(this));
        uint256 txFee = mulDiv(amountWanted, fee, 10_000);

        // cap fee at 25k
        uint256 maxFee = 25_000 * 10**IERC20(tokenWanted).decimals();
        txFee = txFee > maxFee ? maxFee : txFee;

        uint256 amountAfterFee = amountWanted - txFee;
        // collect fee
        safeTransferFrom(tokenWanted, msg.sender, IOwnable(factory).owner(), txFee);
        // exchange assets
        safeTransferFrom(tokenWanted, msg.sender, seller, amountAfterFee);
        CORTEX.transferAll(msg.sender);
        hasEnded = true;
        emit OfferFilled(msg.sender, balance, tokenWanted, amountWanted);
    }

    function cancel() public {
        require(hasCortex(), "no CORTEX balance");
        require(msg.sender == seller);
        uint256 balance = CORTEX.totalBalanceOf(address(this));
        CORTEX.transferAll(seller);
        hasEnded = true;
        emit OfferCanceled(seller, balance);
    }

    function hasCortex() public view returns (bool) {
        return CORTEX.totalBalanceOf(address(this)) > 0;
    }

    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 z
    ) public pure returns (uint256) {
        return (x * y) / z;
    }

    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "safeTransfer: failed");
    }

    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "safeTransferFrom: failed");
    }
}
