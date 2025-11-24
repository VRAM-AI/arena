'use client';

import { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import PlayerStats from './PlayerStats';

export default function WalletConnectV2() {
  const account = useCurrentAccount();
  const [showStats, setShowStats] = useState(false);
  
  // Get SUI balance
  const { data: balance } = useSuiClientQuery(
    'getBalance',
    { owner: account?.address || '' },
    { enabled: !!account }
  );

  const suiBalance = balance ? (Number(balance.totalBalance) / 1_000_000_000).toFixed(4) : '0.0000';

  return (
    <>
      <div className="bg-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700 p-3 flex items-center gap-3">
        {account ? (
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => setShowStats(true)}
              className="flex-1 text-left hover:opacity-80 transition"
            >
              <div className="text-[#BFFF00] font-bold text-lg">{suiBalance} SUI</div>
              <div className="font-mono text-slate-400 text-xs">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Click to view stats →</div>
            </button>
            <ConnectButton className="!bg-slate-800 !text-white !font-semibold !px-4 !py-2 !rounded-lg hover:!bg-slate-700 !transition-all !text-xs !border !border-slate-600" />
          </div>
        ) : (
          <ConnectButton className="!bg-[#BFFF00] !text-black !font-bold !px-5 !py-2.5 !rounded-lg hover:!bg-[#9FE000] !transition-all !text-sm" />
        )}
      </div>

      {/* Stats Modal */}
      <PlayerStats isOpen={showStats} onClose={() => setShowStats(false)} />
    </>
  );
}
