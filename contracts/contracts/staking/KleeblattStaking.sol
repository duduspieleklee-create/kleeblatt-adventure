// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IKleeblattToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title KleeblattStaking
 * @notice Stake KLT to earn rewards at a configurable linear rate.
 *
 * Reward model:
 *   earned(user) = position.staked * rewardRatePerSecond * secondsElapsed / 1e18
 *
 * The contract mints reward tokens (caller must be added as a minter on KLT,
 * or a pre-funded reward pool is used). If the contract holds KLT it transfers
 * from its own balance; otherwise it mints.  Using a funded pool is recommended
 * for testnet — fund via `fundRewards(amount)`.
 */
contract KleeblattStaking is Ownable, Pausable {
    // ─── Types ────────────────────────────────────────────────────────────────

    struct Position {
        uint256 staked;
        uint256 pendingRewards; // accumulated before last update
        uint256 lastUpdateTime;
    }

    struct PoolInfo {
        uint256 totalStaked;
        uint256 rewardRatePerSecond; // wei per wei staked per second (scaled 1e18)
        uint256 rewardPool;          // pre-funded KLT available for payouts
    }

    // ─── State ────────────────────────────────────────────────────────────────

    IKleeblattToken public immutable klt;
    uint256 public rewardRatePerSecond;

    uint256 public totalStaked;
    uint256 public rewardPool;
    uint256 public totalStakers;

    mapping(address => Position) private _positions;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardPoolFunded(address indexed funder, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address kltToken, uint256 _rewardRatePerSecond) Ownable(msg.sender) {
        require(kltToken != address(0), "KLT address required");
        klt = IKleeblattToken(kltToken);
        rewardRatePerSecond = _rewardRatePerSecond;
    }

    // ─── Public write ─────────────────────────────────────────────────────────

    /**
     * @notice Stake `amount` KLT. Caller must have approved this contract first.
     */
    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        _settle(msg.sender);

        if (_positions[msg.sender].staked == 0) {
            totalStakers += 1;
        }

        klt.transferFrom(msg.sender, address(this), amount);
        _positions[msg.sender].staked += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake `amount` KLT. Automatically claims pending rewards first.
     */
    function unstake(uint256 amount) external whenNotPaused {
        Position storage pos = _positions[msg.sender];
        require(amount > 0, "Cannot unstake 0");
        require(pos.staked >= amount, "Insufficient staked balance");

        _settle(msg.sender);
        _claimRewards(msg.sender);

        pos.staked -= amount;
        totalStaked -= amount;

        if (pos.staked == 0) {
            totalStakers -= 1;
        }

        klt.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim all pending rewards without unstaking.
     */
    function claim() external whenNotPaused {
        _settle(msg.sender);
        _claimRewards(msg.sender);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /**
     * @notice Returns pending (claimable) reward amount for `user`.
     */
    function earned(address user) external view returns (uint256) {
        return _pendingRewards(user);
    }

    /**
     * @notice Pool-level statistics for the UI.
     * @return _totalStaked  Total KLT staked across all users.
     * @return _rewardRate   Current reward rate per second (1e18-scaled per KLT per second).
     * @return apr           Annualised percentage rate in basis points (1 bp = 0.01%).
     */
    function getPool()
        external
        view
        returns (
            uint256 _totalStaked,
            uint256 _rewardRate,
            uint256 apr
        )
    {
        _totalStaked = totalStaked;
        _rewardRate = rewardRatePerSecond;
        // APR in basis points: rewardRatePerSecond * 365 days * 10000 / 1e18
        // (represents % * 100, so 1000 = 10.00%)
        apr = (rewardRatePerSecond * 365 days * 10_000) / 1e18;
    }

    /**
     * @notice Per-user position for the UI.
     * @return staked    KLT currently staked by `user`.
     * @return _earned   Pending rewards.
     * @return stakedAt  Timestamp of the last stake/settle interaction.
     */
    function getPosition(address user)
        external
        view
        returns (
            uint256 staked,
            uint256 _earned,
            uint256 stakedAt
        )
    {
        Position storage pos = _positions[user];
        staked = pos.staked;
        _earned = _pendingRewards(user);
        stakedAt = pos.lastUpdateTime;
    }

    // ─── Owner ────────────────────────────────────────────────────────────────

    /**
     * @notice Update the reward rate per second (1e18-scaled per KLT per second).
     * @dev Settles all users are NOT auto-settled — only the rate going forward changes.
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        emit RewardRateUpdated(rewardRatePerSecond, newRate);
        rewardRatePerSecond = newRate;
    }

    /**
     * @notice Pre-fund the reward pool. Caller must have approved `amount` KLT.
     */
    function fundRewards(uint256 amount) external {
        require(amount > 0, "Cannot fund 0");
        klt.transferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardPoolFunded(msg.sender, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _pendingRewards(address user) internal view returns (uint256) {
        Position storage pos = _positions[user];
        if (pos.staked == 0 || pos.lastUpdateTime == 0) {
            return pos.pendingRewards;
        }
        uint256 elapsed = block.timestamp - pos.lastUpdateTime;
        uint256 accrued = (pos.staked * rewardRatePerSecond * elapsed) / 1e18;
        return pos.pendingRewards + accrued;
    }

    function _settle(address user) internal {
        Position storage pos = _positions[user];
        pos.pendingRewards = _pendingRewards(user);
        pos.lastUpdateTime = block.timestamp;
    }

    function _claimRewards(address user) internal {
        Position storage pos = _positions[user];
        uint256 reward = pos.pendingRewards;
        if (reward == 0) return;

        pos.pendingRewards = 0;

        // Pay from funded pool first; fall back to minting if authorised.
        if (rewardPool >= reward) {
            rewardPool -= reward;
            klt.transfer(user, reward);
        } else {
            // Drain pool then mint the remainder.
            uint256 fromPool = rewardPool;
            uint256 toMint = reward - fromPool;
            rewardPool = 0;
            if (fromPool > 0) klt.transfer(user, fromPool);
            klt.mint(user, toMint);
        }

        emit RewardsClaimed(user, reward);
    }
}
