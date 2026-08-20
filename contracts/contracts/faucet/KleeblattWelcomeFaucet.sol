// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IKleeblattToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title KleeblattWelcomeFaucet
 * @notice Sends exactly 100 KLT once to any registered game wallet.
 *
 * Design constraints:
 *  - Only a single whitelisted `gameCaller` address (the game server's dev wallet)
 *    may call `claimFor`. This means gas is paid by the server — zero cost to the player.
 *  - Each recipient address can only ever receive the welcome bonus once, enforced
 *    on-chain via `claimed` mapping. A second call reverts.
 *  - The faucet mints tokens directly via KLT's minter role (must be granted at deploy).
 *  - Owner can rotate `gameCaller` and can pause via `setActive`.
 */
contract KleeblattWelcomeFaucet is Ownable {
    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant BONUS_AMOUNT = 100 * 10 ** 18; // 100 KLT

    // ─── State ────────────────────────────────────────────────────────────────

    IKleeblattToken public immutable klt;

    /// @notice The authorised game-server address that may call claimFor().
    address public gameCaller;

    /// @notice Whether the faucet is accepting new claims.
    bool public active = true;

    /// @notice Tracks whether an address has already received the welcome bonus.
    mapping(address => bool) public claimed;

    // ─── Events ───────────────────────────────────────────────────────────────

    event WelcomeBonusClaimed(address indexed recipient);
    event GameCallerUpdated(address indexed oldCaller, address indexed newCaller);
    event ActiveChanged(bool active);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address kltToken, address _gameCaller) Ownable(msg.sender) {
        require(kltToken != address(0), "KLT address required");
        require(_gameCaller != address(0), "gameCaller required");
        klt = IKleeblattToken(kltToken);
        gameCaller = _gameCaller;
    }

    // ─── Core ─────────────────────────────────────────────────────────────────

    /**
     * @notice Mint 100 KLT to `recipient` as a one-time welcome bonus.
     * @dev Only callable by `gameCaller` (the game server). Gas is paid by
     *      the server so the player needs no ETH/IMX in their wallet.
     *      Reverts if `recipient` has already claimed.
     */
    function claimFor(address recipient) external {
        require(msg.sender == gameCaller, "Not authorised");
        require(active, "Faucet is paused");
        require(recipient != address(0), "Zero address");
        require(!claimed[recipient], "Already claimed");

        claimed[recipient] = true;
        klt.mint(recipient, BONUS_AMOUNT);

        emit WelcomeBonusClaimed(recipient);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /// @notice Returns true if `recipient` has not yet received the bonus.
    function canClaim(address recipient) external view returns (bool) {
        return active && !claimed[recipient];
    }

    // ─── Owner ────────────────────────────────────────────────────────────────

    function setGameCaller(address newCaller) external onlyOwner {
        require(newCaller != address(0), "Zero address");
        emit GameCallerUpdated(gameCaller, newCaller);
        gameCaller = newCaller;
    }

    function setActive(bool _active) external onlyOwner {
        active = _active;
        emit ActiveChanged(_active);
    }
}
