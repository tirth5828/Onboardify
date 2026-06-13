// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MainnetPassport} from "../src/MainnetPassport.sol";
import {TestBase} from "./TestBase.sol";

contract MainnetPassportTest is TestBase {
    MainnetPassport private passport;
    address private recipient = address(0xA11CE);
    address private attacker = address(0xBAD);
    bytes32 private nullifier = keccak256("verified-human");

    function setUp() public {
        passport = new MainnetPassport(address(this));
    }

    function testOnlyRelayerCanMint() public {
        vm.prank(attacker);
        vm.expectRevert(bytes4(keccak256("OwnableUnauthorizedAccount(address)")));
        passport.mint(recipient, nullifier, 90, 7);
    }

    function testRejectsDuplicateWallet() public {
        passport.mint(recipient, nullifier, 90, 7);
        vm.expectRevert(MainnetPassport.PassportAlreadyIssued.selector);
        passport.mint(recipient, keccak256("other-human"), 90, 7);
    }

    function testRejectsDuplicateHuman() public {
        passport.mint(recipient, nullifier, 90, 7);
        vm.expectRevert(MainnetPassport.NullifierAlreadyUsed.selector);
        passport.mint(address(0xB0B), nullifier, 90, 7);
    }

    function testPassportCannotTransfer() public {
        uint256 tokenId = passport.mint(recipient, nullifier, 90, 7);
        vm.prank(recipient);
        vm.expectRevert(MainnetPassport.Soulbound.selector);
        passport.transferFrom(recipient, attacker, tokenId);
    }
}
