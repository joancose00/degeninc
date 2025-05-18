'use client'

import { useAccount, useReadContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { formatUnits } from 'viem'

export function Debug() {
  const { address, isConnected } = useAccount()
  
  const { data: subscriptionFee, error: feeError, isLoading: feeLoading } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'subscriptionFee',
  })

  return (
    <div className="card mb-6 bg-gray-900 text-xs">
      <h3 className="text-lg font-semibold mb-2 text-yellow-400">Debug Info</h3>
      <div className="space-y-1 font-mono">
        <p>Wallet Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>User Address: {address || 'Not connected'}</p>
        <p>Contract Address: {TELEGRAM_SUBSCRIPTION_ADDRESS}</p>
        <p>Fee Loading: {feeLoading ? 'Yes' : 'No'}</p>
        <p>Fee Error: {feeError ? feeError.message : 'None'}</p>
        <p>Subscription Fee Raw: {subscriptionFee?.toString() || 'undefined'}</p>
        <p>Subscription Fee Formatted: {subscriptionFee ? formatUnits(subscriptionFee, 6) : 'undefined'} USDC</p>
      </div>
    </div>
  )
}