// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ETH Bridge Contract (Simplified for Testing)
 * @notice Handles deposits and withdrawals between Ethereum and Polkadot Substrate
 * @dev Contract holds ETH directly for easy withdrawals
 */
contract ETHBridge {
    // State variables
    address public owner;
    uint256 public depositNonce;
    uint256 public withdrawalNonce;
    
    // Withdrawal request status
    enum WithdrawalStatus { Pending, Completed, Cancelled }
    
    // Withdrawal request structure
    struct WithdrawalRequest {
        address ethRecipient;
        uint256 amount;
        string polkadotSender;
        uint256 timestamp;
        WithdrawalStatus status;
        string txHash;
    }
    
    // Mappings
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => uint256[]) public userWithdrawals;
    
    // Events
    event DepositReceived(
        address indexed ethSender,
        string polkadotRecipient,
        address indexed token,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp,
        string extraData
    );
    
    event WithdrawalRequested(
        uint256 indexed withdrawalId,
        address indexed ethRecipient,
        string polkadotSender,
        uint256 amount,
        uint256 timestamp
    );
    
    event WithdrawalCompleted(
        uint256 indexed withdrawalId,
        address indexed ethRecipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event WithdrawalCancelled(
        uint256 indexed withdrawalId,
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address: zero address");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        depositNonce = 0;
        withdrawalNonce = 0;
    }

    /**
     * @notice Deposit ETH to bridge (kept in contract)
     * @param polkadotRecipient The Polkadot address to receive minted tokens
     * @param extraData Optional metadata for the deposit
     */
    function depositETH(
        string memory polkadotRecipient,
        string memory extraData
    ) external payable {
        require(msg.value > 0, "Must send ETH");
        require(bytes(polkadotRecipient).length > 0, "Polkadot recipient required");
        
        // ETH stays in contract - no transfer needed
        
        // Emit deposit event
        emit DepositReceived(
            msg.sender,
            polkadotRecipient,
            address(0), // ETH represented as address(0)
            msg.value,
            depositNonce,
            block.timestamp,
            extraData
        );
        
        depositNonce++;
    }

    /**
     * @notice Process withdrawal - creates request and immediately sends ETH
     * @param ethRecipient The Ethereum address to receive ETH
     * @param amount The amount of ETH to withdraw (in wei)
     * @param polkadotSender The Polkadot address initiating the withdrawal
     * @param polkadotTxHash The Polkadot transaction hash showing the burn
     */
    function processWithdrawal(
        address ethRecipient,
        uint256 amount,
        string memory polkadotSender,
        string memory polkadotTxHash
    ) external onlyOwner validAddress(ethRecipient) returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(polkadotSender).length > 0, "Polkadot sender required");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        // Create withdrawal request
        WithdrawalRequest memory newRequest = WithdrawalRequest({
            ethRecipient: ethRecipient,
            amount: amount,
            polkadotSender: polkadotSender,
            timestamp: block.timestamp,
            status: WithdrawalStatus.Completed, // Immediately mark as completed
            txHash: polkadotTxHash
        });
        
        uint256 currentWithdrawalId = withdrawalNonce;
        withdrawalRequests[currentWithdrawalId] = newRequest;
        userWithdrawals[ethRecipient].push(currentWithdrawalId);
        
        emit WithdrawalRequested(
            currentWithdrawalId,
            ethRecipient,
            polkadotSender,
            amount,
            block.timestamp
        );
        
        withdrawalNonce++;
        
        // Transfer ETH immediately
        (bool success, ) = ethRecipient.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit WithdrawalCompleted(
            currentWithdrawalId,
            ethRecipient,
            amount,
            block.timestamp
        );
        
        return currentWithdrawalId;
    }

    /**
     * @notice Legacy function - Request withdrawal (kept for compatibility)
     */
    function requestWithdrawal(
        address ethRecipient,
        uint256 amount,
        string memory polkadotSender,
        string memory polkadotTxHash
    ) external onlyOwner validAddress(ethRecipient) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(polkadotSender).length > 0, "Polkadot sender required");
        
        WithdrawalRequest memory newRequest = WithdrawalRequest({
            ethRecipient: ethRecipient,
            amount: amount,
            polkadotSender: polkadotSender,
            timestamp: block.timestamp,
            status: WithdrawalStatus.Pending,
            txHash: polkadotTxHash
        });
        
        withdrawalRequests[withdrawalNonce] = newRequest;
        userWithdrawals[ethRecipient].push(withdrawalNonce);
        
        emit WithdrawalRequested(
            withdrawalNonce,
            ethRecipient,
            polkadotSender,
            amount,
            block.timestamp
        );
        
        withdrawalNonce++;
    }

    /**
     * @notice Complete a withdrawal request
     */
    function completeWithdrawal(uint256 withdrawalId) external onlyOwner {
        WithdrawalRequest storage request = withdrawalRequests[withdrawalId];
        
        require(request.status == WithdrawalStatus.Pending, "Withdrawal not pending");
        require(address(this).balance >= request.amount, "Insufficient balance");
        
        request.status = WithdrawalStatus.Completed;
        
        (bool success, ) = request.ethRecipient.call{value: request.amount}("");
        require(success, "ETH transfer failed");
        
        emit WithdrawalCompleted(
            withdrawalId,
            request.ethRecipient,
            request.amount,
            block.timestamp
        );
    }

    /**
     * @notice Cancel a pending withdrawal request
     */
    function cancelWithdrawal(uint256 withdrawalId) external onlyOwner {
        WithdrawalRequest storage request = withdrawalRequests[withdrawalId];
        require(request.status == WithdrawalStatus.Pending, "Withdrawal not pending");
        
        request.status = WithdrawalStatus.Cancelled;
        emit WithdrawalCancelled(withdrawalId, block.timestamp);
    }

    /**
     * @notice Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) 
        external 
        onlyOwner 
        validAddress(newOwner) 
    {
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Emergency withdrawal to owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    /**
     * @notice Get user's withdrawal history
     */
    function getUserWithdrawals(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userWithdrawals[user];
    }

    /**
     * @notice Get withdrawal request details
     */
    function getWithdrawalRequest(uint256 withdrawalId) 
        external 
        view 
        returns (
            address ethRecipient,
            uint256 amount,
            string memory polkadotSender,
            uint256 timestamp,
            WithdrawalStatus status,
            string memory txHash
        ) 
    {
        WithdrawalRequest memory request = withdrawalRequests[withdrawalId];
        return (
            request.ethRecipient,
            request.amount,
            request.polkadotSender,
            request.timestamp,
            request.status,
            request.txHash
        );
    }

    /**
     * @notice Get contract ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Legacy custodyWallet function (returns contract address)
     */
    function custodyWallet() external view returns (address) {
        return address(this);
    }

    /**
     * @notice Receive ETH directly
     */
    receive() external payable {
        // Allow contract to receive ETH
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Invalid function call");
    }
}