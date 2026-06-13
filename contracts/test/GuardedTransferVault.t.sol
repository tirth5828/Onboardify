// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {GuardedTransferVault} from "../src/GuardedTransferVault.sol";
import {TestBase} from "./TestBase.sol";

contract ReentrantRecipient {
    GuardedTransferVault private immutable vault;
    bytes32 public intentId;
    bool public reentrySucceeded;

    constructor(GuardedTransferVault target) {
        vault = target;
    }

    function setIntent(bytes32 value) external {
        intentId = value;
    }

    receive() external payable {
        (reentrySucceeded, ) = address(vault).call(
            abi.encodeCall(vault.executeIntent, (intentId))
        );
    }
}

contract GuardedTransferVaultTest is TestBase {
    GuardedTransferVault private vault;
    address private owner = address(0xA11CE);
    address private recipient = address(0xB0B);

    function setUp() public {
        vault = new GuardedTransferVault();
        vm.deal(owner, 10 ether);
    }

    function testRejectsEarlyExecution() public {
        vm.prank(owner);
        bytes32 id = vault.queueTransfer{value: 1 ether}(
            recipient,
            uint64(block.timestamp + 60)
        );
        vm.expectRevert(GuardedTransferVault.ExecutionWindowOpen.selector);
        vault.executeIntent(id);
    }

    function testOwnerCanCancelAndReceiveRefund() public {
        uint256 beforeBalance = owner.balance;
        vm.startPrank(owner);
        bytes32 id = vault.queueTransfer{value: 1 ether}(
            recipient,
            uint64(block.timestamp + 60)
        );
        vault.cancelIntent(id);
        vm.stopPrank();
        assertEq(owner.balance, beforeBalance);
    }

    function testRejectsUnauthorizedCancellation() public {
        vm.prank(owner);
        bytes32 id = vault.queueTransfer{value: 1 ether}(
            recipient,
            uint64(block.timestamp + 60)
        );
        vm.prank(recipient);
        vm.expectRevert(GuardedTransferVault.NotIntentOwner.selector);
        vault.cancelIntent(id);
    }

    function testCannotSettleTwice() public {
        vm.prank(owner);
        bytes32 id = vault.queueTransfer{value: 1 ether}(
            recipient,
            uint64(block.timestamp + 60)
        );
        vm.warp(block.timestamp + 61);
        vault.executeIntent(id);
        vm.expectRevert(GuardedTransferVault.IntentAlreadyFinalized.selector);
        vault.executeIntent(id);
    }

    function testReentrantRecipientCannotExecuteTwice() public {
        ReentrantRecipient attacker = new ReentrantRecipient(vault);
        vm.prank(owner);
        bytes32 id = vault.queueTransfer{value: 1 ether}(
            address(attacker),
            uint64(block.timestamp + 60)
        );
        attacker.setIntent(id);
        vm.warp(block.timestamp + 61);
        vault.executeIntent(id);
        assertTrue(!attacker.reentrySucceeded());
        assertEq(address(attacker).balance, 1 ether);
    }
}
