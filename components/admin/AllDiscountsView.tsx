'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { formatUnits } from 'viem'

export function AllDiscountsView() {
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Get subscription fee (regular price)
  const { data: subscriptionFee } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'subscriptionFee',
  })

  // Get total discounts count
  const { data: totalDiscounts } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getTotalDiscounts',
  })

  // Get paginated discounts
  const { data: discountsData, isLoading } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getAllDiscounts',
    args: [BigInt(offset), BigInt(limit)],
  })

  const usernames = discountsData?.[0] || []
  const prices = discountsData?.[1] || []
  const total = discountsData?.[2] || 0n

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const handleNextPage = () => {
    if (offset + limit < Number(total)) {
      setOffset(offset + limit)
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">All Active Discounts</h2>
        <span className="text-gray-400">Total: {totalDiscounts?.toString() || '0'}</span>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading discounts...</p>
      ) : usernames.length === 0 ? (
        <p className="text-gray-400">No active discounts</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-2">Telegram Username</th>
                  <th className="pb-2">Discount Price</th>
                  <th className="pb-2">Regular Price</th>
                  <th className="pb-2">Savings</th>
                </tr>
              </thead>
              <tbody>
                {usernames.map((username: string, index: number) => {
                  const discountPrice = prices[index]
                  const regularPrice = subscriptionFee || 0n
                  const savings = regularPrice && discountPrice ? regularPrice - discountPrice : 0n
                  
                  return (
                    <tr key={username} className="border-b border-gray-800">
                      <td className="py-2">@{username}</td>
                      <td className="py-2 text-green-400">
                        ${Number(formatUnits(discountPrice, 6)).toFixed(2)} USDC
                      </td>
                      <td className="py-2 text-gray-400">
                        <span className="line-through">
                          ${Number(formatUnits(regularPrice || 0n, 6)).toFixed(2)} USDC
                        </span>
                      </td>
                      <td className="py-2 text-purple-400">
                        ${Number(formatUnits(savings, 6)).toFixed(2)} saved
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-gray-400">
              Showing {offset + 1}-{Math.min(offset + limit, Number(total))} of {total.toString()}
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
                disabled={offset + limit >= Number(total)}
                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}