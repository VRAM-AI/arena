'use client';

import { useEffect, useState } from 'react';

export default function BetHistory() {
  const [bets, setBets] = useState<any[]>([]);

  useEffect(() => {
    // Load from localStorage
    const savedBets = localStorage.getItem('userBets');
    if (savedBets) {
      try {
        setBets(JSON.parse(savedBets));
      } catch (e) {
        console.error('Failed to load bets:', e);
      }
    }

    // Listen for storage changes (in case user opens multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userBets' && e.newValue) {
        try {
          setBets(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse updated bets:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('userBets');
    setBets([]);
  };

  if (bets.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">📊 Your Bet History</h3>
        <button
          onClick={clearHistory}
          className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition"
        >
          Clear History
        </button>
      </div>
      
      <div className="space-y-3">
        {bets.map((bet, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {bet.botName === 'Alpha' && '🤖'}
                {bet.botName === 'Beta' && '🎯'}
                {bet.botName === 'Gamma' && '⚡'}
                {bet.botName === 'Delta' && '🔥'}
                {bet.botName === 'Epsilon' && '💎'}
                {bet.botName === 'Zeta' && '⭐'}
              </div>
              <div>
                <div className="font-semibold text-white">{bet.botName}</div>
                <div className="text-sm text-slate-400">
                  {bet.amount} SUI @ ${bet.odds.toFixed(2)} odds
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold">
                +{bet.potentialWin.toFixed(2)} SUI
              </div>
              <div className="text-xs text-slate-500">
                {bet.txDigest ? (
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${bet.txDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View TX ↗
                  </a>
                ) : (
                  <span className="text-slate-500">Pending</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          💾 Your bets are saved locally and will persist across page refreshes.
        </p>
      </div>
    </div>
  );
}
