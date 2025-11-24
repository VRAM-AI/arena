'use client';

import { useState } from 'react';
import agentData from '@/data/agentData.json';

interface Prediction {
  agentId: string;
  agentName: string;
  stake: number;
  odds: number;
  potentialPayout: number;
}

interface PredictionInterfaceProps {
  onPredictionMade?: (prediction: Prediction) => void;
}

export default function PredictionInterface({ onPredictionMade }: PredictionInterfaceProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [predictionMade, setPredictionMade] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);

  const agents = agentData.agents;

  // Calculate odds based on agent performance (simplified)
  const calculateOdds = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return 2.0;
    
    // Better performing agents have lower odds (less payout multiplier)
    const winRate = agent.wins / (agent.wins + agent.losses || 1);
    if (winRate > 0.6) return 1.5;
    if (winRate > 0.5) return 2.0;
    return 2.5;
  };

  const handlePlacePrediction = () => {
    if (!selectedAgent || stakeAmount <= 0) return;

    const odds = calculateOdds(selectedAgent);
    const agent = agents.find(a => a.id === selectedAgent);
    
    const prediction: Prediction = {
      agentId: selectedAgent,
      agentName: agent?.name || '',
      stake: stakeAmount,
      odds: odds,
      potentialPayout: stakeAmount * odds,
    };

    setCurrentPrediction(prediction);
    setPredictionMade(true);
    
    if (onPredictionMade) {
      onPredictionMade(prediction);
    }
  };

  const handleReset = () => {
    setSelectedAgent('');
    setStakeAmount(100);
    setPredictionMade(false);
    setCurrentPrediction(null);
  };

  return (
    <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        💰 Prediction Market
      </h2>

      {!predictionMade ? (
        <div>
          <p className="text-gray-300 mb-6">
            Place your prediction on which AI agent will win the tournament. Higher risk = higher rewards!
          </p>

          {/* Agent Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Select Agent to Back:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const odds = calculateOdds(agent.id);
                const isSelected = selectedAgent === agent.id;
                
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-white mb-1">{agent.name}</p>
                      <p className="text-xs text-gray-400 mb-2">{agent.description}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-600">
                        <div>
                          <p className="text-xs text-gray-500">Win Rate</p>
                          <p className="text-sm font-semibold text-green-400">
                            {((agent.wins / (agent.wins + agent.losses)) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Odds</p>
                          <p className="text-sm font-semibold text-yellow-400">{odds}x</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake Amount */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">
              Stake Amount (SUI):
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="1000"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStakeAmount(50)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
                >
                  50
                </button>
                <button
                  onClick={() => setStakeAmount(100)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
                >
                  100
                </button>
                <button
                  onClick={() => setStakeAmount(500)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
                >
                  500
                </button>
              </div>
            </div>
          </div>

          {/* Prediction Summary */}
          {selectedAgent && (
            <div className="mb-6 p-4 bg-black/30 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Prediction Summary:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Agent:</span>
                  <span className="text-white font-semibold">
                    {agents.find(a => a.id === selectedAgent)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stake:</span>
                  <span className="text-white font-semibold">{stakeAmount} SUI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Odds:</span>
                  <span className="text-yellow-400 font-semibold">
                    {calculateOdds(selectedAgent)}x
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Potential Payout:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {(stakeAmount * calculateOdds(selectedAgent)).toFixed(2)} SUI
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Place Prediction Button */}
          <button
            onClick={handlePlacePrediction}
            disabled={!selectedAgent || stakeAmount <= 0}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
              selectedAgent && stakeAmount > 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            💰 Place Prediction
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Note: Demo mode - no real SUI required. In production, this would connect to your Sui wallet.
          </p>
        </div>
      ) : (
        <div>
          {/* Prediction Confirmed */}
          <div className="p-6 bg-emerald-500/10 rounded-lg border border-emerald-500 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Prediction Placed!</h3>
                <p className="text-sm text-gray-400">Your prediction has been recorded</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Backing:</span>
                <span className="text-white font-semibold">{currentPrediction?.agentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Staked:</span>
                <span className="text-white font-semibold">{currentPrediction?.stake} SUI</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Odds:</span>
                <span className="text-yellow-400 font-semibold">{currentPrediction?.odds}x</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-green-500/30">
                <span className="text-gray-400">If Wins, You Get:</span>
                <span className="text-green-400 font-bold text-lg">
                  {currentPrediction?.potentialPayout.toFixed(2)} SUI
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">📊 On-Chain Status:</span> In production, this prediction 
              would be stored on the Sui blockchain via the <code className="text-blue-400">create_prediction()</code> function, 
              and the Walrus blob ID would be recorded for verification.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            Place Another Prediction
          </button>
        </div>
      )}
    </div>
  );
}
