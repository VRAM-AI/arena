'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface Bet {
  botId: string;
  botName: string;
  amount: number;
  timestamp: number;
  result?: 'win' | 'loss' | 'pending';
  payout?: number;
}

interface PlayerStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayerStats({ isOpen, onClose }: PlayerStatsProps) {
  const account = useCurrentAccount();
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
  });

  useEffect(() => {
    if (account) {
      loadBets();
    }
  }, [account]);

  // Reload bets every 2 seconds to catch updates
  useEffect(() => {
    if (!account) return;
    
    const interval = setInterval(() => {
      loadBets();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [account]);

  const loadBets = () => {
    if (!account) return;
    
    const savedBets = localStorage.getItem(`bets_${account.address}`);
    console.log('Loading bets for:', account.address);
    console.log('Saved bets:', savedBets);
    
    if (savedBets) {
      try {
        const userBets = JSON.parse(savedBets);
        console.log('Parsed bets:', userBets);
        setBets(userBets);
        calculateStats(userBets);
      } catch (e) {
        console.error('Failed to load bets:', e);
      }
    } else {
      console.log('No bets found for this wallet');
      setBets([]);
    }
  };

  const calculateStats = (userBets: Bet[]) => {
    const totalBets = userBets.length;
    const wins = userBets.filter(b => b.result === 'win').length;
    const losses = userBets.filter(b => b.result === 'loss').length;
    const totalWagered = userBets.reduce((sum, b) => sum + b.amount, 0);
    const totalWon = userBets.reduce((sum, b) => sum + (b.payout || 0), 0);
    const netProfit = totalWon - totalWagered;

    setStats({
      totalBets,
      wins,
      losses,
      totalWagered,
      totalWon,
      netProfit,
    });
  };

  const hasBets = bets.length > 0;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Your Stats</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!account ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Connect wallet to view your stats and bets</p>
            </div>
          ) : (
            <div>
              {/* Win Rate */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Win Rate</span>
                  <span className="text-[#BFFF00] font-bold text-lg">
                    {stats.totalBets > 0 ? Math.round((stats.wins / stats.totalBets) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9FE000]"
                    style={{ width: `${stats.totalBets > 0 ? (stats.wins / stats.totalBets) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Wins</div>
                  <div className="text-2xl font-bold text-emerald-400">{stats.wins}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Losses</div>
                  <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Total Bets</div>
                  <div className="text-2xl font-bold text-white">{stats.totalBets}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Wagered</div>
                  <div className="text-2xl font-bold text-white">{stats.totalWagered.toFixed(1)}</div>
                </div>
              </div>

              {/* Net Profit */}
              <div className={`p-3 rounded-lg mb-4 ${stats.netProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Net Profit</span>
                  <span className={`text-xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)} SUI
                  </span>
                </div>
              </div>

              {/* Recent Bets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">All Bets</h4>
                  {hasBets && <span className="text-xs text-slate-500">{bets.length} total</span>}
                </div>
                
                {!hasBets ? (
                  <div className="bg-slate-800/30 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">🎲</div>
                    <p className="text-slate-400 text-sm">No bets placed yet</p>
                    <p className="text-slate-500 text-xs mt-1">Place your first bet to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bets.slice().reverse().map((bet, idx) => (
                      <div key={idx} className={`flex items-center justify-between text-sm rounded-lg p-3 border ${
                        bet.result === 'win' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        bet.result === 'loss' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-yellow-500/10 border-yellow-500/30'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-semibold">{bet.botName}</span>
                            <span className={`font-bold ${
                              bet.result === 'win' ? 'text-emerald-400' :
                              bet.result === 'loss' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {bet.result === 'win' ? `+${bet.payout?.toFixed(2)} SUI 🏆` :
                               bet.result === 'loss' ? `-${bet.amount} SUI ❌` :
                               '⏳ Pending'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-xs">
                            Bet: {bet.amount} SUI • {new Date(bet.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
