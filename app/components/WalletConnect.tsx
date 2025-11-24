'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export default function WalletConnect() {
  const account = useCurrentAccount();

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
      <div className="flex-1">
        {account ? (
          <div className="text-sm">
            <div className="text-slate-400 mb-1">Connected Wallet</div>
            <div className="font-mono text-emerald-400 font-semibold">
              {account.address.slice(0, 8)}...{account.address.slice(-6)}
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <div className="text-slate-400 mb-1">Wallet Status</div>
            <div className="text-orange-400 font-semibold">Not Connected</div>
          </div>
        )}
      </div>
      <ConnectButton className="!bg-[#BFFF00] !text-black !font-bold !px-6 !py-3 !rounded-lg hover:!bg-[#9FE000] !transition-all" />
    </div>
  );
}
