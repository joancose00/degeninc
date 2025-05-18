'use client'

import { useAccount, useReadContract } from 'wagmi'
import { USDC_ADDRESS, USDC_ABI } from '@/constants/usdc'
import { formatUnits } from 'viem'

export function BalanceBadge() {
  const { address } = useAccount()
  
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  if (!address) return null
  
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-2 text-sm">
      <span className="text-gray-400">USDC: </span>
      <span className="font-medium text-purple-400">
        ${Number(formatUnits(balance || 0n, 6)).toFixed(2)}
      </span>
    </div>
  )
}