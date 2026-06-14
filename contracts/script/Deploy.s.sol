// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {GuardedTransferVault} from "../src/GuardedTransferVault.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract Deploy {
    Vm private constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (GuardedTransferVault vault) {
        uint256 privateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        vault = new GuardedTransferVault();
        vm.stopBroadcast();
    }
}
