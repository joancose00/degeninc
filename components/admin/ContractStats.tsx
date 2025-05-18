'use client'

import { useReadContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { formatUnits } from 'viem'

export function ContractStats() {
  // Read all contract stats
  const { data: owner } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'owner',
  })

  const { data: balance } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getBalance',
  })

  const { data: totalCollected } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'totalCollected',
  })

  const { data: subscriptionFee } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'subscriptionFee',
  })

  // Use the length of subscribers array - note: this function might not exist
  // so we'll use the sum of active + inactive subscriptions instead
  const totalSubscribers = null // Contract doesn't have getTotalSubscribers function

  const { data: activeSubscriptions } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getActiveSubscriptions',
    args: [0n, 0n], // Get count only
  })

  const { data: usdcAddress } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'usdc',
  })

  const { data: totalDiscounts } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getTotalDiscounts',
  })

  const activeCount = activeSubscriptions?.[2] || 0n
  
  // Get inactive subscriptions to calculate total
  const { data: inactiveSubscriptions } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getInactiveSubscriptions',
    args: [0n, 0n], // Get count only
  })
  
  const inactiveCount = inactiveSubscriptions?.[2] || 0n
  const totalSubscriberCount = activeCount + inactiveCount

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Contract Owner</h3>
        <p className="text-sm font-mono">{owner as string}</p>
        <p className="text-xs text-gray-400 mt-1">Current owner of the contract</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Contract Balance</h3>
        <p className="text-2xl font-bold text-purple-400">
          ${Number(formatUnits(balance || 0n, 6)).toFixed(2)} USDC
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Total Collected</h3>
        <p className="text-2xl font-bold text-green-400">
          ${Number(formatUnits(totalCollected || 0n, 6)).toFixed(2)} USDC
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Subscription Fee</h3>
        <p className="text-2xl font-bold">
          ${Number(formatUnits(subscriptionFee || 0n, 6)).toFixed(2)} USDC
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Total Subscribers</h3>
        <p className="text-2xl font-bold">
          {totalSubscriberCount.toString()}
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Active Subscriptions</h3>
        <p className="text-2xl font-bold text-green-400">
          {activeCount.toString()}
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Active Discounts</h3>
        <p className="text-2xl font-bold text-purple-400">
          {totalDiscounts?.toString() || '0'}
        </p>
      </div>

      <div className="card lg:col-span-3">
        <h3 className="text-lg font-semibold mb-2">USDC Token Address</h3>
        <p className="text-sm font-mono">{usdcAddress as string}</p>
      </div>

      <div className="card lg:col-span-3">
        <h3 className="text-lg font-semibold mb-2">Contract Address</h3>
        <p className="text-sm font-mono">{TELEGRAM_SUBSCRIPTION_ADDRESS}</p>
      </div>
    </div>
  )
}