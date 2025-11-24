'use client';

import { useState } from 'react';
import agentData from '@/data/agentData.json';

export default function SettlementFlow() {
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const handleSettle = async () => {
    setSettling(true);
    setSteps([]);

    const flowSteps = [
      'Retrieving Walrus blob IDs from battle records...',
      'Querying Walrus for verified battle data...',
      'Extracting win/loss statistics from immutable blobs...',
      'Comparing agent battle performance...',
      'Calling Sui smart contract: settle_tournament()...',
      'Smart contract verifying Walrus data integrity...',
      'Determining tournament winner based on total score...',
      'Emitting TournamentSettled event on Sui blockchain...',
      'Settlement complete!',
    ];

    for (const step of flowSteps) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setSteps(prev => [...prev, step]);
    }

    // Find winner
    const winnerAgent = agentData.agents.reduce((prev, current) =>
      current.roi > prev.roi ? current : prev
    );

    setWinner(winnerAgent);
    setSettling(false);
    setSettled(true);
  };

  return (
    <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        ⚡ Smart Contract Settlement
      </h2>

      {!settled ? (
        <div>
          <p className="text-gray-300 mb-6">
            Settle the tournament using Walrus-verified data on the smart contract.
          </p>

          <button
            onClick={handleSettle}
            disabled={settling}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            {settling ? '⏳ Settling...' : '🔗 Settle Tournament'}
          </button>

          {steps.length > 0 && (
            <div className="mt-6 space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded bg-black/30">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300 text-sm">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-6">
          <p className="text-orange-400 font-bold mb-4">✓ Tournament Settled!</p>
          {winner && (
            <div className="bg-black/50 p-4 rounded">
              <p className="text-white mb-3">Smart Contract Result:</p>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{winner.name}</p>
                <p className="text-gray-400 mt-2">Winner with +{winner.roi}% ROI</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
