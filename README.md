# Trustless OTC Desk

A non-custodial OTC marketplace for trading locked ERC-20 tokens for USDC.

**Live:** https://otc.acyclops.dev/

## Overview

This dApp lets users create and fill escrow-based OTC offers without relying on intermediaries.
Each offer deploys an isolated escrow contract controlled by the seller.

## Testing

This dApp is deployed on **Arbitrum Sepolia (testnet)** for testing and demonstration.

To try it out:

- Connect a wallet configured for Arbitrum Sepolia
- Use the built-in faucets to mint test tokens and test USDC
- Create, fill, and cancel offers using test tokens only

No real funds are involved.

## Features

- Create escrow-backed OTC offers
- Fill offers with exact USDC approvals
- Cancel offers at any time to reclaim tokens
- Non-custodial escrow architecture

## Stack

- React + TypeScript + Vite
- wagmi + RainbowKit
- Solidity (escrow + factory pattern)
