'use client';

import { useState } from 'react';
import WalletConnectV2 from '@/components/WalletConnectV2';
import AdminPanel from '@/components/AdminPanel';
import GameHistory from '@/components/GameHistory';
import PolymarketBettingV2 from '@/components/PolymarketBettingV2';
import Connect4Game from '@/components/Connect4Game';
import GameCounter from '@/components/GameCounter';

export default function Home() {
  const [currentGame, setCurrentGame] = useState(1);
  const totalGames = 3;
  const [nextGameBots, setNextGameBots] = useState<any[]>([]);

  const handleGameComplete = () => {
    setCurrentGame((prev) => Math.min(prev + 1, totalGames + 1));
  };

  const handleReset = () => {
    setCurrentGame(1);
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Admin Panel */}
        <AdminPanel />
        
        {/* Game History */}
        <GameHistory />
        
        {/* Top Bar - Logo and Wallet + Stats */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logoarena.png" 
              alt="AI Battle Arena" 
              className="h-20 w-auto"
            />
            <div className="hidden md:block">
              <div className="text-white font-bold text-sm">AI Battle Arena</div>
              <div className="text-slate-400 text-xs">Powered by Sui × Walrus</div>
            </div>
          </div>
          
          {/* Wallet in Top Right */}
          <div className="min-w-[320px]">
            <WalletConnectV2 />
          </div>
        </div>

        {/* Main Battle Arena - Full Width */}
        <div className="mb-4">
          <GameCounter
            totalGames={totalGames}
            currentGame={currentGame}
            onGameComplete={handleGameComplete}
            onReset={handleReset}
          />
        </div>

        {/* Main Layout: Battle Center, Betting Side */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: Betting */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <PolymarketBettingV2 nextBots={nextGameBots} />
          </div>

          {/* Center: Battle Arena */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {currentGame <= totalGames && (
              <Connect4Game 
                key={currentGame} 
                onBotsSelected={setNextGameBots}
              />
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-3 text-center">
            <div className="text-xl font-bold text-[#BFFF00]">1,250+</div>
            <div className="text-slate-400 text-xs">Total Bets</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-3 text-center">
            <div className="text-xl font-bold text-[#BFFF00]">$15.2K</div>
            <div className="text-slate-400 text-xs">Prize Pool</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-3 text-center">
            <div className="text-xl font-bold text-[#BFFF00]">6 Bots</div>
            <div className="text-slate-400 text-xs">Competing</div>
          </div>
        </div>
      </div>
    </main>
  );
}
