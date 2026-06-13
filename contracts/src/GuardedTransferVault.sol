// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GuardedTransferVault is ReentrancyGuard {
    uint64 public constant MAX_DELAY = 7 days;

    struct Intent {
        address owner;
        address recipient;
        uint128 amount;
        uint64 executeAfter;
        bool cancelled;
        bool executed;
    }

    uint256 private nonce;
    mapping(bytes32 intentId => Intent) public intents;

    event IntentQueued(
        bytes32 indexed intentId,
        address indexed owner,
        address indexed recipient,
        uint256 amount,
        uint64 executeAfter
    );
    event IntentCancelled(bytes32 indexed intentId);
    event IntentExecuted(bytes32 indexed intentId);

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidExecutionTime();
    error IntentNotFound();
    error NotIntentOwner();
    error IntentAlreadyFinalized();
    error ExecutionWindowOpen();
    error TransferFailed();

    function queueTransfer(
        address recipient,
        uint64 executeAfter
    ) external payable returns (bytes32 intentId) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (msg.value == 0 || msg.value > type(uint128).max) {
            revert InvalidAmount();
        }
        if (
            executeAfter <= block.timestamp ||
            executeAfter > block.timestamp + MAX_DELAY
        ) revert InvalidExecutionTime();

        intentId = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                msg.sender,
                recipient,
                msg.value,
                executeAfter,
                nonce++
            )
        );
        intents[intentId] = Intent({
            owner: msg.sender,
            recipient: recipient,
            amount: uint128(msg.value),
            executeAfter: executeAfter,
            cancelled: false,
            executed: false
        });

        emit IntentQueued(
            intentId,
            msg.sender,
            recipient,
            msg.value,
            executeAfter
        );
    }

    function cancelIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        if (intent.owner == address(0)) revert IntentNotFound();
        if (msg.sender != intent.owner) revert NotIntentOwner();
        if (intent.cancelled || intent.executed) revert IntentAlreadyFinalized();

        intent.cancelled = true;
        (bool success, ) = payable(intent.owner).call{value: intent.amount}("");
        if (!success) revert TransferFailed();
        emit IntentCancelled(intentId);
    }

    function executeIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        if (intent.owner == address(0)) revert IntentNotFound();
        if (intent.cancelled || intent.executed) revert IntentAlreadyFinalized();
        if (block.timestamp < intent.executeAfter) revert ExecutionWindowOpen();

        intent.executed = true;
        (bool success, ) = payable(intent.recipient).call{
            value: intent.amount
        }("");
        if (!success) revert TransferFailed();
        emit IntentExecuted(intentId);
    }
}
