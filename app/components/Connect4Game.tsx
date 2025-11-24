'use client';

import { useState, useEffect } from 'react';
import botsData from '@/data/botsData.json';
import { storeBattleData } from '@/utils/walrusClient';

const ROWS = 6;
const COLS = 7;

interface GameState {
  board: (number | null)[][];
  currentPlayer: number;
  winner: number | null;
  isComplete: boolean;
  moves: { col: number; player: number; bot: string }[];
}

interface Connect4GameProps {
  onBotsSelected?: (bots: Array<{ id: string; name: string; avatar: string; color: string; winRate: number; strategy: string; currentOdds: number; votes: number }>) => void;
}

export default function Connect4Game({ onBotsSelected = () => {} }: Connect4GameProps = {}) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    currentPlayer: 1,
    winner: null,
    isComplete: false,
    moves: [],
  });
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [simulatedMoves, setSimulatedMoves] = useState<number[]>([]);
  const [walrusBlobId, setWalrusBlobId] = useState<string | null>(null);
  const [walrusStatus, setWalrusStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [walrusError, setWalrusError] = useState<string | null>(null);

  // Select two random bots for battle
  const [bot1, setBot1] = useState(botsData.bots[0]);
  const [bot2, setBot2] = useState(botsData.bots[1]);

  // Randomize bots on component mount and notify parent
  useEffect(() => {
    randomizeBots();
  }, []);

  // Notify parent when bots change
  useEffect(() => {
    if (onBotsSelected) {
      onBotsSelected([bot1, bot2]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot1, bot2]);

  const randomizeBots = () => {
    const availableBots = [...botsData.bots];
    // Shuffle array
    for (let i = availableBots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableBots[i], availableBots[j]] = [availableBots[j], availableBots[i]];
    }
    setBot1(availableBots[0]);
    setBot2(availableBots[1]);
  };

  const startGame = () => {
    // Randomize bots for this game
    randomizeBots();
    
    // Generate a realistic Connect 4 game
    const moves = generateConnect4Game();
    setSimulatedMoves(moves);
    setGameStarted(true);
    setCurrentMoveIndex(0);
    setWalrusBlobId(null);
    setWalrusStatus('idle');
    setWalrusError(null);
    setGameState({
      board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
      currentPlayer: 1,
      winner: null,
      isComplete: false,
      moves: [],
    });
  };

  const generateConnect4Game = (): number[] => {
    // Generate a completely random Connect 4 game until someone wins
    const testBoard: (number | null)[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    const moves: number[] = [];
    let currentPlayer = 1;
    let winner = null;
    let moveCount = 0;
    const maxMoves = ROWS * COLS;

    while (!winner && moveCount < maxMoves) {
      // Get available columns
      const availableCols: number[] = [];
      for (let col = 0; col < COLS; col++) {
        if (testBoard[0][col] === null) {
          availableCols.push(col);
        }
      }

      if (availableCols.length === 0) break;

      // Pick random column
      const col = availableCols[Math.floor(Math.random() * availableCols.length)];
      
      // Find lowest empty row
      let row = ROWS - 1;
      while (row >= 0 && testBoard[row][col] !== null) {
        row--;
      }

      if (row >= 0) {
        testBoard[row][col] = currentPlayer;
        moves.push(col);
        moveCount++;

        // Check for winner
        winner = checkWinnerForGeneration(testBoard, row, col, currentPlayer);
        
        if (!winner) {
          currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
      }
    }

    return moves;
  };

  const checkWinnerForGeneration = (board: (number | null)[][], row: number, col: number, player: number): number | null => {
    // Check horizontal
    let count = 1;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    for (let c = col + 1; c < COLS && board[row][c] === player; c++) count++;
    if (count >= 4) return player;

    // Check vertical
    count = 1;
    for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
    for (let r = row + 1; r < ROWS && board[r][col] === player; r++) count++;
    if (count >= 4) return player;

    // Check diagonal \
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < ROWS && col + i < COLS && board[row + i][col + i] === player; i++) count++;
    if (count >= 4) return player;

    // Check diagonal /
    count = 1;
    for (let i = 1; row - i >= 0 && col + i < COLS && board[row - i][col + i] === player; i++) count++;
    for (let i = 1; row + i < ROWS && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    if (count >= 4) return player;

    return null;
  };

  useEffect(() => {
    if (gameStarted && currentMoveIndex < simulatedMoves.length && !gameState.isComplete) {
      const timer = setTimeout(() => {
        makeMove(simulatedMoves[currentMoveIndex]);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [gameStarted, currentMoveIndex, gameState.isComplete]);

  const makeMove = (col: number) => {
    const newBoard = gameState.board.map(row => [...row]);
    
    // Find the lowest empty row in the column
    let row = ROWS - 1;
    while (row >= 0 && newBoard[row][col] !== null) {
      row--;
    }

    if (row < 0) return; // Column is full

    newBoard[row][col] = gameState.currentPlayer;

    const winner = checkWinner(newBoard, row, col, gameState.currentPlayer);
    const botName = gameState.currentPlayer === 1 ? bot1.name : bot2.name;
    const newMoves = [...gameState.moves, { col, player: gameState.currentPlayer, bot: botName }];

    const newGameState = {
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
      winner: winner,
      isComplete: winner !== null,
      moves: newMoves,
    };

    setGameState(newGameState);
    setCurrentMoveIndex(currentMoveIndex + 1);

    // If game is complete, store on Walrus and save to history
    if (winner !== null) {
      storeBattleOnWalrus(newGameState, newMoves);
      saveGameToHistory(newGameState);
    }
  };

  const saveGameToHistory = (finalGameState: GameState) => {
    const winnerName = finalGameState.winner === 1 ? bot1.name : bot2.name;
    const winnerId = finalGameState.winner === 1 ? bot1.id : bot2.id;
    
    const gameRecord = {
      id: `game_${Date.now()}`,
      timestamp: Date.now(),
      bot1: {
        id: bot1.id,
        name: bot1.name,
        avatar: bot1.avatar,
        color: bot1.color,
      },
      bot2: {
        id: bot2.id,
        name: bot2.name,
        avatar: bot2.avatar,
        color: bot2.color,
      },
      winner: winnerName,
      winnerId: winnerId,
      moves: finalGameState.moves.length,
      walrusBlobId: null,
      gameNumber: 0,
    };

    // Load existing history
    const savedGames = localStorage.getItem('gameHistory');
    const history = savedGames ? JSON.parse(savedGames) : [];
    
    // Set game number
    gameRecord.gameNumber = history.length + 1;
    
    // Add new game
    history.push(gameRecord);
    
    // Save back
    localStorage.setItem('gameHistory', JSON.stringify(history));
    
    console.log('✅ Game saved to history:', gameRecord);
    
    // Update all pending bets
    updatePendingBets(winnerId, winnerName);
  };

  const updatePendingBets = (winnerId: string, winnerName: string) => {
    // Get all wallet addresses that might have bets
    const keys = Object.keys(localStorage);
    const betKeys = keys.filter(key => key.startsWith('bets_'));
    
    betKeys.forEach(key => {
      const betsData = localStorage.getItem(key);
      if (!betsData) return;
      
      const bets = JSON.parse(betsData);
      let updated = false;
      
      bets.forEach((bet: any) => {
        if (bet.result === 'pending' && bet.botId === winnerId) {
          bet.result = 'win';
          bet.payout = bet.potentialWin;
          updated = true;
          console.log(`✅ Bet ${bet.botName} marked as WIN! Payout: ${bet.payout}`);
        } else if (bet.result === 'pending' && bet.botId !== winnerId) {
          // Check if this bot was in the game
          const botWasInGame = bet.botId === bot1.id || bet.botId === bot2.id;
          if (botWasInGame) {
            bet.result = 'loss';
            bet.payout = 0;
            updated = true;
            console.log(`❌ Bet ${bet.botName} marked as LOSS`);
          }
        }
      });
      
      if (updated) {
        localStorage.setItem(key, JSON.stringify(bets));
      }
    });
  };

  const storeBattleOnWalrus = async (finalGameState: GameState, moves: any[]) => {
    setWalrusStatus('uploading');
    setWalrusError(null);
    
    try {
      const battleData: any = {
        battleId: `connect4_${Date.now()}`,
        agent1Id: bot1.id,
        agent2Id: bot2.id,
        agent1Name: bot1.name,
        agent2Name: bot2.name,
        timestamp: Date.now(),
        winner: finalGameState.winner === 1 ? bot1.name : bot2.name,
        isDraw: false,
        board: finalGameState.board.flat(),
        moves: moves.map((m, i) => ({
          position: m.col,
          player: m.bot,
          timestamp: Date.now() + i
        })),
        gameType: 'connect4',
      };

      console.log('🐘 Attempting to store on Walrus...', battleData);
      const blobId = await storeBattleData(battleData);
      
      setWalrusBlobId(blobId);
      setWalrusStatus('success');
      console.log('✅ SUCCESS! Battle stored on Walrus! Blob ID:', blobId);
    } catch (error) {
      console.error('❌ FAILED to store battle on Walrus:', error);
      setWalrusStatus('error');
      setWalrusError(error instanceof Error ? error.message : 'Unknown error');
      
      // Create mock blob ID for demo
      const mockBlobId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setWalrusBlobId(mockBlobId);
    }
  };

  const checkWinner = (board: (number | null)[][], row: number, col: number, player: number): number | null => {
    // Check horizontal
    let count = 1;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    for (let c = col + 1; c < COLS && board[row][c] === player; c++) count++;
    if (count >= 4) return player;

    // Check vertical
    count = 1;
    for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
    for (let r = row + 1; r < ROWS && board[r][col] === player; r++) count++;
    if (count >= 4) return player;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < ROWS && col + i < COLS && board[row + i][col + i] === player; i++) count++;
    if (count >= 4) return player;

    // Check diagonal (top-right to bottom-left)
    count = 1;
    for (let i = 1; row - i >= 0 && col + i < COLS && board[row - i][col + i] === player; i++) count++;
    for (let i = 1; row + i < ROWS && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    if (count >= 4) return player;

    return null;
  };

  const getCellColor = (value: number | null) => {
    if (value === 1) return bot1.color;
    if (value === 2) return bot2.color;
    return '#1e293b';
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">🎮 Connect 4 Battle</h2>
        {gameStarted && !gameState.isComplete && (
          <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-sm">Move {currentMoveIndex + 1}</span>
          </div>
        )}
      </div>

      {!gameStarted ? (
        <div>
          {/* Demo Notice */}
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <span>💡</span>
              <span><strong>Demo Mode:</strong> Manual launch to save gas. In production, games would auto-start.</span>
            </p>
          </div>

          <p className="text-slate-400 mb-4 text-sm">
            Watch AI bots battle in Connect 4. First to connect 4 pieces wins!
          </p>

          {/* Next Game Preview */}
          <div className="mb-4">
            <h3 className="text-[#BFFF00] font-bold text-base mb-3 flex items-center gap-2">
              <span>🎲</span>
              <span>Next Battle:</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Bot 1 */}
              <div className="bg-slate-800/50 rounded-xl p-3 border-2 border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <img src={bot1.avatar} alt={bot1.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{bot1.name}</p>
                    <p className="text-xs text-slate-400">{bot1.strategy}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className="font-bold text-[#BFFF00]">{bot1.winRate}%</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9FE000]"
                    style={{ width: `${bot1.winRate}%` }}
                  />
                </div>
              </div>

              {/* Bot 2 */}
              <div className="bg-slate-800/50 rounded-xl p-3 border-2 border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <img src={bot2.avatar} alt={bot2.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{bot2.name}</p>
                    <p className="text-xs text-slate-400">{bot2.strategy}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className="font-bold text-[#BFFF00]">{bot2.winRate}%</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#BFFF00] to-[#9FE000]"
                    style={{ width: `${bot2.winRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-3 bg-[#BFFF00] hover:bg-[#9FE000] text-black rounded-xl font-bold transition-all lime-glow flex items-center justify-center gap-2"
          >
            <span>⚔️ Launch Battle</span>
            <span className="text-xs opacity-75">(Manual for Demo)</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Players */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  gameState.currentPlayer === 1 && !gameState.isComplete ? 'animate-pulse' : 'opacity-50'
                }`}
                style={{ backgroundColor: bot1.color }}
              />
              <img src={bot1.avatar} alt={bot1.name} className="w-8 h-8 rounded-full" />
              <span className="font-semibold text-white text-sm">{bot1.name}</span>
            </div>
            <div className="text-slate-500 font-bold text-sm">VS</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{bot2.name}</span>
              <img src={bot2.avatar} alt={bot2.name} className="w-8 h-8 rounded-full" />
              <div
                className={`w-3 h-3 rounded-full ${
                  gameState.currentPlayer === 2 && !gameState.isComplete ? 'animate-pulse' : 'opacity-50'
                }`}
                style={{ backgroundColor: bot2.color }}
              />
            </div>
          </div>

          {/* Connect 4 Board */}
          <div className="bg-slate-800 rounded-xl p-2 mb-3">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
              {Array(ROWS).fill(null).map((_, rowIdx) =>
                Array(COLS).fill(null).map((_, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="aspect-square rounded-full border-2 border-slate-700 transition-all"
                    style={{
                      backgroundColor: getCellColor(gameState.board[rowIdx][colIdx]),
                      boxShadow: gameState.board[rowIdx][colIdx]
                        ? `0 0 20px ${getCellColor(gameState.board[rowIdx][colIdx])}50`
                        : 'none',
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Move Log */}
          {gameState.moves.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Battle Log:</h3>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {gameState.moves.slice(-5).map((move, idx) => (
                  <div key={idx} className="text-xs text-slate-300 bg-slate-800/50 p-1.5 rounded-lg">
                    <span style={{ color: getCellColor(move.player) }} className="font-semibold">
                      {move.bot}
                    </span>
                    {' '}dropped at column {move.col + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Result */}
          {gameState.isComplete && (
            <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-2xl font-bold text-white mb-2">
                  {gameState.winner === 1 ? bot1.name : bot2.name} Wins!
                </p>
                <p className="text-slate-400 mb-3">
                  Battle data stored on Walrus • Settlement on Sui blockchain
                </p>
                {/* Walrus Status */}
                <div className="mt-4 p-3 bg-[#BFFF00]/10 border border-[#BFFF00]/30 rounded-lg">
                  {walrusStatus === 'uploading' && (
                    <div className="text-center">
                      <p className="text-sm text-[#BFFF00]">🐘 Uploading to Walrus...</p>
                      <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-[#BFFF00] animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  
                  {walrusStatus === 'success' && walrusBlobId && (
                    <div>
                      <p className="text-xs text-green-300 mb-1">✅ Stored on Walrus!</p>
                      <p className="text-xs text-slate-300 mb-1">🐘 Blob ID:</p>
                      <p className="text-xs font-mono text-white break-all mb-2">{walrusBlobId}</p>
                      <div className="flex gap-2">
                        <a
                          href={`https://walruscan.com/testnet/blob/${walrusBlobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                        >
                          View on Walruscan 🔍
                        </a>
                        <img src={bot1.avatar} alt={bot1.name} className="w-8 h-8 rounded-full" />
                        <a
                          href={`https://aggregator.walrus-testnet.walrus.space/v1/${walrusBlobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-xs"
                        >
                          Raw Data ↗
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {walrusStatus === 'error' && (
                    <div>
                      <p className="text-xs text-red-300 mb-2">❌ Walrus Upload Failed</p>
                      <p className="text-xs text-slate-400 mb-2">{walrusError}</p>
                      <p className="text-xs text-yellow-300 mb-1">⚠️ Using Demo Mode (Blob ID for testing):</p>
                      <p className="text-xs font-mono text-slate-400 break-all">{walrusBlobId}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Note: Walrus testnet may be unavailable. Battle data saved locally.
                      </p>
                    </div>
                  )}
                  
                  {walrusStatus === 'idle' && (
                    <p className="text-xs text-slate-300">🐘 Preparing Walrus storage...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
