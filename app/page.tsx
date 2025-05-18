'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TELEGRAM_SUBSCRIPTION_ADDRESS, TELEGRAM_SUBSCRIPTION_ABI } from '@/constants/contract'
import { USDC_ADDRESS, USDC_ABI } from '@/constants/usdc'
import { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { ContractNotDeployed } from '@/components/ContractNotDeployed'
import { USDCBalance } from '@/components/USDCBalance'
import { BalanceBadge } from '@/components/BalanceBadge'

export default function HomePage() {
  const { address } = useAccount()
  const [telegramUsername, setTelegramUsername] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [effectiveFee, setEffectiveFee] = useState<bigint | null>(null)
  const [checkingFee, setCheckingFee] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Read subscription data
  const { data: subscription, refetch: refetchSubscription } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getSubscription',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: subscriptionFee, refetch: refetchFee } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'subscriptionFee',
  })

  const { data: isActive, refetch: refetchIsActive } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'isActive',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
  
  // Get effective fee for username (for new subscriptions)
  const { data: effectiveFeeFromContract, refetch: fetchEffectiveFee } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getEffectiveFee',
    args: [telegramUsername],
    query: { 
      enabled: !!telegramUsername && telegramUsername.length > 0,
    }
  })
  
  // Get effective fee for existing subscription (for renewals)
  const { data: existingEffectiveFee } = useReadContract({
    address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
    abi: TELEGRAM_SUBSCRIPTION_ABI,
    functionName: 'getEffectiveFee',
    args: subscription ? [subscription.telegramUsername] : undefined,
    query: { 
      enabled: !!subscription?.telegramUsername,
    }
  })
  
  // Update effective fee when it changes
  useEffect(() => {
    if (effectiveFeeFromContract !== undefined) {
      setEffectiveFee(effectiveFeeFromContract)
    }
  }, [effectiveFeeFromContract])

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: isApproving ? 2000 : false, // Poll every 2 seconds during approval
    },
  })

  // Contract writes
  const { writeContract: approve, isPending: isApprovePending, data: approveHash } = useWriteContract()

  const { writeContract: subscribe, isPending: isSubscribePending, isSuccess: isSubscribeSuccess } = useWriteContract()

  const { writeContract: renew, isPending: isRenewPending, isSuccess: isRenewSuccess } = useWriteContract()
  
  // Wait for approval transaction
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })
  
  // Store the target action after approval
  const [pendingAction, setPendingAction] = useState<'subscribe' | 'renew' | null>(null)

  const handleSubscribe = async () => {
    if (!telegramUsername) return
    
    setCheckingFee(true)
    
    // First check the effective fee (including discounts)
    const feeResult = await fetchEffectiveFee()
    const feeToUse = feeResult.data as bigint || subscriptionFee
    setEffectiveFee(feeToUse || null)
    setCheckingFee(false)
    
    if (!feeToUse) return
    
    const needsApproval = !allowance || allowance < feeToUse
    
    if (needsApproval) {
      setIsApproving(true)
      setPendingAction('subscribe')
      approve({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`, feeToUse]
      })
    } else {
      // Direct subscribe without approval
      subscribe({
        address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
        abi: TELEGRAM_SUBSCRIPTION_ABI,
        functionName: 'subscribe',
        args: [telegramUsername]
      })
    }
  }

  // Monitor allowance changes and execute pending action
  useEffect(() => {
    if (pendingAction && allowance) {
      // Determine the fee to check based on the action
      const feeToCheck = pendingAction === 'subscribe' 
        ? (effectiveFee || subscriptionFee)
        : (existingEffectiveFee || subscriptionFee)
      
      if (feeToCheck && allowance >= feeToCheck) {
        // We now have enough allowance, execute the pending action
        if (pendingAction === 'subscribe' && telegramUsername) {
          subscribe({
            address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
            abi: TELEGRAM_SUBSCRIPTION_ABI,
            functionName: 'subscribe',
            args: [telegramUsername]
          })
        } else if (pendingAction === 'renew') {
          renew({
            address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
            abi: TELEGRAM_SUBSCRIPTION_ABI,
            functionName: 'renew'
          })
        }
        
        setPendingAction(null)
        setIsApproving(false)
      }
    }
  }, [allowance, effectiveFee, existingEffectiveFee, subscriptionFee, pendingAction, telegramUsername, subscribe, renew])
  
  // Refetch data after subscription
  useEffect(() => {
    if (subscription) {
      refetchSubscription()
      refetchIsActive()
      refetchAllowance()
    }
  }, [subscription?.subscriptionCount, refetchSubscription, refetchIsActive, refetchAllowance])
  
  // Show success message after subscription
  useEffect(() => {
    if (isSubscribeSuccess || isRenewSuccess) {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 10000) // Hide after 10 seconds
    }
  }, [isSubscribeSuccess, isRenewSuccess])

  const handleRenew = async () => {
    if (!subscription?.telegramUsername) return
    
    // Use the existing effective fee or fall back to subscription fee
    const feeToUse = existingEffectiveFee || subscriptionFee
    
    if (!feeToUse) return
    
    const needsApproval = !allowance || allowance < feeToUse
    
    if (needsApproval) {
      setIsApproving(true)
      setPendingAction('renew')
      approve({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`, feeToUse]
      })
    } else {
      // Direct renew without approval
      renew({
        address: TELEGRAM_SUBSCRIPTION_ADDRESS as `0x${string}`,
        abi: TELEGRAM_SUBSCRIPTION_ABI,
        functionName: 'renew'
      })
    }
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  if (!mounted) return null

  const isContractDeployed = TELEGRAM_SUBSCRIPTION_ADDRESS && 
    TELEGRAM_SUBSCRIPTION_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-purple-400">Telegram Subscription</h1>
          <div className="flex items-center gap-4">
            {address && <BalanceBadge />}
            <ConnectButton />
          </div>
        </div>
        
        {/* Success Message */}
        {showSuccessMessage && isActive === true && process.env.NEXT_PUBLIC_INVITE_LINK && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Subscription Successful!</h3>
            <p className="text-sm text-gray-300 mb-3">Welcome! Your subscription is now active. Join our exclusive Telegram group:</p>
            <a 
              href={process.env.NEXT_PUBLIC_INVITE_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.908 7.56-2.7 10.02-.336 1.041-.999 1.388-1.641 1.423-1.39.077-2.446-.917-3.792-1.798-2.105-1.379-3.295-2.235-5.338-3.579-2.361-1.555-.83-2.41.515-3.808.352-.365 6.473-5.935 6.59-6.439.015-.064.027-.299-.112-.423-.139-.125-.345-.082-.493-.049-.21.049-3.563 2.265-10.057 6.649-.952.626-1.813.931-2.584.915-1.701-.034-3.304-.652-3.927-.879-.765-.279-.685-.589.177-.911 3.536-1.327 11.793-4.433 14.022-5.239 1.306-.471 2.503-.437 2.909.051.407.488.431 1.784.431 2.068z"/>
              </svg>
              Join Telegram Group
            </a>
          </div>
        )}
        
        {!isContractDeployed ? (
          <ContractNotDeployed />
        ) : address ? (
          <div className="space-y-6">
            {/* USDC Balance */}
            <USDCBalance />
            
            {/* Subscription Status */}
            <div className="card">
              <h2 className="text-2xl font-semibold mb-4">Your Subscription</h2>
              {subscription && subscription.telegramUsername ? (
                <div>
                  <div className="space-y-3">
                    <p><span className="text-gray-400">Telegram:</span> @{subscription.telegramUsername}</p>
                    <p><span className="text-gray-400">Status:</span> 
                      <span className={isActive ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                        {isActive ? 'Active' : 'Expired'}
                      </span>
                    </p>
                    <p><span className="text-gray-400">Expires:</span> {formatDate(subscription.expiresAt)}</p>
                    <p><span className="text-gray-400">Total Paid:</span> ${Number(formatUnits(subscription.totalPaid, 6)).toFixed(2)} USDC</p>
                    <p><span className="text-gray-400">Subscriptions:</span> {subscription.subscriptionCount.toString()}</p>
                  </div>
                  {isActive && process.env.NEXT_PUBLIC_INVITE_LINK && (
                    <div className="mt-4 p-4 bg-purple-900/20 border border-purple-600 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-400 mb-2">Join Telegram Group</h3>
                      <p className="text-sm text-gray-300 mb-3">Your subscription is active! Join our exclusive Telegram group:</p>
                      <a 
                        href={process.env.NEXT_PUBLIC_INVITE_LINK} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.908 7.56-2.7 10.02-.336 1.041-.999 1.388-1.641 1.423-1.39.077-2.446-.917-3.792-1.798-2.105-1.379-3.295-2.235-5.338-3.579-2.361-1.555-.83-2.41.515-3.808.352-.365 6.473-5.935 6.59-6.439.015-.064.027-.299-.112-.423-.139-.125-.345-.082-.493-.049-.21.049-3.563 2.265-10.057 6.649-.952.626-1.813.931-2.584.915-1.701-.034-3.304-.652-3.927-.879-.765-.279-.685-.589.177-.911 3.536-1.327 11.793-4.433 14.022-5.239 1.306-.471 2.503-.437 2.909.051.407.488.431 1.784.431 2.068z"/>
                        </svg>
                        Join Telegram Group
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No subscription found</p>
              )}
            </div>

            {/* Subscribe/Renew */}
            <div className="card">
              <h2 className="text-2xl font-semibold mb-4">
                {subscription && subscription.telegramUsername ? 'Renew Subscription' : 'Subscribe'}
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-400">Subscription Fee: ${subscriptionFee ? Number(formatUnits(subscriptionFee, 6)).toFixed(2) : '0.00'} USDC</p>
                {/* Show discount for new subscription */}
                {(!subscription || !subscription.telegramUsername) && effectiveFee && effectiveFee !== subscriptionFee && (
                  <p className="text-green-400">Discounted Price: ${Number(formatUnits(effectiveFee, 6)).toFixed(2)} USDC</p>
                )}
                {/* Show discount for renewal */}
                {subscription?.telegramUsername && existingEffectiveFee && existingEffectiveFee !== subscriptionFee && (
                  <p className="text-green-400">Your Discounted Price: ${Number(formatUnits(existingEffectiveFee, 6)).toFixed(2)} USDC</p>
                )}
                
                {!subscription || !subscription.telegramUsername ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">Telegram Username</label>
                    <input
                      type="text"
                      placeholder="your_username"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    {effectiveFee && effectiveFee !== subscriptionFee && (
                      <p className="text-green-400 text-sm mt-1">
                        You have a discount! Price: ${Number(formatUnits(effectiveFee, 6)).toFixed(2)} USDC
                      </p>
                    )}
                  </div>
                ) : null}

                <button
                  onClick={subscription && subscription.telegramUsername ? handleRenew : handleSubscribe}
                  disabled={
                    ((!subscription || !subscription.telegramUsername) && !telegramUsername) ||
                    isApprovePending || isSubscribePending || isRenewPending || checkingFee
                  }
                  className="wallet-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingFee ? 'Checking for discounts...' :
                   isApprovePending || isApprovalConfirming ? 'Approving USDC...' :
                   isSubscribePending ? 'Subscribing...' :
                   isRenewPending ? 'Renewing...' :
                   isApproving ? 'Waiting for approval...' :
                   subscription && subscription.telegramUsername ? 'Renew Subscription' : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to manage your subscription</p>
            <ConnectButton />
          </div>
        )}
      </div>
    </div>
  )
}