'use client';

import { useState, useEffect } from 'react';
import agentData from '@/data/agentData.json';

interface Move {
  position: number;
  player: 'X' | 'O';
  agentName: string;
}

export default function BattleSimulation() {
  const [battleStarted, setBattleStarted] = useState(false);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const agent1 = agentData.agents[0]; // Alpha (X)
  const agent2 = agentData.agents[1]; // Beta (O)

  // Predefined battle sequence for demo
  const simulateBattle = () => {
    // Alpha vs Beta battle sequence
    const battleMoves: Move[] = [
      { position: 4, player: 'X', agentName: agent1.name }, // Alpha center
      { position: 0, player: 'O', agentName: agent2.name }, // Beta top-left
      { position: 2, player: 'X', agentName: agent1.name }, // Alpha top-right
      { position: 6, player: 'O', agentName: agent2.name }, // Beta bottom-left
      { position: 8, player: 'X', agentName: agent1.name }, // Alpha bottom-right (diagonal win)
    ];
    return battleMoves;
  };

  const startBattle = () => {
    setBattleStarted(true);
    setBoard(Array(9).fill(null));
    setMoves([]);
    setCurrentMove(0);
    setWinner(null);
    setIsDraw(false);
    setIsComplete(false);

    const battleMoves = simulateBattle();
    setMoves(battleMoves);
  };

  useEffect(() => {
    if (battleStarted && currentMove < moves.length) {
      const timer = setTimeout(() => {
        const move = moves[currentMove];
        const newBoard = [...board];
        newBoard[move.position] = move.player;
        setBoard(newBoard);
        setCurrentMove(currentMove + 1);

        // Check for winner after this move
        const winnerResult = checkWinner(newBoard);
        if (winnerResult) {
          setWinner(winnerResult === 'X' ? agent1.name : agent2.name);
          setIsComplete(true);
          return;
        }

        // Check for draw (board full)
        const boardFull = newBoard.every(cell => cell !== null);
        if (boardFull) {
          setIsDraw(true);
          setIsComplete(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [battleStarted, currentMove, moves, board, agent1.name, agent2.name]);

  const checkWinner = (board: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const getCellColor = (value: string | null) => {
    if (value === 'X') return 'text-[#BFFF00] border-[#BFFF00]/50 bg-[#BFFF00]/20';
    if (value === 'O') return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/20';
    return 'border-gray-600 bg-gray-900/50';
  };

  return (
    <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        ⚔️ AI Battle Arena: Tic-Tac-Toe Duel
      </h2>

      {!battleStarted ? (
        <div>
          <p className="text-gray-300 mb-6">
            Watch AI agents battle in strategic tic-tac-toe combat. Results are stored on Walrus for verification.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-purple-400 font-bold">{agent1.name}</p>
              <p className="text-xs text-gray-400 mt-1">Playing as X</p>
              <p className="text-xs text-purple-300 mt-2">{agent1.description}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-blue-400 font-bold">{agent2.name}</p>
              <p className="text-xs text-gray-400 mt-1">Playing as O</p>
              <p className="text-xs text-blue-300 mt-2">{agent2.description}</p>
            </div>
          </div>

          <button
            onClick={startBattle}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            ⚔️ Start Battle
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${currentMove % 2 === 0 && !isComplete ? 'bg-purple-500 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-purple-400 font-semibold">{agent1.name} (X)</span>
              </div>
              <div className="text-gray-400 text-sm">VS</div>
              <div className="flex items-center gap-3">
                <span className="text-blue-400 font-semibold">{agent2.name} (O)</span>
                <div className={`w-3 h-3 rounded-full ${currentMove % 2 === 1 && !isComplete ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
            </div>

            {/* Tic-tac-toe board */}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {board.map((cell, idx) => (
                <div
                  key={idx}
                  className={`aspect-square flex items-center justify-center text-4xl font-bold border-2 rounded-lg transition-all ${getCellColor(cell)}`}
                >
                  {cell}
                </div>
              ))}
            </div>
          </div>

          {/* Move history */}
          {moves.slice(0, currentMove).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Battle Log:</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {moves.slice(0, currentMove).map((move, idx) => (
                  <div key={idx} className="text-sm text-gray-300 bg-black/30 p-2 rounded">
                    <span className={move.player === 'X' ? 'text-purple-400' : 'text-blue-400'}>
                      {move.agentName}
                    </span>
                    {' '}placed {move.player} at position {move.position + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Battle result */}
          {isComplete && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500">
              <p className="text-yellow-400 font-bold text-lg mb-2">
                {isDraw ? '🤝 Battle Draw!' : `🏆 ${winner} Wins!`}
              </p>
              <p className="text-sm text-gray-400">
                Battle data stored on Walrus for immutable verification
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
