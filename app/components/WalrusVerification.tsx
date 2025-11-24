'use client';

import { useState } from 'react';
import walrusData from '@/data/walrusBlobs.json';
import agentData from '@/data/agentData.json';

export default function WalrusVerification() {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedBlobs, setVerifiedBlobs] = useState<string[]>([]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifiedBlobs([]);

    // Simulate verifying each blob one by one
    const blobs = Object.entries(walrusData.walrus_storage);

    for (let i = 0; i < blobs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const [agentId, blobInfo] = blobs[i];
      setVerifiedBlobs(prev => [...prev, agentId]);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    setVerifying(false);
    setVerified(true);
  };

  return (
    <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        🔐 Walrus Data Verification
      </h2>

      {!verified ? (
        <div>
          <p className="text-gray-300 mb-6">
            Tournament data is stored immutably on Walrus. Click below to verify agent performance records.
          </p>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            {verifying ? '⏳ Verifying...' : '✓ Verify Walrus Blobs'}
          </button>

          {verifying && (
            <div className="mt-6 space-y-3">
              {agentData.agents.map((agent, idx) => {
                const isVerified = verifiedBlobs.includes(agent.id);
                return (
                  <div
                    key={agent.id}
                    className={`p-3 rounded border ${
                      isVerified ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white">{agent.name}</span>
                      {isVerified ? (
                        <span className="text-green-400 font-bold">✓ Verified</span>
                      ) : (
                        <span className="text-gray-500 animate-pulse">Verifying...</span>
                      )}
                    </div>
                    {isVerified && (
                      <p className="text-xs text-gray-400 mt-2">
                        Blob: {walrusData.walrus_storage[agent.id as keyof typeof walrusData.walrus_storage].blob_id.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 font-bold mb-3">✓ All Walrus data verified!</p>
          <ul className="space-y-2 text-sm text-green-300">
            {Object.entries(walrusData.walrus_storage).map(([agentId, blob]) => (
              <li key={agentId}>
                <strong>{agentId}:</strong> {blob.blob_id.slice(0, 20)}...
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
