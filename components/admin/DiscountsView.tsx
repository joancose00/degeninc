'use client'

import { useState } from 'react'
import { useReadContract, useWriteContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { parseUnits, formatUnits } from 'viem'

export function DiscountsView() {
  const [username, setUsername] = useState('')
  const [effectiveFee, setEffectiveFee] = useState<bigint | null>(null)
  const [checkingFee, setCheckingFee] = useState(false)
  
  // For setting new discounts
  const [newDiscountUsername, setNewDiscountUsername] = useState('')
  const [newDiscountPrice, setNewDiscountPrice] = useState('')
  
  // Contract methods
  const { writeContract: setDiscount } = useWriteContract()
  const { writeContract: removeDiscount } = useWriteContract()
  
  // Read contract for checking effective fee
  const { refetch: fetchEffectiveFee } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getEffectiveFee',
    args: [username],
    query: { enabled: false }
  })

  const handleCheckFee = async () => {
    if (!username) return
    setCheckingFee(true)
    try {
      const result = await fetchEffectiveFee()
      setEffectiveFee(result.data as bigint)
    } catch (error) {
      console.error('Error fetching fee:', error)
    }
    setCheckingFee(false)
  }

  const handleSetDiscount = () => {
    if (!newDiscountUsername || !newDiscountPrice) return
    setDiscount({
      address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
      abi: TELEGRAM_SUBSCRIPTION_ABI,
      functionName: 'setDiscount',
      args: [newDiscountUsername, parseUnits(newDiscountPrice, 6)]
    })
  }

  const handleRemoveDiscount = () => {
    if (!username) return
    removeDiscount({
      address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
      abi: TELEGRAM_SUBSCRIPTION_ABI,
      functionName: 'removeDiscount',
      args: [username]
    })
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-4">Discount Management</h2>
      
      {/* Check Effective Fee */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Check Effective Fee</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Telegram username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace('@', ''))}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
          <button
            onClick={handleCheckFee}
            disabled={!username || checkingFee}
            className="px-6 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
          >
            {checkingFee ? 'Checking...' : 'Check Fee'}
          </button>
        </div>
        {effectiveFee !== null && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg">
            <p>Effective fee for @{username}: ${Number(formatUnits(effectiveFee, 6)).toFixed(2)} USDC</p>
          </div>
        )}
      </div>

      {/* Set New Discount */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Set New Discount</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Telegram username"
            value={newDiscountUsername}
            onChange={(e) => setNewDiscountUsername(e.target.value.replace('@', ''))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
          <input
            type="text"
            placeholder="Discount price in USDC"
            value={newDiscountPrice}
            onChange={(e) => setNewDiscountPrice(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
        </div>
        <button
          onClick={handleSetDiscount}
          disabled={!newDiscountUsername || !newDiscountPrice}
          className="mt-2 px-6 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
        >
          Set Discount
        </button>
      </div>

      {/* Remove Discount */}
      <div>
        <h3 className="text-lg font-medium mb-3">Remove Discount</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Telegram username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace('@', ''))}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
          <button
            onClick={handleRemoveDiscount}
            disabled={!username}
            className="px-6 py-2 bg-red-600 rounded-lg disabled:opacity-50"
          >
            Remove Discount
          </button>
        </div>
      </div>
    </div>
  )
}