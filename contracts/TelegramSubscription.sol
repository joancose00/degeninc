// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TelegramSubscription is Ownable, ReentrancyGuard {
    // USDC token contract interface
    IERC20 public immutable usdc;
    
    // Subscription fee (default 30 USDC, changeable by owner)
    uint256 public subscriptionFee = 30 * 10**6; // USDC has 6 decimals
    uint256 public constant SUBSCRIPTION_DURATION = 30 days;
    uint256 public constant GRACE_PERIOD = 7 days; // Grace period for expired subscriptions
    
    struct Subscription {
        string telegramUsername;
        uint256 expiresAt;
        uint256 totalPaid;
        uint256 subscriptionCount;
    }
    
    // User address to subscription mapping
    mapping(address => Subscription) public subscriptions;
    
    // Array to track all subscriber addresses
    address[] public subscribers;
    mapping(address => bool) public hasSubscribed;
    
    // Discount system - maps telegram username hash to discount price (gas efficient)
    mapping(bytes32 => uint256) public discountsByHash;
    // Optional: Keep string mapping for UI queries
    mapping(string => uint256) public discounts;
    // Array to track all usernames with discounts
    string[] public discountedUsernames;
    mapping(string => bool) public hasDiscount;
    
    // Contributors management
    mapping(address => bool) public contributors;
    address[] public contributorList;
    uint256 public totalContributors;
    
    // Total collected fees
    uint256 public totalCollected;
    
    // Events
    event SubscriptionCreated(address indexed user, string telegramUsername, uint256 expiresAt);
    event SubscriptionRenewed(address indexed user, uint256 newExpiresAt);
    event ContributorAdded(address indexed contributor);
    event ContributorRemoved(address indexed contributor);
    event FundsDistributed(uint256 amount, uint256 contributorsCount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event SubscriptionFeeUpdated(uint256 oldFee, uint256 newFee);
    event DiscountSet(string telegramUsername, uint256 discountPrice);
    event DiscountRemoved(string telegramUsername);
    
    // Modifiers
    modifier onlyContributor() {
        require(contributors[msg.sender], "Not a contributor");
        _;
    }
    
    constructor(address _usdcAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdc = IERC20(_usdcAddress);
    }
    
    /**
     * @dev Subscribe or renew subscription
     * @param _telegramUsername Telegram username for the subscription
     */
    function subscribe(string memory _telegramUsername) external nonReentrant {
        require(bytes(_telegramUsername).length > 0, "Invalid telegram username");
        
        // Determine the fee to charge (check for discount first using hash for gas efficiency)
        bytes32 usernameHash = keccak256(bytes(_telegramUsername));
        uint256 feeToCharge = subscriptionFee;
        if (discountsByHash[usernameHash] > 0) {
            feeToCharge = discountsByHash[usernameHash];
        }
        
        // Transfer USDC from user to contract
        require(
            usdc.transferFrom(msg.sender, address(this), feeToCharge),
            "USDC transfer failed"
        );
        
        Subscription storage sub = subscriptions[msg.sender];
        
        // First time subscriber
        if (!hasSubscribed[msg.sender]) {
            subscribers.push(msg.sender);
            hasSubscribed[msg.sender] = true;
        }
        
        // Update subscription
        sub.telegramUsername = _telegramUsername;
        sub.totalPaid += feeToCharge;
        sub.subscriptionCount += 1;
        
        // Calculate new expiration
        uint256 currentExpiry = sub.expiresAt > block.timestamp ? sub.expiresAt : block.timestamp;
        sub.expiresAt = currentExpiry + SUBSCRIPTION_DURATION;
        
        totalCollected += feeToCharge;
        
        emit SubscriptionCreated(msg.sender, _telegramUsername, sub.expiresAt);
    }
    
    /**
     * @dev Renew existing subscription (keeps same telegram username)
     */
    function renew() external nonReentrant {
        require(hasSubscribed[msg.sender], "No existing subscription");
        
        Subscription storage sub = subscriptions[msg.sender];
        
        // Check if subscription is within grace period
        if (sub.expiresAt < block.timestamp) {
            require(
                block.timestamp <= sub.expiresAt + GRACE_PERIOD,
                "Subscription expired beyond grace period"
            );
        }
        
        // Determine the fee to charge (check for discount first using hash)
        bytes32 usernameHash = keccak256(bytes(sub.telegramUsername));
        uint256 feeToCharge = subscriptionFee;
        if (discountsByHash[usernameHash] > 0) {
            feeToCharge = discountsByHash[usernameHash];
        }
        
        // Transfer USDC from user to contract
        require(
            usdc.transferFrom(msg.sender, address(this), feeToCharge),
            "USDC transfer failed"
        );
        
        sub.totalPaid += feeToCharge;
        sub.subscriptionCount += 1;
        
        // Calculate new expiration
        uint256 currentExpiry = sub.expiresAt > block.timestamp ? sub.expiresAt : block.timestamp;
        sub.expiresAt = currentExpiry + SUBSCRIPTION_DURATION;
        
        totalCollected += feeToCharge;
        
        emit SubscriptionRenewed(msg.sender, sub.expiresAt);
    }
    
    /**
     * @dev Check if a subscription is active
     */
    function isActive(address _user) public view returns (bool) {
        return subscriptions[_user].expiresAt > block.timestamp;
    }
    
    /**
     * @dev Get paginated active subscriptions
     * @param offset Starting index
     * @param limit Maximum number of subscriptions to return
     */
    function getActiveSubscriptions(uint256 offset, uint256 limit) external view returns (address[] memory, Subscription[] memory, uint256) {
        // Count active subscriptions first
        uint256 activeCount = 0;
        for (uint256 i = 0; i < subscribers.length; i++) {
            if (isActive(subscribers[i])) {
                activeCount++;
            }
        }
        
        if (offset >= activeCount) {
            return (new address[](0), new Subscription[](0), activeCount);
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > activeCount) {
            actualLimit = activeCount - offset;
        }
        
        // Create arrays for active subscriptions
        address[] memory activeUsers = new address[](actualLimit);
        Subscription[] memory activeSubs = new Subscription[](actualLimit);
        
        uint256 currentActiveIndex = 0;
        uint256 outputIndex = 0;
        
        for (uint256 i = 0; i < subscribers.length && outputIndex < actualLimit; i++) {
            if (isActive(subscribers[i])) {
                if (currentActiveIndex >= offset) {
                    activeUsers[outputIndex] = subscribers[i];
                    activeSubs[outputIndex] = subscriptions[subscribers[i]];
                    outputIndex++;
                }
                currentActiveIndex++;
            }
        }
        
        return (activeUsers, activeSubs, activeCount);
    }
    
    /**
     * @dev Get paginated inactive subscriptions
     * @param offset Starting index
     * @param limit Maximum number of subscriptions to return
     */
    function getInactiveSubscriptions(uint256 offset, uint256 limit) external view returns (address[] memory, Subscription[] memory, uint256) {
        // Count inactive subscriptions first
        uint256 inactiveCount = 0;
        for (uint256 i = 0; i < subscribers.length; i++) {
            if (!isActive(subscribers[i])) {
                inactiveCount++;
            }
        }
        
        if (offset >= inactiveCount) {
            return (new address[](0), new Subscription[](0), inactiveCount);
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > inactiveCount) {
            actualLimit = inactiveCount - offset;
        }
        
        // Create arrays for inactive subscriptions
        address[] memory inactiveUsers = new address[](actualLimit);
        Subscription[] memory inactiveSubs = new Subscription[](actualLimit);
        
        uint256 currentInactiveIndex = 0;
        uint256 outputIndex = 0;
        
        for (uint256 i = 0; i < subscribers.length && outputIndex < actualLimit; i++) {
            if (!isActive(subscribers[i])) {
                if (currentInactiveIndex >= offset) {
                    inactiveUsers[outputIndex] = subscribers[i];
                    inactiveSubs[outputIndex] = subscriptions[subscribers[i]];
                    outputIndex++;
                }
                currentInactiveIndex++;
            }
        }
        
        return (inactiveUsers, inactiveSubs, inactiveCount);
    }
    
    /**
     * @dev Get all subscribers with pagination (regardless of status)
     * @param offset Starting index
     * @param limit Maximum number of subscribers to return
     */
    function getAllSubscribers(uint256 offset, uint256 limit) external view returns (address[] memory, Subscription[] memory, uint256) {
        uint256 totalCount = subscribers.length;
        
        if (offset >= totalCount) {
            return (new address[](0), new Subscription[](0), totalCount);
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > totalCount) {
            actualLimit = totalCount - offset;
        }
        
        // Create arrays for subscribers
        address[] memory resultUsers = new address[](actualLimit);
        Subscription[] memory resultSubs = new Subscription[](actualLimit);
        
        for (uint256 i = 0; i < actualLimit; i++) {
            address user = subscribers[offset + i];
            resultUsers[i] = user;
            resultSubs[i] = subscriptions[user];
        }
        
        return (resultUsers, resultSubs, totalCount);
    }
    
    /**
     * @dev Add a contributor (only owner)
     */
    function addContributor(address _contributor) external onlyOwner {
        require(_contributor != address(0), "Invalid address");
        require(!contributors[_contributor], "Already a contributor");
        
        contributors[_contributor] = true;
        contributorList.push(_contributor);
        totalContributors++;
        
        emit ContributorAdded(_contributor);
    }
    
    /**
     * @dev Remove a contributor (only owner)
     */
    function removeContributor(address _contributor) external onlyOwner {
        require(contributors[_contributor], "Not a contributor");
        
        contributors[_contributor] = false;
        totalContributors--;
        
        // Remove from contributor list
        for (uint256 i = 0; i < contributorList.length; i++) {
            if (contributorList[i] == _contributor) {
                contributorList[i] = contributorList[contributorList.length - 1];
                contributorList.pop();
                break;
            }
        }
        
        emit ContributorRemoved(_contributor);
    }
    
    /**
     * @dev Distribute funds equally among contributors with pagination (only owner)
     * @param offset Starting index
     * @param limit Maximum number of contributors to distribute to
     */
    function distributeFunds(uint256 offset, uint256 limit) external onlyOwner nonReentrant {
        require(totalContributors > 0, "No contributors");
        
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No funds to distribute");
        
        uint256 amountPerContributor = balance / totalContributors;
        require(amountPerContributor > 0, "Amount too small to distribute");
        
        if (offset >= totalContributors) {
            return;
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > totalContributors) {
            actualLimit = totalContributors - offset;
        }
        
        uint256 totalDistributed = 0;
        uint256 currentActiveIndex = 0;
        uint256 distributed = 0;
        
        for (uint256 i = 0; i < contributorList.length && distributed < actualLimit; i++) {
            if (contributors[contributorList[i]]) {
                if (currentActiveIndex >= offset) {
                    require(
                        usdc.transfer(contributorList[i], amountPerContributor),
                        "Transfer failed"
                    );
                    totalDistributed += amountPerContributor;
                    distributed++;
                }
                currentActiveIndex++;
            }
        }
        
        emit FundsDistributed(totalDistributed, distributed);
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw(address _to) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        
        require(usdc.transfer(_to, balance), "Transfer failed");
        
        emit FundsWithdrawn(_to, balance);
    }
    
    /**
     * @dev Withdraw specific amount of funds (only owner)
     * @param _to Address to withdraw to
     * @param _amount Amount to withdraw in USDC (with 6 decimals)
     */
    function withdraw(address _to, uint256 _amount) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 balance = usdc.balanceOf(address(this));
        require(balance >= _amount, "Insufficient funds");
        
        require(usdc.transfer(_to, _amount), "Transfer failed");
        
        emit FundsWithdrawn(_to, _amount);
    }
    
    /**
     * @dev Get subscription info for a user
     */
    function getSubscription(address _user) external view returns (Subscription memory) {
        return subscriptions[_user];
    }
    
    /**
     * @dev Get paginated contributors
     * @param offset Starting index
     * @param limit Maximum number of contributors to return
     */
    function getContributors(uint256 offset, uint256 limit) external view returns (address[] memory, uint256) {
        if (offset >= totalContributors) {
            return (new address[](0), totalContributors);
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > totalContributors) {
            actualLimit = totalContributors - offset;
        }
        
        address[] memory activeContributors = new address[](actualLimit);
        uint256 currentActiveIndex = 0;
        uint256 outputIndex = 0;
        
        for (uint256 i = 0; i < contributorList.length && outputIndex < actualLimit; i++) {
            if (contributors[contributorList[i]]) {
                if (currentActiveIndex >= offset) {
                    activeContributors[outputIndex] = contributorList[i];
                    outputIndex++;
                }
                currentActiveIndex++;
            }
        }
        
        return (activeContributors, totalContributors);
    }
    
    /**
     * @dev Get total number of subscribers
     */
    function getTotalSubscribers() external view returns (uint256) {
        return subscribers.length;
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
    
    /**
     * @dev Update subscription fee (only owner)
     * @param _newFee New subscription fee in USDC (with 6 decimals)
     */
    function updateSubscriptionFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0, "Fee must be greater than 0");
        
        uint256 oldFee = subscriptionFee;
        subscriptionFee = _newFee;
        
        emit SubscriptionFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev Set a discount for a specific telegram username (only owner)
     * @param _telegramUsername Telegram username to apply discount to
     * @param _discountPrice Discounted price in USDC (with 6 decimals)
     */
    function setDiscount(string memory _telegramUsername, uint256 _discountPrice) external onlyOwner {
        require(bytes(_telegramUsername).length > 0, "Invalid telegram username");
        require(_discountPrice > 0, "Discount price must be greater than 0");
        require(_discountPrice < subscriptionFee, "Discount must be less than regular fee");
        
        bytes32 usernameHash = keccak256(bytes(_telegramUsername));
        discountsByHash[usernameHash] = _discountPrice;
        discounts[_telegramUsername] = _discountPrice; // Keep for UI queries
        
        // Track username if not already tracked
        if (!hasDiscount[_telegramUsername]) {
            discountedUsernames.push(_telegramUsername);
            hasDiscount[_telegramUsername] = true;
        }
        
        emit DiscountSet(_telegramUsername, _discountPrice);
    }
    
    /**
     * @dev Remove a discount for a specific telegram username (only owner)
     * @param _telegramUsername Telegram username to remove discount from
     */
    function removeDiscount(string memory _telegramUsername) external onlyOwner {
        require(bytes(_telegramUsername).length > 0, "Invalid telegram username");
        require(discounts[_telegramUsername] > 0, "No discount exists for this username");
        
        bytes32 usernameHash = keccak256(bytes(_telegramUsername));
        delete discountsByHash[usernameHash];
        delete discounts[_telegramUsername];
        delete hasDiscount[_telegramUsername];
        
        // Remove from array (find and swap with last element)
        for (uint256 i = 0; i < discountedUsernames.length; i++) {
            if (keccak256(bytes(discountedUsernames[i])) == keccak256(bytes(_telegramUsername))) {
                discountedUsernames[i] = discountedUsernames[discountedUsernames.length - 1];
                discountedUsernames.pop();
                break;
            }
        }
        
        emit DiscountRemoved(_telegramUsername);
    }
    
    /**
     * @dev Get the effective subscription fee for a telegram username
     * @param _telegramUsername Telegram username to check
     * @return The fee that would be charged for this username
     */
    function getEffectiveFee(string memory _telegramUsername) external view returns (uint256) {
        bytes32 usernameHash = keccak256(bytes(_telegramUsername));
        if (discountsByHash[usernameHash] > 0) {
            return discountsByHash[usernameHash];
        }
        return subscriptionFee;
    }
    
    /**
     * @dev Check if a subscription is within the grace period
     * @param _user User address to check
     * @return bool True if within grace period, false otherwise
     */
    function isInGracePeriod(address _user) public view returns (bool) {
        uint256 expiresAt = subscriptions[_user].expiresAt;
        if (expiresAt == 0) return false; // No subscription
        if (expiresAt >= block.timestamp) return false; // Still active
        return block.timestamp <= expiresAt + GRACE_PERIOD;
    }
    
    /**
     * @dev Get all active discounts with pagination
     * @param offset Starting index
     * @param limit Maximum number of discounts to return
     * @return usernames Array of usernames with discounts
     * @return prices Array of discount prices
     * @return total Total number of active discounts
     */
    function getAllDiscounts(uint256 offset, uint256 limit) external view returns (
        string[] memory usernames,
        uint256[] memory prices,
        uint256 total
    ) {
        total = discountedUsernames.length;
        
        if (offset >= total) {
            return (new string[](0), new uint256[](0), total);
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > total) {
            actualLimit = total - offset;
        }
        
        usernames = new string[](actualLimit);
        prices = new uint256[](actualLimit);
        
        for (uint256 i = 0; i < actualLimit; i++) {
            string memory username = discountedUsernames[offset + i];
            usernames[i] = username;
            prices[i] = discounts[username];
        }
        
        return (usernames, prices, total);
    }
    
    /**
     * @dev Get total number of active discounts
     * @return The number of active discounts
     */
    function getTotalDiscounts() external view returns (uint256) {
        return discountedUsernames.length;
    }
}