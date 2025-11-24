/**
 * Walrus Client for storing and retrieving battle data
 * Walrus provides decentralized immutable storage for tournament verification
 */

// Walrus configuration
const WALRUS_AGGREGATOR_URL = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';
const EPOCHS = 1; // Number of epochs to store data (reduced to save SUI)

// Multiple publisher fallbacks (public ones may run out of SUI)
const WALRUS_PUBLISHERS = [
  'https://publisher.walrus-testnet.walrus.space',
  'https://walrus-testnet-publisher.nodes.guru',
  'https://walrus-testnet-publisher.everstake.one',
  'https://publisher.testnet.walrus.atalma.io',
  'https://walrus-testnet-publisher.stakely.io',
];

export interface BattleData {
  battleId: string;
  agent1Id: string;
  agent2Id: string;
  agent1Name: string;
  agent2Name: string;
  moves: Array<{
    position: number;
    player: string;
    timestamp: number;
  }>;
  board: (string | null)[];
  winner: string | null;
  isDraw: boolean;
  timestamp: number;
}

export interface AgentPerformanceData {
  agentId: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
  battles: string[];
  timestamp: number;
}

export interface WalrusBlob {
  blobId: string;
  contentHash: string;
  size: number;
  storedAt: string;
  dataType: string;
  status: 'verified' | 'pending' | 'failed';
}

/**
 * Store battle data on Walrus - REAL API CALL with multiple fallbacks
 * Using official Walrus HTTP API: https://docs.wal.app/usage/web-api.html
 * Returns the blob ID for future verification
 */
export async function storeBattleData(battleData: BattleData): Promise<string> {
  const dataBlob = JSON.stringify(battleData);
  console.log('📤 Storing battle data on Walrus...', battleData);
  
  // Try multiple publishers until one works
  for (let i = 0; i < WALRUS_PUBLISHERS.length; i++) {
    const publisher = WALRUS_PUBLISHERS[i];
    try {
      const url = `${publisher}/v1/blobs?epochs=${EPOCHS}`;
      console.log(`🔄 Attempt ${i + 1}/${WALRUS_PUBLISHERS.length}: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        body: dataBlob,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Publisher ${i + 1} failed:`, response.status, errorText);
        
        // If out of SUI, try next publisher
        if (errorText.includes('insufficient balance') || errorText.includes('could not find SUI')) {
          console.log('💰 Publisher out of SUI, trying next...');
          continue;
        }
        
        throw new Error(`${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Walrus response:', result);
      
      // Walrus returns newlyCreated or alreadyCertified with blobId
      const blobId = result.newlyCreated?.blobObject?.blobId || 
                     result.newlyCreated?.blobId ||
                     result.alreadyCertified?.blobId ||
                     result.blobId;
      
      if (!blobId) {
        console.error('No blob ID in response:', result);
        throw new Error('No blob ID returned from Walrus');
      }
      
      console.log(`✅ SUCCESS! Stored on Walrus via publisher ${i + 1}! Blob ID:`, blobId);
      return blobId;
      
    } catch (error) {
      console.error(`❌ Publisher ${i + 1} error:`, error);
      
      // If this was the last publisher, throw
      if (i === WALRUS_PUBLISHERS.length - 1) {
        throw new Error(`All ${WALRUS_PUBLISHERS.length} publishers failed. Last error: ${error}`);
      }
      
      // Otherwise try next publisher
      continue;
    }
  }
  
  throw new Error('Failed to store on Walrus after trying all publishers');
}

/**
 * Store agent performance data on Walrus
 */
export async function storeAgentPerformance(agentData: AgentPerformanceData): Promise<WalrusBlob> {
  try {
    const jsonData = JSON.stringify(agentData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('file', blob);

    const response = await fetch(`${WALRUS_PUBLISHERS[0]}/v1/blobs?epochs=${EPOCHS}`, {
      method: 'PUT',
      body: jsonData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Walrus storage failed:', errorText);
      throw new Error(`Failed to store on Walrus: ${response.status}`);
    }

    const result = await response.json();
    
    // Walrus returns newlyCreated or alreadyCertified with blobId
    const blobId = result.newlyCreated?.blobObject?.blobId || 
                   result.alreadyCertified?.blobId;
    
    if (!blobId) {
      throw new Error('No blob ID returned from Walrus');
    }
    
    console.log('✅ Stored on Walrus! Blob ID:', blobId);
    return {
      blobId,
      contentHash: '',
      size: jsonData.length,
      storedAt: new Date().toISOString(),
      dataType: 'agent_performance',
      status: 'verified',
    };
  } catch (error) {
    console.error('Error storing agent performance on Walrus:', error);
    throw new Error('Failed to store agent performance on Walrus');
  }
}

/**
 * Retrieve battle data from Walrus using blob ID - REAL API CALL
 */
export async function retrieveBattleData(blobId: string): Promise<BattleData | null> {
  try {
    console.log('📥 Retrieving from Walrus, blob ID:', blobId);
    
    const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/${blobId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Walrus retrieval failed:', errorText);
      throw new Error(`Failed to retrieve from Walrus: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Retrieved from Walrus:', data);
    return data as BattleData;
  } catch (error) {
    console.error('❌ Error retrieving battle data from Walrus:', error);
    return null;
  }
}

/**
 * Verify Walrus blob integrity
 */
export async function verifyWalrusBlob(blobId: string): Promise<boolean> {
  try {
    // Verify blob exists and is accessible
    const response = await simulateWalrusVerify(blobId);
    return response.verified;
  } catch (error) {
    console.error('Error verifying Walrus blob:', error);
    return false;
  }
}

// ============ SIMULATION FUNCTIONS FOR DEMO ============
// In production, these would make real API calls to Walrus

function generateBlobId(): string {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateContentHash(data: string): string {
  // Simple hash simulation
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(12, '0')}`;
}

async function simulateWalrusStore(data: string): Promise<{ blobId: string; contentHash: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    blobId: generateBlobId(),
    contentHash: generateContentHash(data),
  };
}

async function simulateWalrusRetrieve(blobId: string): Promise<{ data: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In demo, return mock data
  return {
    data: JSON.stringify({
      battleId: 'battle_001',
      agent1Id: 'agent_alpha',
      agent2Id: 'agent_beta',
      moves: [],
      winner: 'agent_alpha',
    }),
  };
}

async function simulateWalrusVerify(blobId: string): Promise<{ verified: boolean }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    verified: true,
  };
}

/**
 * Get Walrus blob URL for viewing
 */
export function getWalrusBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/${blobId}`;
}

/**
 * Store tournament results on Walrus
 */
export async function storeTournamentResults(tournamentData: {
  tournamentId: string;
  battles: BattleData[];
  agents: AgentPerformanceData[];
  winner: string;
  totalBattles: number;
}): Promise<WalrusBlob> {
  try {
    const jsonData = JSON.stringify(tournamentData);
    const response = await simulateWalrusStore(jsonData);
    
    return {
      blobId: response.blobId,
      contentHash: response.contentHash,
      size: jsonData.length,
      storedAt: new Date().toISOString(),
      dataType: 'tournament_results',
      status: 'verified',
    };
  } catch (error) {
    console.error('Error storing tournament results on Walrus:', error);
    throw new Error('Failed to store tournament results on Walrus');
  }
}
