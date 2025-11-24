'use client';

import { useEffect, useState } from 'react';
import agentData from '@/data/agentData.json';

export default function TournamentStatus() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAgents(agentData.agents);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">Tournament: {agentData.tournament_name}</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">⚙️</div>
          <p className="text-gray-400 mt-2">Loading agent data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent, idx) => (
            <div
              key={agent.id}
              className={`p-4 rounded-lg border ${
                agent.roi > 0
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-red-500/50 bg-red-500/10'
              }`}
            >
              <h3 className="font-bold text-white">{agent.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{agent.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ROI:</span>
                  <span className={agent.roi > 0 ? 'text-green-400' : 'text-red-400'}>
                    {agent.roi > 0 ? '+' : ''}{agent.roi}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-blue-400">{agent.wins}/{agent.wins + agent.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe:</span>
                  <span className="text-[#BFFF00]">{agent.sharpe_ratio}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-600">
                <p className="text-xs text-gray-500">Agent #{idx + 1}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
