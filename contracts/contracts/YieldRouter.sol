// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title YieldRouter — Routes RBTC deposits to yield protocols on RSK
/// @notice Supports Tropykus, Sovryn and MoneyOnChain as deposit targets

// ──────────────────────────────────────────────
//  Minimal interfaces for each protocol
// ──────────────────────────────────────────────

/// Tropykus uses a cToken-style market: mint() with msg.value, redeem(amount)
interface ITropykus {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
}

/// Sovryn lending pool: deposit via mint(), withdraw via burn(amount)
interface ISovryn {
    function mint() external payable;
    function burn(uint256 amount) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
}

/// MoneyOnChain: simplified interface for RBTC-backed position
interface IMoneyOnChain {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address owner) external view returns (uint256);
}

contract YieldRouter {
    // ── Types ────────────────────────────────
    enum Protocol { Tropykus, Sovryn, MoneyOnChain }

    struct Position {
        Protocol protocol;
        uint256 shares;    // protocol-specific share/token amount
        uint256 deposited; // original RBTC deposited (for reference)
        bool active;
    }

    // ── State ────────────────────────────────
    address public owner;

    address public tropykus;
    address public sovryn;
    address public moneyOnChain;

    /// user → positionId → Position
    mapping(address => mapping(uint256 => Position)) public positions;
    /// user → next position id
    mapping(address => uint256) public positionCount;

    // ── Events ───────────────────────────────
    event Deposited(address indexed user, uint256 indexed positionId, Protocol protocol, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 indexed positionId, uint256 shares);
    event ProtocolUpdated(Protocol protocol, address addr);
    event OwnerTransferred(address indexed prev, address indexed next);

    // ── Modifiers ────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "YieldRouter: not owner");
        _;
    }

    // ── Constructor ──────────────────────────
    constructor(address _tropykus, address _sovryn, address _moneyOnChain) {
        require(_tropykus  != address(0), "YieldRouter: zero tropykus");
        require(_sovryn    != address(0), "YieldRouter: zero sovryn");
        require(_moneyOnChain != address(0), "YieldRouter: zero moc");

        owner        = msg.sender;
        tropykus     = _tropykus;
        sovryn       = _sovryn;
        moneyOnChain = _moneyOnChain;
    }

    // ── Core: Deposit ────────────────────────
    /// @notice Deposit RBTC into the chosen protocol
    /// @param protocol The target protocol (0 = Tropykus, 1 = Sovryn, 2 = MoneyOnChain)
    /// @return positionId The id of the newly created position
    function deposit(Protocol protocol) external payable returns (uint256 positionId) {
        require(msg.value > 0, "YieldRouter: zero value");

        uint256 sharesBefore;
        uint256 sharesAfter;

        if (protocol == Protocol.Tropykus) {
            sharesBefore = ITropykus(tropykus).balanceOf(address(this));
            ITropykus(tropykus).mint{value: msg.value}();
            sharesAfter = ITropykus(tropykus).balanceOf(address(this));

        } else if (protocol == Protocol.Sovryn) {
            sharesBefore = ISovryn(sovryn).balanceOf(address(this));
            ISovryn(sovryn).mint{value: msg.value}();
            sharesAfter = ISovryn(sovryn).balanceOf(address(this));

        } else {
            sharesBefore = IMoneyOnChain(moneyOnChain).balanceOf(address(this));
            IMoneyOnChain(moneyOnChain).deposit{value: msg.value}();
            sharesAfter = IMoneyOnChain(moneyOnChain).balanceOf(address(this));
        }

        uint256 shares = sharesAfter - sharesBefore;
        require(shares > 0, "YieldRouter: no shares minted");

        positionId = positionCount[msg.sender];
        positions[msg.sender][positionId] = Position({
            protocol: protocol,
            shares: shares,
            deposited: msg.value,
            active: true
        });
        positionCount[msg.sender] = positionId + 1;

        emit Deposited(msg.sender, positionId, protocol, msg.value, shares);
    }

    // ── Core: Withdraw ───────────────────────
    /// @notice Withdraw a position — redeems shares and sends RBTC back to the user
    /// @param positionId The position to close
    function withdraw(uint256 positionId) external {
        Position storage pos = positions[msg.sender][positionId];
        require(pos.active, "YieldRouter: not active");

        uint256 shares = pos.shares;
        pos.active = false;
        pos.shares = 0;

        uint256 balBefore = address(this).balance;

        if (pos.protocol == Protocol.Tropykus) {
            ITropykus(tropykus).redeem(shares);

        } else if (pos.protocol == Protocol.Sovryn) {
            ISovryn(sovryn).burn(shares);

        } else {
            IMoneyOnChain(moneyOnChain).withdraw(shares);
        }

        uint256 received = address(this).balance - balBefore;
        require(received > 0, "YieldRouter: nothing received");

        (bool ok, ) = msg.sender.call{value: received}("");
        require(ok, "YieldRouter: transfer failed");

        emit Withdrawn(msg.sender, positionId, shares);
    }

    // ── Views ────────────────────────────────
    /// @notice Get a user's position details
    function getPosition(address user, uint256 positionId)
        external
        view
        returns (Protocol protocol, uint256 shares, uint256 deposited, bool active)
    {
        Position storage pos = positions[user][positionId];
        return (pos.protocol, pos.shares, pos.deposited, pos.active);
    }

    // ── Admin ────────────────────────────────
    function setProtocol(Protocol protocol, address addr) external onlyOwner {
        require(addr != address(0), "YieldRouter: zero address");
        if (protocol == Protocol.Tropykus)       tropykus = addr;
        else if (protocol == Protocol.Sovryn)    sovryn = addr;
        else                                     moneyOnChain = addr;
        emit ProtocolUpdated(protocol, addr);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "YieldRouter: zero address");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Accept RBTC from protocol redemptions
    receive() external payable {}
}
