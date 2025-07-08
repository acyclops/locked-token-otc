export const lensAbi = [
  {
    "inputs": [],
    "name": "USDC",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IOfferFactory",
        "name": "factory",
        "type": "address"
      }
    ],
    "name": "getActiveOffersPruned",
    "outputs": [
      {
        "internalType": "contract ILockedCortexOffer[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IOfferFactory",
        "name": "factory",
        "type": "address"
      }
    ],
    "name": "getAllActiveOfferInfo",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "offerAddresses",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "cortexBalances",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "tokenWanted",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amountWanted",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract ILockedCortexOffer",
        "name": "offer",
        "type": "address"
      }
    ],
    "name": "getOfferInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "cortexBalance",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenWanted",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountWanted",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IOfferFactory",
        "name": "factory",
        "type": "address"
      }
    ],
    "name": "getVolume",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "sum",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;