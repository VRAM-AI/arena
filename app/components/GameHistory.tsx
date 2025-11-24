'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface GameRecord {
  id: string;
  timestamp: number;
  bot1: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  bot2: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  winner: string;
  moves: number;
  walrusBlobId?: string;
  gameNumber: number;
}

export default function GameHistory() {
  const account = useCurrentAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [stats, setStats] = useState<Record<string, { wins: number; losses: number }>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedGames = localStorage.getItem('gameHistory');
    if (savedGames) {
      try {
        const history = JSON.parse(savedGames);
        setGames(history);
        calculateStats(history);
      } catch (e) {
        console.error('Failed to load game history:', e);
      }
    }
  };

  const calculateStats = (history: GameRecord[]) => {
    const botStats: Record<string, { wins: number; losses: number }> = {};
    
    history.forEach(game => {
      // Initialize bot stats if needed
      if (!botStats[game.bot1.id]) {
        botStats[game.bot1.id] = { wins: 0, losses: 0 };
      }
      if (!botStats[game.bot2.id]) {
        botStats[game.bot2.id] = { wins: 0, losses: 0 };
      }

      // Count wins and losses
      if (game.winner === game.bot1.name) {
        botStats[game.bot1.id].wins++;
        botStats[game.bot2.id].losses++;
      } else {
        botStats[game.bot2.id].wins++;
        botStats[game.bot1.id].losses++;
      }
    });

    setStats(botStats);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all game history?')) {
      localStorage.removeItem('gameHistory');
      setGames([]);
      setStats({});
    }
  };

  const getWinRate = (botId: string) => {
    const botStat = stats[botId];
    if (!botStat) return 0;
    const total = botStat.wins + botStat.losses;
    if (total === 0) return 0;
    return Math.round((botStat.wins / total) * 100);
  };

  return (
    <>
      {/* History Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-[#BFFF00] hover:bg-[#9FE000] text-black px-4 py-3 rounded-xl font-bold shadow-lg lime-glow transition-all flex items-center gap-2"
      >
        📊 History
        {games.length > 0 && (
          <span className="bg-black text-[#BFFF00] px-2 py-0.5 rounded-full text-xs">
            {games.length}
          </span>
        )}
      </button>

      {/* History Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Game History</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {games.length} games played
                </p>
              </div>
              <div className="flex items-center gap-2">
                {games.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition"
                  >
                    Clear History
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* AI Stats Summary */}
            {Object.keys(stats).length > 0 && (
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">AI Performance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats).map(([botId, stat]) => {
                    const game = games.find(g => g.bot1.id === botId || g.bot2.id === botId);
                    const bot = game?.bot1.id === botId ? game.bot1 : game?.bot2;
                    if (!bot) return null;

                    const winRate = getWinRate(botId);
                    const total = stat.wins + stat.losses;

                    return (
                      <div key={botId} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full" />
                          <div className="flex-1">
                            <div className="text-white font-bold text-sm">{bot.name}</div>
                            <div className="text-xs text-slate-400">{total} games</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Win Rate</span>
                          <span className="text-[#BFFF00] font-bold">{winRate}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9FE000]"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-emerald-400">{stat.wins}W</span>
                          <span className="text-red-400">{stat.losses}L</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Game List */}
            <div className="flex-1 overflow-y-auto p-6">
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎮</div>
                  <p className="text-slate-400">No games played yet</p>
                  <p className="text-slate-500 text-sm mt-1">Start a battle to see history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {games.slice().reverse().map((game, idx) => (
                    <div
                      key={game.id}
                      className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-[#BFFF00]/30 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm font-mono">
                            Game #{game.gameNumber}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 text-xs">
                            {new Date(game.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {game.moves} moves
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Bot 1 */}
                        <div className="flex items-center gap-2">
                          <img src={game.bot1.avatar} alt={game.bot1.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <div className={`font-bold text-sm ${game.winner === game.bot1.name ? 'text-[#BFFF00]' : 'text-white'}`}>
                              {game.bot1.name}
                              {game.winner === game.bot1.name && ' 🏆'}
                            </div>
                          </div>
                        </div>

                        <div className="text-slate-500 font-bold text-sm">VS</div>

                        {/* Bot 2 */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`font-bold text-sm ${game.winner === game.bot2.name ? 'text-[#BFFF00]' : 'text-white'}`}>
                              {game.winner === game.bot2.name && '🏆 '}
                              {game.bot2.name}
                            </div>
                          </div>
                          <img src={game.bot2.avatar} alt={game.bot2.name} className="w-10 h-10 rounded-full" />
                        </div>
                      </div>

                      {/* Walrus Link */}
                      {game.walrusBlobId && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <a
                            href={`https://walruscan.com/testnet/blob/${game.walrusBlobId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            🐘 View on Walrus ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
