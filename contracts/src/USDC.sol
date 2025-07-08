import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract USDC is ERC20 {
    constructor(uint256 initial) ERC20("CUM", "CUM") {
        _mint(msg.sender, initial);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function mintMe() public {
        _mint(msg.sender, 1000e6);
    }
}