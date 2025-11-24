/**
 * Sui Client for interacting with arena_oracle smart contract
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';

// Initialize Sui client
export function getSuiClient(): SuiClient {
  return new SuiClient({ url: getFullnodeUrl(NETWORK as any) });
}

export interface Agent {
  id: string;
  name: string;
  strategy: string;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
}

export interface Battle {
  id: string;
  agent1Id: string;
  agent2Id: string;
  board: number[];
  currentTurn: number;
  winner: number;
  moveCount: number;
  walrusBlobId: string;
  isComplete: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  agentIds: string[];
  battleIds: string[];
  settled: boolean;
  winnerAgentId: string;
  totalBattles: number;
  walrusTournamentBlob: string;
  creator: string;
}

/**
 * Create a new agent on-chain
 */
export async function createAgent(
  name: string,
  strategy: string,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::create_agent`,
    arguments: [
      tx.pure(Array.from(new TextEncoder().encode(name))),
      tx.pure(Array.from(new TextEncoder().encode(strategy))),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  // For demo, return mock transaction
  return 'mock_tx_' + Date.now();
}

/**
 * Create a battle between two agents
 */
export async function createBattle(
  agent1Id: string,
  agent2Id: string,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::create_battle`,
    arguments: [
      tx.object(agent1Id),
      tx.object(agent2Id),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  return 'mock_tx_' + Date.now();
}

/**
 * Make a move in a battle
 */
export async function makeMove(
  battleId: string,
  position: number,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::make_move`,
    arguments: [
      tx.object(battleId),
      tx.pure(position),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  return 'mock_tx_' + Date.now();
}

/**
 * Create a tournament
 */
export async function createTournament(
  name: string,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::create_tournament`,
    arguments: [
      tx.pure(Array.from(new TextEncoder().encode(name))),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  return 'mock_tx_' + Date.now();
}

/**
 * Settle tournament with Walrus-verified data
 */
export async function settleTournament(
  tournamentId: string,
  winnerAgentId: string,
  walrusBlobId: string,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::settle_tournament`,
    arguments: [
      tx.object(tournamentId),
      tx.pure(winnerAgentId),
      tx.pure(Array.from(new TextEncoder().encode(walrusBlobId))),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  return 'mock_tx_' + Date.now();
}

/**
 * Create a prediction
 */
export async function createPrediction(
  tournamentId: string,
  agentId: string,
  stakeAmount: number,
  odds: number,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::create_prediction`,
    arguments: [
      tx.object(tournamentId),
      tx.object(agentId),
      tx.pure(stakeAmount),
      tx.pure(odds),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  return 'mock_tx_' + Date.now();
}

/**
 * Update battle with Walrus blob ID
 */
export async function updateBattleWalrusBlob(
  battleId: string,
  walrusBlobId: string,
  signer?: Ed25519Keypair
): Promise<string> {
  const client = getSuiClient();
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::arena_battle::update_battle_walrus_blob`,
    arguments: [
      tx.object(battleId),
      tx.pure(Array.from(new TextEncoder().encode(walrusBlobId))),
    ],
  });

  if (signer) {
    const result = await client.signAndExecuteTransactionBlock({
      signer,
      transaction: tx,
    });
    return result.digest;
  }

  return 'mock_tx_' + Date.now();
}

/**
 * Get agent details
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: agentId,
      options: { showContent: true },
    });

    if (object.data?.content && 'fields' in object.data.content) {
      const fields = object.data.content.fields as any;
      return {
        id: agentId,
        name: fields.name,
        strategy: fields.strategy,
        wins: Number(fields.wins),
        losses: Number(fields.losses),
        draws: Number(fields.draws),
        totalScore: Number(fields.total_score),
      };
    }
  } catch (error) {
    console.error('Error fetching agent:', error);
  }

  return null;
}

/**
 * Get battle details
 */
export async function getBattle(battleId: string): Promise<Battle | null> {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: battleId,
      options: { showContent: true },
    });

    if (object.data?.content && 'fields' in object.data.content) {
      const fields = object.data.content.fields as any;
      return {
        id: battleId,
        agent1Id: fields.agent1_id,
        agent2Id: fields.agent2_id,
        board: fields.board,
        currentTurn: fields.current_turn,
        winner: fields.winner,
        moveCount: Number(fields.move_count),
        walrusBlobId: fields.walrus_blob_id,
        isComplete: fields.is_complete,
      };
    }
  } catch (error) {
    console.error('Error fetching battle:', error);
  }

  return null;
}

/**
 * Get tournament details
 */
export async function getTournament(tournamentId: string): Promise<Tournament | null> {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: tournamentId,
      options: { showContent: true },
    });

    if (object.data?.content && 'fields' in object.data.content) {
      const fields = object.data.content.fields as any;
      return {
        id: tournamentId,
        name: fields.name,
        agentIds: fields.agent_ids,
        battleIds: fields.battle_ids,
        settled: fields.settled,
        winnerAgentId: fields.winner_agent_id,
        totalBattles: Number(fields.total_battles),
        walrusTournamentBlob: fields.walrus_tournament_blob,
        creator: fields.creator,
      };
    }
  } catch (error) {
    console.error('Error fetching tournament:', error);
  }

  return null;
}
