'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { useState } from 'react'

export function AllContributorsView() {
  const [newContributor, setNewContributor] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Read contributors
  const { data: contributorsData, refetch } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getContributors',
    args: [BigInt(offset), BigInt(limit)],
  })

  const contributors = contributorsData?.[0] || []
  const totalContributors = contributorsData?.[1] || 0n

  // Contract writes
  const { writeContract: addContributor } = useWriteContract()
  const { writeContract: removeContributor } = useWriteContract()

  const handleAddContributor = () => {
    if (!newContributor) return
    addContributor({
      address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
      abi: TELEGRAM_SUBSCRIPTION_ABI,
      functionName: 'addContributor',
      args: [newContributor as `0x${string}`]
    })
    setNewContributor('')
  }

  const handleRemoveContributor = (contributorAddress: string) => {
    removeContributor({
      address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
      abi: TELEGRAM_SUBSCRIPTION_ABI,
      functionName: 'removeContributor',
      args: [contributorAddress as `0x${string}`]
    })
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const handleNextPage = () => {
    if (offset + limit < Number(totalContributors)) {
      setOffset(offset + limit)
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Contributors Management</h2>
        <span className="text-gray-400">Total: {totalContributors.toString()}</span>
      </div>

      {/* Add New Contributor */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Add New Contributor</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Contributor address (0x...)"
            value={newContributor}
            onChange={(e) => setNewContributor(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm"
          />
          <button
            onClick={handleAddContributor}
            disabled={!newContributor}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            Add Contributor
          </button>
        </div>
      </div>

      {/* Contributors List */}
      <div>
        <h3 className="text-lg font-medium mb-3">Current Contributors</h3>
        {contributors.length === 0 ? (
          <p className="text-gray-400">No contributors found</p>
        ) : (
          <div className="space-y-2">
            {contributors.map((address: string) => (
              <div key={address} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="font-mono text-sm">{address}</span>
                <button
                  onClick={() => handleRemoveContributor(address)}
                  className="px-4 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Number(totalContributors) > limit && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-400">
            Showing {offset + 1}-{Math.min(offset + limit, Number(totalContributors))} of {totalContributors.toString()}
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
              disabled={offset + limit >= Number(totalContributors)}
              className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}