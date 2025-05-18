export function ContractNotDeployed() {
  return (
    <div className="card bg-yellow-900/20 border-yellow-600/50">
      <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Contract Not Deployed</h2>
      <div className="space-y-3 text-gray-300">
        <p>The TelegramSubscription contract hasn't been deployed yet.</p>
        <p>To use this app:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li>Deploy the TelegramSubscription.sol contract to Base network</li>
          <li>Update the contract address in <code className="bg-gray-800 px-2 py-1 rounded">.env.local</code>:</li>
        </ol>
        <pre className="bg-gray-800 p-3 rounded-lg mt-2 overflow-x-auto">
          <code>NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address</code>
        </pre>
        <p className="mt-4">Current contract address:</p>
        <code className="bg-gray-800 px-2 py-1 rounded text-red-400">
          {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'}
        </code>
      </div>
    </div>
  )
}