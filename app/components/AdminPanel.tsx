'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  strategy: string;
  color: string;
  wins: number;
  losses: number;
}

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'bot_1', name: 'Alpha', avatar: '🤖', strategy: 'Aggressive', color: '#BFFF00', wins: 45, losses: 23 },
    { id: 'bot_2', name: 'Beta', avatar: '🎯', strategy: 'Balanced', color: '#00E5FF', wins: 38, losses: 30 },
    { id: 'bot_3', name: 'Gamma', avatar: '⚡', strategy: 'Defensive', color: '#FF00E5', wins: 42, losses: 26 },
  ]);
  
  const [newAgent, setNewAgent] = useState({
    name: '',
    avatar: '🤖',
    strategy: 'Balanced',
    color: '#BFFF00',
  });

  const addAgent = () => {
    if (!newAgent.name) return;
    
    const agent: Agent = {
      id: `bot_${Date.now()}`,
      ...newAgent,
      wins: 0,
      losses: 0,
    };
    
    setAgents([...agents, agent]);
    setNewAgent({ name: '', avatar: '🤖', strategy: 'Balanced', color: '#BFFF00' });
  };

  const deleteAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#BFFF00] text-black flex items-center justify-center text-2xl hover:scale-110 transition-transform lime-glow z-50"
        title="Admin Panel"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#111111] rounded-2xl border border-[#BFFF00]/20 lime-glow max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#111111] border-b border-[#BFFF00]/20 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-lime">Admin Panel</h2>
            <p className="text-[#A0A0A0] text-sm mt-1">Manage AI agents and settings</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Create Agent */}
          <div>
            <h3 className="text-lg font-semibold text-[#BFFF00] mb-4">➕ Create New Agent</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Agent Name"
                value={newAgent.name}
                onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                className="px-4 py-3 bg-black border border-[#BFFF00]/20 rounded-lg text-white focus:border-[#BFFF00] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Emoji"
                value={newAgent.avatar}
                onChange={(e) => setNewAgent({...newAgent, avatar: e.target.value})}
                className="px-4 py-3 bg-black border border-[#BFFF00]/20 rounded-lg text-white focus:border-[#BFFF00] focus:outline-none text-center text-2xl"
              />
              <select
                value={newAgent.strategy}
                onChange={(e) => setNewAgent({...newAgent, strategy: e.target.value})}
                className="px-4 py-3 bg-black border border-[#BFFF00]/20 rounded-lg text-white focus:border-[#BFFF00] focus:outline-none"
              >
                <option value="Aggressive">Aggressive</option>
                <option value="Balanced">Balanced</option>
                <option value="Defensive">Defensive</option>
                <option value="Random">Random</option>
                <option value="Calculated">Calculated</option>
              </select>
              <input
                type="color"
                value={newAgent.color}
                onChange={(e) => setNewAgent({...newAgent, color: e.target.value})}
                className="w-full h-12 bg-black border border-[#BFFF00]/20 rounded-lg cursor-pointer"
              />
            </div>
            <button
              onClick={addAgent}
              className="mt-4 px-6 py-3 bg-[#BFFF00] text-black rounded-lg font-semibold hover:bg-[#9FE000] transition w-full"
            >
              Create Agent
            </button>
          </div>

          {/* Agent List */}
          <div>
            <h3 className="text-lg font-semibold text-[#BFFF00] mb-4">🤖 Manage Agents ({agents.length})</h3>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-black/50 border border-[#BFFF00]/10 rounded-lg p-4 flex items-center justify-between hover:border-[#BFFF00]/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{agent.avatar}</div>
                    <div>
                      <div className="font-semibold text-white">{agent.name}</div>
                      <div className="text-sm text-[#A0A0A0]">{agent.strategy}</div>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: agent.color }}
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-[#BFFF00]">{agent.wins}W</span>
                      <span className="text-[#A0A0A0] mx-2">/</span>
                      <span className="text-red-400">{agent.losses}L</span>
                    </div>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/50 border border-[#BFFF00]/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#BFFF00]">{agents.length}</div>
              <div className="text-sm text-[#A0A0A0] mt-1">Total Agents</div>
            </div>
            <div className="bg-black/50 border border-[#BFFF00]/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#BFFF00]">
                {agents.reduce((sum, a) => sum + a.wins, 0)}
              </div>
              <div className="text-sm text-[#A0A0A0] mt-1">Total Wins</div>
            </div>
            <div className="bg-black/50 border border-[#BFFF00]/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#BFFF00]">
                {agents.reduce((sum, a) => sum + a.wins + a.losses, 0)}
              </div>
              <div className="text-sm text-[#A0A0A0] mt-1">Total Battles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
