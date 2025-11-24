'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import botsData from '@/data/botsData.json';

export default function PolymarketBetting() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betPlaced, setBetPlaced] = useState(false);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load bets from localStorage on mount
  useEffect(() => {
    const savedBets = localStorage.getItem('userBets');
    if (savedBets) {
      try {
        setUserBets(JSON.parse(savedBets));
      } catch (e) {
        console.error('Failed to load saved bets:', e);
      }
    }
  }, []);

  // Save bets to localStorage whenever they change
  useEffect(() => {
    if (userBets.length > 0) {
      localStorage.setItem('userBets', JSON.stringify(userBets));
    }
  }, [userBets]);

  const bots = botsData.bots;

  const handleVote = (botId: string) => {
    setSelectedBot(botId);
  };

  const placeBet = async () => {
    if (!selectedBot || !account) {
      alert('Please connect your Sui wallet first!');
      return;
    }

    setIsProcessing(true);
    const bot = bots.find(b => b.id === selectedBot);

    try {
      // Create transaction for placing prediction
      const tx = new Transaction();
      
      // For demo: Just sign a simple transaction
      // In production, this would call your smart contract:
      // tx.moveCall({
      //   target: `${PACKAGE_ID}::connect4_battle::place_prediction`,
      //   arguments: [
      //     tx.object(tournamentId),
      //     tx.pure(selectedBot),
      //     tx.pure(Math.floor(bot.currentOdds * 10000)),
      //     tx.splitCoins(tx.gas, [tx.pure(betAmount * 1000000000)]) // SUI amount
      //   ],
      // });

      // For now, create a demo transaction that user signs
      tx.setSender(account.address);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            
            const newBet = {
              botId: selectedBot,
              botName: bot?.name,
              amount: betAmount,
              odds: bot?.currentOdds || 0.5,
              potentialWin: betAmount / (bot?.currentOdds || 0.5),
              timestamp: Date.now(),
              txDigest: result.digest,
            };

            const updatedBets = [...userBets, newBet];
            setUserBets(updatedBets);
            setBetPlaced(true);
            setIsProcessing(false);

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
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Prediction Market</h2>
            <p className="text-slate-400 text-sm mt-1">Who will win the next battle?</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">${botsData.prizePool}</div>
            <div className="text-slate-400 text-sm">Prize Pool</div>
          </div>
        </div>

        {/* Bots Grid - Polymarket Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bots.map((bot) => {
            const isSelected = selectedBot === bot.id;
            const probability = (1 - bot.currentOdds) * 100;

            return (
              <button
                key={bot.id}
                onClick={() => handleVote(bot.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 scale-105'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {/* Bot Avatar */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: bot.color + '20' }}
                  >
                    {bot.avatar}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-white">{bot.name}</div>
                    <div className="text-xs text-slate-400">{bot.strategy}</div>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Win Chance</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {probability.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-700">
                  <div>
                    <span className="text-slate-500">Odds:</span>
                    <span className="ml-1 font-semibold text-white">
                      ${bot.currentOdds.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Votes:</span>
                    <span className="ml-1 font-semibold text-white">{bot.votes}</span>
                  </div>
                </div>

                {/* Win Rate Badge */}
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 bg-slate-900/80 rounded-full text-xs font-semibold text-white">
                    {bot.winRate}% WR
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 rounded-xl border-2 border-emerald-500 pointer-events-none animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bet Input - Polymarket Style */}
      {selectedBot && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Place Your Bet</h3>

          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Bet Amount (SUI)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => setBetAmount(10)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm transition"
                >
                  10
                </button>
                <button
                  onClick={() => setBetAmount(50)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm transition"
                >
                  50
                </button>
                <button
                  onClick={() => setBetAmount(100)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm transition"
                >
                  100
                </button>
              </div>
            </div>

            {/* Bet Summary */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Bot:</span>
                <span className="text-white font-semibold">
                  {bots.find(b => b.id === selectedBot)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Your Bet:</span>
                <span className="text-white font-semibold">{betAmount} SUI</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Current Odds:</span>
                <span className="text-white font-semibold">
                  ${bots.find(b => b.id === selectedBot)?.currentOdds.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-400">Potential Payout:</span>
                <span className="text-emerald-400 font-bold text-lg">
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
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/50'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? '⏳ Processing...' : betPlaced ? '✓ Bet Placed!' : account ? 'Sign & Place Bet' : 'Connect Wallet First'}
            </button>

            <p className="text-xs text-slate-500 text-center">
              {account ? '🔐 Transaction will be signed with your Sui wallet' : '⚠️ Connect your Sui wallet to place bets'}
            </p>
          </div>
        </div>
      )}

      {/* Your Bets */}
      {userBets.length > 0 && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Your Active Bets</h3>
          <div className="space-y-3">
            {userBets.map((bet, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">
                    {bots.find(b => b.id === bet.botId)?.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{bet.botName}</div>
                    <div className="text-sm text-slate-400">
                      {bet.amount} SUI @ ${bet.odds.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">+{bet.potentialWin.toFixed(2)} SUI</div>
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
                    ) : 'if wins'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
