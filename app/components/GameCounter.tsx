'use client';

import { useState, useEffect } from 'react';

interface GameCounterProps {
  totalGames: number;
  currentGame: number;
  onGameComplete?: () => void;
  onReset?: () => void;
}

export default function GameCounter({ totalGames, currentGame, onGameComplete, onReset }: GameCounterProps) {
  const [timeUntilNext, setTimeUntilNext] = useState(60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || currentGame > totalGames) return;

    const interval = setInterval(() => {
      setTimeUntilNext((prev) => {
        if (prev <= 1) {
          if (currentGame < totalGames) {
            // Schedule callback outside render cycle
            setTimeout(() => onGameComplete?.(), 0);
            return 60;
          } else {
            setIsActive(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentGame, totalGames, onGameComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentGame - 1) / totalGames) * 100;

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Tournament Progress</h2>
          <p className="text-slate-400 text-sm mt-1">
            {currentGame > totalGames
              ? 'Tournament Complete!'
              : `Game ${currentGame} of ${totalGames}`}
          </p>
        </div>

        {currentGame <= totalGames ? (
          <div className="text-right">
            <div className="text-3xl font-bold text-[#BFFF00] font-mono">
              {formatTime(timeUntilNext)}
            </div>
            <div className="text-slate-400 text-sm">
              {currentGame < totalGames ? 'until next game' : 'game in progress'}
            </div>
          </div>
        ) : (
          <button
            onClick={onReset}
            className="px-6 py-3 bg-[#BFFF00] hover:bg-[#9FE000] text-black rounded-xl font-bold transition-all lime-glow"
          >
            🔄 Start New Tournament
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9FE000] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Game Status Indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalGames }).map((_, idx) => {
          const gameNum = idx + 1;
          const isComplete = gameNum < currentGame;
          const isCurrent = gameNum === currentGame;
          const isPending = gameNum > currentGame;

          return (
            <div key={idx} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-[#BFFF00] text-black animate-pulse'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {isComplete ? '✓' : gameNum}
                </div>
                <div
                  className={`text-xs mt-2 font-semibold ${
                    isComplete
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-[#BFFF00]'
                      : 'text-slate-500'
                  }`}
                >
                  {isComplete ? 'Done' : isCurrent ? 'Live' : 'Pending'}
                </div>
              </div>
              {idx < totalGames - 1 && (
                <div
                  className={`h-1 flex-1 transition-all ${
                    isComplete ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Live Indicator */}
      {currentGame <= totalGames && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-slate-400">Game in progress</span>
        </div>
      )}

      {/* Completion Message */}
      {currentGame > totalGames && (
        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/50">
          <p className="text-center text-emerald-400 font-semibold">
            🎉 Tournament Complete! Check results below.
          </p>
        </div>
      )}
    </div>
  );
}
