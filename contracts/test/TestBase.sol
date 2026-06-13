// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface Vm {
    function deal(address account, uint256 newBalance) external;
    function prank(address sender) external;
    function startPrank(address sender) external;
    function stopPrank() external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes4 selector) external;
}

abstract contract TestBase {
    Vm internal constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertTrue(bool value) internal pure {
        require(value, "assertTrue failed");
    }

    function assertEq(uint256 left, uint256 right) internal pure {
        require(left == right, "assertEq failed");
    }

    function assertEq(address left, address right) internal pure {
        require(left == right, "assertEq address failed");
    }
}
