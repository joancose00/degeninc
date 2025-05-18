# Telegram Subscription App

A decentralized subscription management system for Telegram groups built on Base network.

## Features

- 🔐 Wallet connection with RainbowKit (supports MetaMask, Rabby, and more)
- 💳 USDC-based subscriptions
- 🎯 Discount system for specific usernames
- 👥 Contributor management and profit sharing
- 🌙 Dark theme with purple accent
- 📱 Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- wagmi v2
- RainbowKit
- viem

## Deployment

This app is designed to be deployed on Cloudflare Pages.

### Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_INVITE_LINK=your_telegram_invite_link
```

### Cloudflare Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   - Connect your GitHub repository to Cloudflare Pages
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Add environment variables in Cloudflare Pages settings

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file with required environment variables

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Contract

The smart contract is deployed on Base network and handles:
- Subscription management
- Discount system
- Contributor profit sharing
- USDC payments

## License

MIT