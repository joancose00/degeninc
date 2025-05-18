'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { ContractNotDeployed } from '@/components/ContractNotDeployed'
import { BalanceBadge } from '@/components/BalanceBadge'
import { ContractStats } from '@/components/admin/ContractStats'
import { SubscribersView } from '@/components/admin/SubscribersView'
import { DiscountsView } from '@/components/admin/DiscountsView'
import { UserLookup } from '@/components/admin/UserLookup'
import { OwnershipManagement } from '@/components/admin/OwnershipManagement'
import { AllDiscountsView } from '@/components/admin/AllDiscountsView'
import { AllContributorsView } from '@/components/admin/AllContributorsView'

export default function AdminPage() {
  const { address } = useAccount()
  const [newFee, setNewFee] = useState('')
  const [newContributor, setNewContributor] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'subscribers' | 'funds' | 'contributors' | 'lookup' | 'ownership' | 'discounts'>('overview')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Read contract data
  const { data: owner } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'owner',
  })

  const { data: contributors } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getContributors',
    args: [0n, 100n],
  })

  // Contract writes
  const { writeContract: updateFee } = useWriteContract()
  const { writeContract: addContributor } = useWriteContract()
  const { writeContract: removeContributor } = useWriteContract()
  const { writeContract: withdraw } = useWriteContract()
  const { writeContract: distributeFunds } = useWriteContract()


  if (!mounted) return null

  const isContractDeployed = TELEGRAM_SUBSCRIPTION_ADDRESS && 
    TELEGRAM_SUBSCRIPTION_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-purple-400">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            {address && <BalanceBadge />}
            <ConnectButton />
          </div>
        </div>

        {!isContractDeployed ? (
          <ContractNotDeployed />
        ) : (
          <>
            {/* Section Navigation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveSection('overview')}
                className={`px-4 py-2 rounded-lg ${activeSection === 'overview' ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveSection('subscribers')}
                className={`px-4 py-2 rounded-lg ${activeSection === 'subscribers' ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                Subscribers
              </button>
              <button
                onClick={() => setActiveSection('funds')}
                className={`px-4 py-2 rounded-lg ${activeSection === 'funds' ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                Funds
              </button>
              <button
                onClick={() => setActiveSection('contributors')}
                className={`px-4 py-2 rounded-lg ${activeSection === 'contributors' ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                Contributors
              </button>
              <button
                onClick={() => setActiveSection('lookup')}
                className={`px-4 py-2 rounded-lg ${activeSection === 'lookup' ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                User Lookup
              </button>
              <button
                onClick={() => setActiveSection('ownership')}
                className={`px-4 py-2 rounded-lg text-white ${activeSection === 'ownership' ? 'bg-red-600' : 'bg-gray-700'}`}
              >
                Ownership
              </button>
              <button
                onClick={() => setActiveSection('discounts')}
                className={`px-4 py-2 rounded-lg ${activeSection === 'discounts' ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                Discounts
              </button>
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <ContractStats />
              </div>
            )}

            {/* Subscribers Section */}
            {activeSection === 'subscribers' && (
              <div className="space-y-6">
                <SubscribersView />
              </div>
            )}

            {/* Funds Section */}
            {activeSection === 'funds' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Update Fee */}
                <div className="card">
                  <h2 className="text-2xl font-semibold mb-4">Update Subscription Fee</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="New fee in USDC"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    />
                    <button
                      onClick={() => updateFee({
                        address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
                        abi: TELEGRAM_SUBSCRIPTION_ABI,
                        functionName: 'updateSubscriptionFee',
                        args: [parseUnits(newFee, 6)]
                      })}
                      disabled={!newFee}
                      className="wallet-button w-full disabled:opacity-50"
                    >
                      Update Fee
                    </button>
                  </div>
                </div>

                {/* Funds Management */}
                <div className="card">
                  <h2 className="text-2xl font-semibold mb-4">Funds Management</h2>
                  <div className="space-y-4">
                    <button
                      onClick={() => distributeFunds({
                        address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
                        abi: TELEGRAM_SUBSCRIPTION_ABI,
                        functionName: 'distributeFunds',
                        args: [0n, 100n]
                      })}
                      className="wallet-button w-full"
                    >
                      Distribute to Contributors
                    </button>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Withdraw address"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Amount in USDC"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                      />
                      <button
                        onClick={() => withdraw({
                          address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
                          abi: TELEGRAM_SUBSCRIPTION_ABI,
                          functionName: 'withdraw',
                          args: [withdrawAddress as `0x${string}`, parseUnits(withdrawAmount, 6)]
                        })}
                        disabled={!withdrawAddress || !withdrawAmount}
                        className="wallet-button w-full disabled:opacity-50"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contributors Section */}
            {activeSection === 'contributors' && (
              <div className="space-y-6">
                <AllContributorsView />
              </div>
            )}

            {/* User Lookup Section */}
            {activeSection === 'lookup' && (
              <div className="space-y-6">
                <UserLookup />
              </div>
            )}

            {/* Ownership Section */}
            {activeSection === 'ownership' && (
              <div className="space-y-6">
                <OwnershipManagement />
              </div>
            )}

            {/* Discounts Section */}
            {activeSection === 'discounts' && (
              <div className="space-y-6">
                <DiscountsView />
                <AllDiscountsView />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}