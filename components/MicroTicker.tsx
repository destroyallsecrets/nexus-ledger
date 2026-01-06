import React from 'react';
import { Activity, Server, Database, Shield, Zap } from 'lucide-react';

export const MicroTicker: React.FC = () => {
  return (
    <div className="h-8 bg-nexus-900 border-t border-nexus-800 flex items-center overflow-hidden relative select-none">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-mono text-gray-500">
        <span className="flex items-center gap-2"><Activity size={12} className="text-nexus-accent"/> XRP/USD: $0.5523</span>
        <span className="flex items-center gap-2"><Server size={12} className="text-nexus-success"/> Network: STABLE</span>
        <span className="flex items-center gap-2"><Database size={12} className="text-nexus-warning"/> Base Reserve: 10 XRP</span>
        <span className="flex items-center gap-2"><Shield size={12} className="text-nexus-danger"/> Owner Reserve: 2 XRP</span>
        <span className="flex items-center gap-2"><Zap size={12} className="text-yellow-400"/> Ledger Fee: 12 drops</span>
        <span className="flex items-center gap-2">Validators: 142/150 Active</span>
        <span className="flex items-center gap-2">Last Close: 3.1s</span>
        
        {/* Duplicated content for seamless infinite loop */}
        <span className="flex items-center gap-2 ml-4 border-l border-nexus-800 pl-4"><Activity size={12} className="text-nexus-accent"/> XRP/USD: $0.5523</span>
        <span className="flex items-center gap-2"><Server size={12} className="text-nexus-success"/> Network: STABLE</span>
        <span className="flex items-center gap-2"><Database size={12} className="text-nexus-warning"/> Base Reserve: 10 XRP</span>
        <span className="flex items-center gap-2"><Shield size={12} className="text-nexus-danger"/> Owner Reserve: 2 XRP</span>
        <span className="flex items-center gap-2"><Zap size={12} className="text-yellow-400"/> Ledger Fee: 12 drops</span>
        <span className="flex items-center gap-2">Validators: 142/150 Active</span>
        <span className="flex items-center gap-2">Last Close: 3.1s</span>
      </div>
    </div>
  );
};