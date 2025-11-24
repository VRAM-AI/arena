'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import botsData from '@/data/botsData.json';

interface PolymarketBettingV2Props {
  nextBots?: Array<{ id: string; name: string; avatar: string; color: string; winRate: number; strategy: string; currentOdds: number; votes: number }>;
}

export default function PolymarketBettingV2({ nextBots }: PolymarketBettingV2Props) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betPlaced, setBetPlaced] = useState(false);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load bets from localStorage on mount
  useEffect(() => {
    if (account) {
      const savedBets = localStorage.getItem(`bets_${account.address}`);
      if (savedBets) {
        try {
          setUserBets(JSON.parse(savedBets));
        } catch (e) {
          console.error('Failed to load saved bets:', e);
        }
      }
    }
  }, [account]);

  // Reload bets periodically to catch updates from game results
  useEffect(() => {
    if (!account) return;
    
    const interval = setInterval(() => {
      const savedBets = localStorage.getItem(`bets_${account.address}`);
      if (savedBets) {
        try {
          const bets = JSON.parse(savedBets);
          setUserBets(bets);
        } catch (e) {
          console.error('Failed to reload bets:', e);
        }
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [account]);

  // Use provided nextBots if available, otherwise fallback to first 2 from botsData
  const bots = nextBots || botsData.bots.slice(0, 2);

  const placeBet = async () => {
    if (!selectedBot || !account) {
      alert('Please connect your Sui wallet first!');
      return;
    }

    setIsProcessing(true);
    const bot = bots.find(b => b.id === selectedBot);

    try {
      const tx = new Transaction();
      tx.setSender(account.address);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            const newBet = {
              botId: selectedBot,
              botName: bot?.name,
              amount: betAmount,
              odds: bot?.currentOdds || 0.5,
              potentialWin: betAmount / (bot?.currentOdds || 0.5),
              timestamp: Date.now(),
              txDigest: result.digest,
              result: 'pending' as 'pending' | 'win' | 'loss',
              payout: 0,
            };

            // Save to user-specific bets
            const savedBets = localStorage.getItem(`bets_${account.address}`);
            const allBets = savedBets ? JSON.parse(savedBets) : [];
            allBets.push(newBet);
            localStorage.setItem(`bets_${account.address}`, JSON.stringify(allBets));

            const updatedBets = [...userBets, newBet];
            setUserBets(updatedBets);
            setBetPlaced(true);
            setIsProcessing(false);

            console.log('✅ Bet placed and saved:', newBet);

            setTimeout(() => {
              setBetPlaced(false);
              setSelectedBot(null);
              setBetAmount(10);
            }, 3000);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
            setIsProcessing(false);
          },
        },
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error: ' + (error as Error).message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Prediction Market</h2>
            <p className="text-slate-400 text-xs mt-1">Who will win?</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#BFFF00]">$1250</div>
            <div className="text-slate-400 text-xs">Prize Pool</div>
          </div>
        </div>
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {bots.map((bot) => {
          const isSelected = selectedBot === bot.id;
          const winChance = Math.round((1 - bot.currentOdds) * 100);

          return (
            <button
              key={bot.id}
              onClick={() => setSelectedBot(bot.id)}
              className={`relative bg-slate-800/50 rounded-xl border-2 p-3 transition-all hover:scale-[1.02] ${
                isSelected
                  ? 'border-[#BFFF00] lime-glow'
                  : 'border-slate-700 hover:border-[#BFFF00]/50'
              }`}
            >
              {/* Win Rate Badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900 rounded-full text-xs font-semibold text-[#BFFF00]">
                {bot.winRate}%
              </div>

              {/* Bot Info */}
              <div className="flex items-center gap-2 mb-2">
                <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full" />
                <div className="text-left flex-1">
                  <div className="font-bold text-white text-sm">{bot.name}</div>
                  <div className="text-xs text-slate-400">{bot.strategy}</div>
                </div>
              </div>

              {/* Win Chance */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Win Chance</span>
                  <span className="text-xs font-bold text-[#BFFF00]">{winChance}%</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9FE000] transition-all"
                    style={{ width: `${winChance}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Odds:</span>
                  <span className="ml-1 font-semibold text-white">${bot.currentOdds.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Votes:</span>
                  <span className="ml-1 font-semibold text-white">{bot.votes}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bet Input */}
      {selectedBot && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4">
          <h3 className="text-base font-bold text-white mb-3">Place Your Bet</h3>

          {/* Amount */}
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-2">Bet Amount (SUI)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-semibold focus:border-[#BFFF00] focus:outline-none"
              />
              {[10, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs rounded-lg transition"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#F7F7F8] rounded-lg p-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Selected Bot:</span>
              <span className="text-[#1A1A1A] font-semibold">
                {bots.find(b => b.id === selectedBot)?.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Your Bet:</span>
              <span className="text-[#1A1A1A] font-semibold">{betAmount} SUI</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E5E5E5]">
              <span className="text-[#6B6B6B]">Potential Win:</span>
              <span className="text-[#1A1A1A] font-bold text-lg">
                {(betAmount / (bots.find(b => b.id === selectedBot)?.currentOdds || 0.5)).toFixed(2)} SUI
              </span>
            </div>
          </div>

          {/* Place Bet Button */}
          <button
            onClick={placeBet}
            disabled={betAmount <= 0 || !account || isProcessing}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              betAmount > 0 && account && !isProcessing
                ? 'bg-[#BFFF00] text-black hover:bg-[#9FE000] lime-glow'
                : 'bg-[#E5E5E5] text-[#6B6B6B] cursor-not-allowed'
            }`}
          >
            {isProcessing ? '⏳ Processing...' : betPlaced ? '✓ Bet Placed!' : account ? 'Place Bet' : 'Connect Wallet First'}
          </button>

          <p className="text-xs text-[#6B6B6B] text-center mt-3">
            {account ? '🔐 Secured by Sui Wallet' : '⚠️ Connect your wallet to place bets'}
          </p>
        </div>
      )}
    </div>
  );
}
