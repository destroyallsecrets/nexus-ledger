import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  ArrowRightLeft, 
  Wallet, 
  Menu, 
  Database,
  Unplug
} from 'lucide-react';
import { xrplService } from './services/xrplService';
import { Dashboard } from './components/Dashboard';
import { AssetLayer } from './components/AssetLayer';
import { ExchangeLayer } from './components/ExchangeLayer';
import { RefinementLayer } from './components/RefinementLayer';
import { WalletModal } from './components/WalletModal';
import { ToastContainer, useToast } from './components/Toast';
import { MicroTicker } from './components/MicroTicker';
import { AppPhase, NetworkStatus } from './types';

function App() {
  const [activePhase, setActivePhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('disconnected');
  const [ledgerInfo, setLedgerInfo] = useState<{index: number, txs: number} | null>(null);
  
  // Wallet State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);

  // Notifications
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const init = async () => {
      setNetworkStatus('connecting');
      await xrplService.connect();
      setNetworkStatus('connected');
      addToast('info', 'Network Connected', 'Successfully connected to XRPL Testnet node.');
      
      const info = await xrplService.getLedgerInfo();
      setLedgerInfo({ index: info.ledgerIndex, txs: info.txCount });

      // Simulate live updates
      const interval = setInterval(async () => {
        const update = await xrplService.getLedgerInfo();
        setLedgerInfo({ index: update.ledgerIndex, txs: update.txCount });
      }, 4000);

      return () => clearInterval(interval);
    };
    init();
  }, []);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    addToast('success', 'Wallet Connected', `Session active for ${address.substring(0,8)}...`);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(undefined);
    addToast('info', 'Wallet Disconnected', 'Session terminated.');
  };

  const NavItem = ({ phase, icon: Icon, label }: { phase: AppPhase, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActivePhase(phase);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activePhase === phase 
          ? 'bg-nexus-accent/10 text-nexus-accent border border-nexus-accent/20' 
          : 'text-gray-400 hover:bg-nexus-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-nexus-900 text-white flex flex-col font-sans overflow-hidden">
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        onConnect={handleWalletConnect}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
            <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-nexus-900 border-r border-nexus-800 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-6 border-b border-nexus-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-nexus-accent to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-nexus-accent/20">
                N
            </div>
            <div>
                <span className="text-xl font-bold tracking-tight block leading-none">Nexus</span>
                <span className="text-xs text-nexus-accent uppercase tracking-widest">Ledger</span>
            </div>
            </div>

            <nav className="p-4 space-y-2 mt-4">
            <NavItem phase={AppPhase.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem phase={AppPhase.ASSET_LAYER} icon={Layers} label="Assets & Compliance" />
            <NavItem phase={AppPhase.EXCHANGE_LAYER} icon={ArrowRightLeft} label="Exchange (DEX)" />
            <NavItem phase={AppPhase.REFINEMENT} icon={Database} label="Audit & Verify" />
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-nexus-800 bg-nexus-900/50 backdrop-blur">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-nexus-800 border border-nexus-700">
                <div className={`w-2 h-2 rounded-full ${networkStatus === 'connected' ? 'bg-nexus-success animate-pulse' : 'bg-nexus-danger'}`} />
                <div className="flex-1">
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Node Status</div>
                <div className="text-xs text-white truncate">s.altnet.rippletest.net</div>
                </div>
            </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-nexus-800/20 via-nexus-900 to-nexus-900">
            {/* Header */}
            <header className="h-16 border-b border-nexus-800 flex items-center justify-between px-6 bg-nexus-900/80 backdrop-blur sticky top-0 z-30">
            <button 
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setIsSidebarOpen(true)}
            >
                <Menu size={24} />
            </button>

            <div className="flex items-center gap-6 ml-auto">
                {ledgerInfo && (
                <div className="hidden md:flex items-center gap-6 text-sm font-mono text-gray-500 bg-nexus-800/50 px-4 py-1.5 rounded-full border border-nexus-700/50">
                    <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-nexus-accent rounded-full"></span>
                    Ledger: <span className="text-white">{ledgerInfo.index}</span>
                    </span>
                    <span className="w-px h-3 bg-nexus-700"></span>
                    <span className="flex items-center gap-2">
                    TPS: <span className="text-white">{(ledgerInfo.txs / 4).toFixed(1)}</span>
                    </span>
                </div>
                )}
                
                {walletAddress ? (
                <div className="flex items-center gap-3 bg-nexus-800/50 border border-nexus-700 rounded-lg pl-3 pr-2 py-1.5 hover:border-nexus-600 transition-colors cursor-pointer group">
                    <div className="flex flex-col text-right mr-1">
                        <span className="text-xs text-gray-400 group-hover:text-nexus-accent transition-colors">Connected</span>
                        <span className="text-sm font-mono font-bold text-white truncate w-24 md:w-auto">
                            {walletAddress}
                        </span>
                    </div>
                    <button 
                        onClick={handleWalletDisconnect}
                        className="p-1.5 hover:bg-nexus-700 rounded-md text-gray-400 hover:text-nexus-danger transition-colors"
                        title="Disconnect"
                    >
                        <Unplug size={16} />
                    </button>
                </div>
                ) : (
                <button 
                    onClick={() => setIsWalletModalOpen(true)}
                    className="flex items-center gap-2 bg-nexus-accent hover:bg-sky-400 text-nexus-900 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-nexus-accent/10"
                >
                    <Wallet size={16} />
                    <span>Connect Wallet</span>
                </button>
                )}
            </div>
            </header>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
            <div className="max-w-7xl mx-auto pb-4">
                
                {activePhase === AppPhase.DASHBOARD && (
                <Dashboard 
                    walletAddress={walletAddress}
                    setIsWalletModalOpen={setIsWalletModalOpen}
                    setActivePhase={setActivePhase}
                />
                )}

                {activePhase === AppPhase.ASSET_LAYER && <AssetLayer walletAddress={walletAddress} addToast={addToast} />}
                {activePhase === AppPhase.EXCHANGE_LAYER && <ExchangeLayer walletAddress={walletAddress} addToast={addToast} />}
                {activePhase === AppPhase.REFINEMENT && <RefinementLayer />}
                
            </div>
            </div>
        </main>
      </div>
      
      {/* Global Micro-Ticker Footer */}
      <MicroTicker />
    </div>
  );
}

export default App;