import React from 'react';
import { Search, CheckCircle2, AlertTriangle, Box, Clock, Hash, FileText, ArrowUpRight } from 'lucide-react';
import { AuditLogEntry } from '../types';

const MOCK_HISTORY: AuditLogEntry[] = [
  { id: '1', hash: '5F2A...9B3C', type: 'OfferCreate', status: 'validated', timestamp: '2023-10-24 10:42:01', details: 'Buy 5000 XRP @ 0.55' },
  { id: '2', hash: '8D1E...2F4A', type: 'TrustSet', status: 'validated', timestamp: '2023-10-24 09:15:33', details: 'Set Trust USD (rK...)' },
  { id: '3', hash: '1C9B...7A2D', type: 'Payment', status: 'failed', timestamp: '2023-10-23 16:20:10', details: 'Pathfinding Error: No liquidity' },
  { id: '4', hash: '3A5F...8E1C', type: 'AMMDeposit', status: 'validated', timestamp: '2023-10-23 14:05:00', details: 'Pool: XRP/USD' },
];

export const RefinementLayer: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="text-nexus-accent" /> Refinement & Verification
          </h2>
          <p className="text-gray-400 mt-1">Transaction auditing, partial payment checks, and finality monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Verification Tool */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700">
            <div className="flex flex-col gap-4 mb-6">
                <label className="text-sm font-bold text-gray-300">Transaction Verifier</label>
                <input 
                type="text" 
                placeholder="Paste Transaction Hash (TxID)" 
                className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-white focus:border-nexus-accent focus:outline-none font-mono text-sm"
                />
                <button className="bg-nexus-700 hover:bg-nexus-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Search size={16} /> Verify On-Chain
                </button>
            </div>

            <div className="space-y-4">
                {/* Simulated Verification Result */}
                <div className="border border-nexus-success/30 bg-nexus-success/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-nexus-success font-bold mb-2">
                        <CheckCircle2 size={18} /> Validated (tesSUCCESS)
                    </div>
                    <div className="space-y-2 text-xs font-mono text-gray-300">
                        <div className="flex justify-between border-b border-nexus-700/50 pb-1">
                            <span className="text-gray-500">Ledger</span>
                            <span>85,000,124</span>
                        </div>
                        <div className="flex justify-between border-b border-nexus-700/50 pb-1">
                            <span className="text-gray-500">Delivered</span>
                            <span className="text-nexus-accent">1,000.00 USD</span>
                        </div>
                        <div className="flex justify-between pb-1">
                            <span className="text-gray-500">Partial?</span>
                            <span className="text-nexus-success">FALSE</span>
                        </div>
                    </div>
                </div>

                <div className="border border-nexus-700 rounded-lg p-4 bg-nexus-900/50">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-nexus-warning" /> Protocols Active
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                        <li><span className="text-nexus-accent font-mono">LastLedgerSequence</span> checked</li>
                        <li><span className="text-nexus-accent font-mono">DeliverMin</span> enforced</li>
                    </ul>
                </div>
            </div>
          </div>
        </div>

        {/* Audit Journal */}
        <div className="lg:col-span-2">
            <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 h-full flex flex-col">
                <div className="p-6 border-b border-nexus-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="text-nexus-accent" size={20} /> Transaction Journal
                    </h3>
                    <button className="text-sm text-nexus-accent hover:text-white transition-colors">Export CSV</button>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-nexus-900/50 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Status</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Hash / Details</th>
                                <th className="p-4">Time</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-nexus-700 text-gray-300">
                            {MOCK_HISTORY.map((entry) => (
                                <tr key={entry.id} className="hover:bg-nexus-700/30 transition-colors">
                                    <td className="p-4">
                                        {entry.status === 'validated' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-nexus-success/10 text-nexus-success">Success</span>}
                                        {entry.status === 'failed' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-nexus-danger/10 text-nexus-danger">Failed</span>}
                                    </td>
                                    <td className="p-4 font-mono text-nexus-accent">{entry.type}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs text-gray-500">{entry.hash}</span>
                                            <span className="font-medium text-white">{entry.details}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs flex items-center gap-1">
                                        <Clock size={12} /> {entry.timestamp}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-gray-400 hover:text-white"><ArrowUpRight size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};