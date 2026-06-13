// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {GuardedTransferVault} from "../src/GuardedTransferVault.sol";
import {MainnetPassport} from "../src/MainnetPassport.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function addr(uint256 privateKey) external pure returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract Deploy {
    Vm private constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run()
        external
        returns (GuardedTransferVault vault, MainnetPassport passport)
    {
        uint256 privateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        address relayer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);
        vault = new GuardedTransferVault();
        passport = new MainnetPassport(relayer);
        vm.stopBroadcast();
    }
}
