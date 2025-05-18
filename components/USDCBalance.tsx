'use client'

import { useAccount, useReadContract } from 'wagmi'
import { USDC_ADDRESS, USDC_ABI } from '@/constants/usdc'
import { formatUnits } from 'viem'

export function USDCBalance() {
  const { address } = useAccount()
  
  const { data: balance, isLoading, error } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  if (!address) return null
  
  return (
    <div className="card bg-gray-900/50">
      <h3 className="text-lg font-semibold mb-2">Your USDC Balance</h3>
      <div className="text-2xl font-bold text-purple-400">
        {isLoading ? (
          <span className="text-gray-400">Loading...</span>
        ) : error ? (
          <span className="text-red-400">Error loading balance</span>
        ) : (
          <span>${Number(formatUnits(balance || 0n, 6)).toFixed(2)} USDC</span>
        )}
      </div>
      <p className="text-sm text-gray-400 mt-2">
        On Base Network
      </p>
    </div>
  )
}