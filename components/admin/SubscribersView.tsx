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

export function SubscribersView() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('active')
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Fetch active subscriptions
  const { data: activeData } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getActiveSubscriptions',
    args: [BigInt(offset), BigInt(limit)],
    query: { enabled: activeTab === 'active' }
  })

  // Fetch inactive subscriptions
  const { data: inactiveData } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getInactiveSubscriptions',
    args: [BigInt(offset), BigInt(limit)],
    query: { enabled: activeTab === 'inactive' }
  })

  // Fetch all subscribers
  const { data: allData } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getAllSubscribers',
    args: [BigInt(offset), BigInt(limit)],
    query: { enabled: activeTab === 'all' }
  })

  const currentData = activeTab === 'active' ? activeData : activeTab === 'inactive' ? inactiveData : allData
  const addresses = currentData?.[0] || []
  const subscriptions = currentData?.[1] || []
  const totalCount = currentData?.[2] || 0n

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const handleNextPage = () => {
    if (offset + limit < Number(totalCount)) {
      setOffset(offset + limit)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-4">Subscribers</h2>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab('active'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg ${activeTab === 'active' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          Active
        </button>
        <button
          onClick={() => { setActiveTab('inactive'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg ${activeTab === 'inactive' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          Inactive
        </button>
        <button
          onClick={() => { setActiveTab('all'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          All
        </button>
      </div>

      {/* Subscribers List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-2">Address</th>
              <th className="pb-2">Telegram</th>
              <th className="pb-2">Expires</th>
              <th className="pb-2">Total Paid</th>
              <th className="pb-2">Sub Count</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((address: string, index: number) => {
              const sub = subscriptions[index] as Subscription
              return (
                <tr key={address} className="border-b border-gray-800">
                  <td className="py-2 font-mono text-sm">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </td>
                  <td className="py-2">@{sub.telegramUsername}</td>
                  <td className="py-2">{formatDate(sub.expiresAt)}</td>
                  <td className="py-2">${Number(formatUnits(sub.totalPaid, 6)).toFixed(2)}</td>
                  <td className="py-2">{sub.subscriptionCount.toString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-gray-400">
          Showing {offset + 1}-{Math.min(offset + limit, Number(totalCount))} of {totalCount.toString()}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={offset + limit >= Number(totalCount)}
            className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}