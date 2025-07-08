export const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "offerAddress",
        type: "address",
        indexed: false
      },
      {
        internalType: "address",
        name: "tokenWanted",
        type: "address",
        indexed: false
      },
      {
        internalType: "uint256",
        name: "amountWanted",
        type: "uint256",
        indexed: false
      }
    ],
    type: "event",
    name: "OfferCreated",
    anonymous: false
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "previousOwner",
        type: "address",
        indexed: true
      },
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
        indexed: true
      }
    ],
    type: "event",
    name: "OwnershipTransferred",
    anonymous: false
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenWanted",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_amountWanted",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "createOffer",
    outputs: [
      {
        internalType: "contract LockedCortexOffer",
        name: "",
        type: "address"
      }
    ]
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "fee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ]
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "getActiveOffers",
    outputs: [
      {
        internalType: "contract LockedCortexOffer[]",
        name: "",
        type: "address[]"
      }
    ]
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "getActiveOffersByOwner",
    outputs: [
      {
        internalType: "contract LockedCortexOffer[]",
        name: "",
        type: "address[]"
      },
      {
        internalType: "contract LockedCortexOffer[]",
        name: "",
        type: "address[]"
      }
    ]
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function",
    name: "getActiveOffersByRange",
    outputs: [
      {
        internalType: "contract LockedCortexOffer[]",
        name: "",
        type: "address[]"
      }
    ]
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function",
    name: "offers",
    outputs: [
      {
        internalType: "contract LockedCortexOffer",
        name: "",
        type: "address"
      }
    ]
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ]
  },
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    name: "renounceOwnership"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fee",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "setFee"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "transferOwnership"
  }
] as const;