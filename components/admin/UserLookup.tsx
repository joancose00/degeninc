'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { formatUnits } from 'viem'

interface Subscription {
  telegramUsername: string
  expiresAt: bigint
  totalPaid: bigint
  subscriptionCount: bigint
}

export function UserLookup() {
  const [userAddress, setUserAddress] = useState('')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [isInGracePeriod, setIsInGracePeriod] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  // Read contracts
  const { refetch: fetchSubscription } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getSubscription',
    args: [userAddress as `0x${string}`],
    query: { enabled: false }
  })

  const { refetch: fetchIsActive } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'isActive',
    args: [userAddress as `0x${string}`],
    query: { enabled: false }
  })

  const { refetch: fetchIsInGracePeriod } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'isInGracePeriod',
    args: [userAddress as `0x${string}`],
    query: { enabled: false }
  })

  const handleLookup = async () => {
    if (!userAddress) return
    setLoading(true)
    
    try {
      const [subResult, activeResult, graceResult] = await Promise.all([
        fetchSubscription(),
        fetchIsActive(),
        fetchIsInGracePeriod()
      ])
      
      setSubscription(subResult.data as Subscription)
      setIsActive(activeResult.data as boolean)
      setIsInGracePeriod(graceResult.data as boolean)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
    
    setLoading(false)
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-4">User Lookup</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="User address (0x...)"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm"
        />
        <button
          onClick={handleLookup}
          disabled={!userAddress || loading}
          className="px-6 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Lookup'}
        </button>
      </div>

      {subscription && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Telegram Username</p>
              <p className="font-medium">@{subscription.telegramUsername || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className={`font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                {isActive ? 'Active' : 'Inactive'}
                {isInGracePeriod && ' (Grace Period)'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Expires At</p>
              <p className="font-medium">{formatDate(subscription.expiresAt)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Paid</p>
              <p className="font-medium">${Number(formatUnits(subscription.totalPaid, 6)).toFixed(2)} USDC</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Subscription Count</p>
              <p className="font-medium">{subscription.subscriptionCount.toString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}