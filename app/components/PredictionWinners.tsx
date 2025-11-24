'use client';

import { useState, useEffect } from 'react';
import predictions from '@/data/predictions.json';

interface PredictionRecord {
  prediction_id: string;
  predictor: string;
  predicted_winner: string;
  stake: number;
  odds: number;
  outcome: string;
  payout: number;
}

export default function PredictionWinners() {
  const [showResults, setShowResults] = useState(false);
  const [totalPayout, setTotalPayout] = useState(0);

  useEffect(() => {
    if (showResults) {
      const total = (predictions.predictions as PredictionRecord[])
        .filter((p: PredictionRecord) => p.outcome === 'correct')
        .reduce((sum: number, p: PredictionRecord) => sum + p.payout, 0);
      setTotalPayout(total);
    }
  }, [showResults]);

  return (
    <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        💰 Prediction Market Results
      </h2>

      {!showResults ? (
        <button
          onClick={() => setShowResults(true)}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
        >
          📊 Show Prediction Winners
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-400 font-bold text-lg">
              Total Payouts: ${totalPayout}
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(predictions.predictions as PredictionRecord[]).map((pred: PredictionRecord) => (
              <div
                key={pred.prediction_id}
                className={`p-3 rounded border ${
                  pred.outcome === 'correct'
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-red-500/50 bg-red-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{pred.predictor}</p>
                    <p className="text-xs text-gray-400">
                      Predicted: {pred.predicted_winner} | Stake: ${pred.stake}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        pred.outcome === 'correct'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {pred.outcome === 'correct' ? '✓' : '✗'}
                    </p>
                    <p className="text-sm text-gray-400">
                      ${pred.payout}
                    </p>
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
