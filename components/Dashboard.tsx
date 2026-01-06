import React from 'react';
import { AppPhase } from '../types';
import { Activity, ArrowRight, ShieldCheck, Zap, Server, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface DashboardProps {
  walletAddress?: string;
  setIsWalletModalOpen: (isOpen: boolean) => void;
  setActivePhase: (phase: AppPhase) => void;
}

// Micro-scaling: Mock history data for sparklines
const SPARK_LIQUIDITY = [{v:10}, {v:12}, {v:11}, {v:14}, {v:13}, {v:15}, {v:18}, {v:20}];
const SPARK_TRUST = [{v:50}, {v:55}, {v:60}, {v:58}, {v:65}, {v:70}, {v:75}, {v:80}];
const SPARK_VOLUME = [{v:100}, {v:80}, {v:60}, {v:90}, {v:120}, {v:110}, {v:130}, {v:140}];
const SPARK_POOLS = [{v:20}, {v:20}, {v:21}, {v:21}, {v:22}, {v:23}, {v:23}, {v:24}];

export const Dashboard: React.FC<DashboardProps> = ({ walletAddress, setIsWalletModalOpen, setActivePhase }) => {
  
  const StatCard = ({ label, val, change, color, icon: Icon, data, chartColor }: any) => (
    <div className="bg-nexus-800/50 backdrop-blur p-0 rounded-xl border border-nexus-700 hover:border-nexus-600 transition-all group hover:shadow-lg hover:shadow-nexus-900/50 overflow-hidden relative flex flex-col h-32">
        <div className="p-4 z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-gray-400 group-hover:text-nexus-accent transition-colors">{label}</div>
                <Icon size={16} className="text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <div>
                <div className={`text-2xl font-bold ${color}`}>{val}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <span className="text-nexus-success bg-nexus-success/10 px-1 rounded flex items-center gap-0.5">
                        <TrendingUp size={10} /> {change}
                    </span> 
                    vs last 24h
                </div>
            </div>
        </div>
        
        {/* Micro-Chart Background */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={data}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Area 
                        type="monotone" 
                        dataKey="v" 
                        stroke={chartColor} 
                        fill={chartColor} 
                        strokeWidth={2} 
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Network Overview</h1>
          <p className="text-gray-400">Real-time metrics for the Nexus Ledger institutional environment.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-nexus-800/50 px-3 py-1.5 rounded-full border border-nexus-700/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-nexus-success"></span>
            </span>
            <span className="text-gray-300">System Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Total Liquidity" 
            val="$12.4M" 
            change="+2.4%" 
            color="text-nexus-accent" 
            icon={Zap} 
            data={SPARK_LIQUIDITY}
            chartColor="#38bdf8"
        />
        <StatCard 
            label="Active TrustLines" 
            val="8,249" 
            change="+124" 
            color="text-nexus-success" 
            icon={ShieldCheck} 
            data={SPARK_TRUST}
            chartColor="#10b981"
        />
        <StatCard 
            label="24h Volume" 
            val="$4.2M" 
            change="-0.5%" 
            color="text-white" 
            icon={Activity} 
            data={SPARK_VOLUME}
            chartColor="#94a3b8"
        />
        <StatCard 
            label="AMM Pools" 
            val="142" 
            change="+3" 
            color="text-nexus-warning" 
            icon={Server} 
            data={SPARK_POOLS}
            chartColor="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Welcome / Action Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-nexus-800 to-nexus-900 border border-nexus-700 rounded-xl p-8 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
            <h3 className="text-2xl font-semibold text-white mb-4">Enterprise Gateway Ready</h3>
            <p className="text-gray-400 max-w-xl mb-8 leading-relaxed">
                The Nexus Ledger is configured for high-frequency trading and regulated asset management. 
                Ensure your Operational Wallet is funded with sufficient XRP for reserve requirements (10 XRP base + 2 XRP per object) before initiating complex transactions.
            </p>
            
            {!walletAddress ? (
                <button 
                    onClick={() => setIsWalletModalOpen(true)}
                    className="bg-nexus-accent hover:bg-sky-400 text-nexus-900 px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-nexus-accent/20 hover:shadow-nexus-accent/30 flex items-center gap-2 w-fit"
                >
                    Connect Operational Wallet <ArrowRight size={18} />
                </button>
            ) : (
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={() => setActivePhase(AppPhase.ASSET_LAYER)}
                        className="bg-nexus-700 hover:bg-nexus-600 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-nexus-600 flex items-center gap-2"
                    >
                        Manage Assets <ArrowRight size={16} className="text-gray-400" />
                    </button>
                    <button 
                        onClick={() => setActivePhase(AppPhase.EXCHANGE_LAYER)}
                        className="bg-nexus-700 hover:bg-nexus-600 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-nexus-600 flex items-center gap-2"
                    >
                        Launch Terminal <ArrowRight size={16} className="text-gray-400" />
                    </button>
                </div>
            )}
            </div>
        </div>

        {/* Activity Feed Widget */}
        <div className="bg-nexus-800/50 backdrop-blur-sm border border-nexus-700 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-nexus-accent" /> Network Activity
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[250px] custom-scrollbar">
                 {[
                     { type: 'AMMDeposit', desc: 'Liquidity Added to XRP/USD', time: '2m ago', status: 'success' },
                     { type: 'OfferCreate', desc: 'Bid placed for 5000 XRP', time: '5m ago', status: 'success' },
                     { type: 'TrustSet', desc: 'TrustLine Authorized for EUR', time: '12m ago', status: 'success' },
                     { type: 'Payment', desc: 'Cross-currency payment failed', time: '45m ago', status: 'failed' },
                 ].map((item, i) => (
                     <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-nexus-900/50 border border-nexus-700/50 hover:border-nexus-600 transition-colors">
                         <div className={`mt-1 w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-nexus-success' : 'bg-nexus-danger'}`}></div>
                         <div>
                             <div className="text-sm font-medium text-white">{item.type}</div>
                             <div className="text-xs text-gray-400">{item.desc}</div>
                             <div className="text-[10px] text-gray-600 mt-1 uppercase tracking-wide">{item.time}</div>
                         </div>
                     </div>
                 ))}
            </div>
            <div className="mt-4 pt-3 border-t border-nexus-700 text-center">
                <button 
                    onClick={() => setActivePhase(AppPhase.REFINEMENT)}
                    className="text-xs text-nexus-accent hover:text-white transition-colors uppercase tracking-wider font-bold"
                >
                    View Audit Log
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};