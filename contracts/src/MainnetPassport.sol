// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MainnetPassport is ERC721, Ownable {
    struct Readiness {
        uint16 score;
        uint32 skillMask;
        uint64 issuedAt;
    }

    uint256 private nextTokenId = 1;
    mapping(address account => uint256 tokenId) public passportOf;
    mapping(bytes32 nullifierHash => bool used) public usedNullifiers;
    mapping(uint256 tokenId => Readiness readiness) public readinessOf;

    event PassportIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        bytes32 indexed nullifierHash,
        uint16 score,
        uint32 skillMask
    );

    error PassportAlreadyIssued();
    error NullifierAlreadyUsed();
    error InvalidReadinessScore();
    error Soulbound();

    constructor(address relayer) ERC721("Mainnet Passport", "READY") Ownable(relayer) {}

    function mint(
        address recipient,
        bytes32 nullifierHash,
        uint16 score,
        uint32 skillMask
    ) external onlyOwner returns (uint256 tokenId) {
        if (recipient == address(0) || passportOf[recipient] != 0) {
            revert PassportAlreadyIssued();
        }
        if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed();
        if (score < 80 || score > 100) revert InvalidReadinessScore();

        tokenId = nextTokenId++;
        passportOf[recipient] = tokenId;
        usedNullifiers[nullifierHash] = true;
        readinessOf[tokenId] = Readiness({
            score: score,
            skillMask: skillMask,
            issuedAt: uint64(block.timestamp)
        });
        _safeMint(recipient, tokenId);
        emit PassportIssued(
            tokenId,
            recipient,
            nullifierHash,
            score,
            skillMask
        );
    }

    function approve(address, uint256) public pure override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
