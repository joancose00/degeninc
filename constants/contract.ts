export const TELEGRAM_SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

export const TELEGRAM_SUBSCRIPTION_ABI = [
  {
    "inputs": [{"name": "_telegramUsername", "type": "string"}],
    "name": "subscribe",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renew",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_user", "type": "address"}],
    "name": "getSubscription",
    "outputs": [
      {
        "components": [
          {"name": "telegramUsername", "type": "string"},
          {"name": "expiresAt", "type": "uint256"},
          {"name": "totalPaid", "type": "uint256"},
          {"name": "subscriptionCount", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_user", "type": "address"}],
    "name": "isActive",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "subscriptionFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_newFee", "type": "uint256"}],
    "name": "updateSubscriptionFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_contributor", "type": "address"}],
    "name": "addContributor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_contributor", "type": "address"}],
    "name": "removeContributor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "distributeFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_amount", "type": "uint256"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "getActiveSubscriptions",
    "outputs": [
      {"name": "", "type": "address[]"},
      {
        "components": [
          {"name": "telegramUsername", "type": "string"},
          {"name": "expiresAt", "type": "uint256"},
          {"name": "totalPaid", "type": "uint256"},
          {"name": "subscriptionCount", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple[]"
      },
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "getInactiveSubscriptions",
    "outputs": [
      {"name": "", "type": "address[]"},
      {
        "components": [
          {"name": "telegramUsername", "type": "string"},
          {"name": "expiresAt", "type": "uint256"},
          {"name": "totalPaid", "type": "uint256"},
          {"name": "subscriptionCount", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple[]"
      },
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "getContributors",
    "outputs": [
      {"name": "", "type": "address[]"},
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCollected",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_telegramUsername", "type": "string"},
      {"name": "_discountPrice", "type": "uint256"}
    ],
    "name": "setDiscount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_telegramUsername", "type": "string"}],
    "name": "removeDiscount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_telegramUsername", "type": "string"}],
    "name": "getEffectiveFee",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "getAllDiscounts",
    "outputs": [
      {"name": "usernames", "type": "string[]"},
      {"name": "prices", "type": "uint256[]"},
      {"name": "total", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalDiscounts",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const