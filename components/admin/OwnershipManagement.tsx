'use client'

import { useState } from 'react'
import { useWriteContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'

export function OwnershipManagement() {
  const [newOwner, setNewOwner] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState('')
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false)
  
  const { writeContract: transferOwnership } = useWriteContract()
  const { writeContract: renounceOwnership } = useWriteContract()

  const handleTransferOwnership = () => {
    if (!newOwner) return
    if (confirmationInput !== newOwner) {
      alert('Confirmation address does not match')
      return
    }
    
    transferOwnership({
      address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
      abi: TELEGRAM_SUBSCRIPTION_ABI,
      functionName: 'transferOwnership',
      args: [newOwner as `0x${string}`]
    })
    
    // Reset states
    setNewOwner('')
    setShowConfirmation(false)
    setConfirmationInput('')
  }

  const handleRenounceOwnership = () => {
    if (confirm('Are you sure you want to renounce ownership? This action cannot be undone!')) {
      renounceOwnership({
        address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
        abi: TELEGRAM_SUBSCRIPTION_ABI,
        functionName: 'renounceOwnership'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Risk Warning */}
      {!acknowledgedRisk && (
        <div className="card bg-red-900/20 border-red-600">
          <h2 className="text-xl font-semibold mb-3 text-red-400">⚠️ Critical Operations Warning</h2>
          <div className="space-y-3 text-sm">
            <p>The operations in this section are <strong>permanent and irreversible</strong>.</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Transferring ownership will give complete control to the new address</li>
              <li>Renouncing ownership will leave the contract without any owner forever</li>
              <li>These actions cannot be undone</li>
            </ul>
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedRisk}
                  onChange={(e) => setAcknowledgedRisk(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>I understand the risks and want to proceed</span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      {acknowledgedRisk && (
        <div className="card border-red-900/50">
          <h2 className="text-2xl font-semibold mb-4 text-red-400">Ownership Management</h2>
          
          <div className="space-y-6">
        {/* Transfer Ownership */}
        <div>
          <h3 className="text-lg font-medium mb-3">Transfer Ownership</h3>
          <p className="text-sm text-gray-400 mb-4">
            Transfer ownership of the contract to a new address. This action is irreversible.
          </p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="New owner address (0x...)"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm"
            />
            
            {!showConfirmation ? (
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={!newOwner}
                className="w-full px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                Transfer Ownership
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-red-900/20 rounded-lg border border-red-900/50">
                <p className="text-sm text-red-400">
                  ⚠️ Please confirm the transfer by entering the new owner address again:
                </p>
                <input
                  type="text"
                  placeholder="Confirm new owner address"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-red-700 rounded-lg font-mono text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleTransferOwnership}
                    disabled={confirmationInput !== newOwner}
                    className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    Confirm Transfer
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmation(false)
                      setConfirmationInput('')
                    }}
                    className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Renounce Ownership */}
        <div className="pt-6 border-t border-gray-700">
          <h3 className="text-lg font-medium mb-3">Renounce Ownership</h3>
          <p className="text-sm text-red-400 mb-4">
            ⚠️ WARNING: Renouncing ownership will leave the contract without an owner, 
            permanently disabling any functions that require owner privileges.
          </p>
          <button
            onClick={handleRenounceOwnership}
            className="px-6 py-2 bg-red-900 hover:bg-red-800 rounded-lg transition-colors"
          >
            Renounce Ownership (Permanent)
          </button>
        </div>
      </div>
    </div>
      )}
    </div>
  )
}