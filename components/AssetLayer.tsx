import React, { useState, useEffect } from 'react';
import { Shield, Lock, Plus, Settings, Users, AlertOctagon, X, Wallet, ArrowRight, Ban, RefreshCcw, Search, Network, LayoutGrid } from 'lucide-react';
import { xrplService } from '../services/xrplService';
import { JsonViewer } from './JsonViewer';
import { Asset, TrustLineHolder } from '../types';

interface AssetLayerProps {
  walletAddress?: string;
  addToast?: (type: any, title: string, message: string) => void;
}

const MOCK_HOLDERS: Record<string, TrustLineHolder[]> = {
    'USD': [
        { address: 'rUser1...9xP2', balance: '150,000.00', limit: '1,000,000', status: 'active', kycLevel: 3 },
        { address: 'rUser2...8mK1', balance: '45,000.00', limit: '100,000', status: 'frozen', kycLevel: 1 },
    ],
    'EUR': [
        { address: 'rUser3...7jN4', balance: '5,000.00', limit: '50,000', status: 'active', kycLevel: 2 },
    ]
};

export const AssetLayer: React.FC<AssetLayerProps> = ({ walletAddress, addToast }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'trustlines'>('config');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Configuration State
  const [issuerAddress, setIssuerAddress] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  const [defaultRipple, setDefaultRipple] = useState(true);
  
  // Holder State
  const [holders, setHolders] = useState<TrustLineHolder[]>([]);
  const [searchHolder, setSearchHolder] = useState('');
  const [selectedHolderAction, setSelectedHolderAction] = useState<{holder: TrustLineHolder, action: 'freeze' | 'clawback'} | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
        const data = await xrplService.getAssets();
        setAssets(data);
        if (data.length > 0 && !selectedAsset) {
            setSelectedAsset(data[0]);
        }
    };
    fetchAssets();
  }, [selectedAsset]);

  useEffect(() => {
    if (selectedAsset) {
        setIssuerAddress(selectedAsset.issuer);
        setRequireAuth(selectedAsset.flags.requireAuth);
        setDefaultRipple(selectedAsset.flags.defaultRipple);
        // In a real app, holders would come from a service method like getTrustLines(assetId)
        // Here we stick to the mock constant but filtered dynamically to prevent crash
        setHolders(MOCK_HOLDERS[selectedAsset.currency] || []);
        setSelectedHolderAction(null);
    }
  }, [selectedAsset]);

  const accountSetTx = xrplService.generateAccountSet(issuerAddress, requireAuth, defaultRipple);

  const complianceTx = selectedHolderAction?.action === 'freeze' && selectedAsset
    ? xrplService.generateTrustSet(issuerAddress, selectedHolderAction.holder.address, selectedAsset.currency, "0", false, true)
    : selectedHolderAction?.action === 'clawback' && selectedAsset
        ? xrplService.generateClawback(issuerAddress, selectedHolderAction.holder.address, selectedAsset.currency, selectedHolderAction.holder.balance)
        : null;

  const handleDeploy = async () => {
    if (selectedAsset && addToast) {
        await xrplService.submitTransaction(accountSetTx);
        addToast('success', 'Configuration Updated', `Asset flags for ${selectedAsset.currency} broadcasted to ledger.`);
    }
  };

  const handleExecuteCompliance = async () => {
    if (!selectedHolderAction || !selectedAsset || !complianceTx) return;
    
    await xrplService.submitTransaction(complianceTx);
    
    if (addToast) {
        const title = selectedHolderAction.action === 'freeze' ? 'Account Frozen' : 'Funds Clawed Back';
        const msg = selectedHolderAction.action === 'freeze' 
            ? `Global freeze applied to TrustLine for ${selectedHolderAction.holder.address.substring(0,8)}...`
            : `Recovered ${selectedHolderAction.holder.balance} ${selectedAsset.currency} from ${selectedHolderAction.holder.address.substring(0,8)}...`;
        addToast('warning', title, msg);
    }
    
    // Optimistic Update
    const updatedHolders = holders.map(h => {
        if (h.address === selectedHolderAction.holder.address) {
            return {
                ...h,
                status: selectedHolderAction.action === 'freeze' ? 'frozen' : h.status,
                balance: selectedHolderAction.action === 'clawback' ? '0.00' : h.balance
            } as TrustLineHolder;
        }
        return h;
    });
    setHolders(updatedHolders);
    setSelectedHolderAction(null);
  };

  const handleCreateAsset = async (newAsset: Asset) => {
    // Generate Issuance TX
    const issuanceTx = xrplService.generatePayment(newAsset.issuer, "self", newAsset.currency, "self", newAsset.supply);
    // Note: In real XRPL, you don't "create" an asset, you send a payment from issuer to a trustline.
    // Our mock service handles this "Payment to Self" as a creation signal.
    
    await xrplService.submitTransaction(issuanceTx);

    // Refresh list
    const updatedAssets = await xrplService.getAssets();
    setAssets(updatedAssets);
    setSelectedAsset(updatedAssets[updatedAssets.length - 1]);
    
    setIsCreateModalOpen(false);
    if (addToast) addToast('success', 'Asset Issued', `New asset ${newAsset.currency} added to global portfolio.`);
  };

  const TopologyGraph = () => {
    const centerX = 300;
    const centerY = 200;
    const radius = 120;
    
    return (
        <div className="w-full h-[400px] bg-nexus-900/50 rounded-lg border border-nexus-700 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" 
                 style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            </div>

            <svg width="100%" height="100%" viewBox="0 0 600 400" className="z-10">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                </defs>
                {holders.map((holder, index) => {
                    const angle = (index * (360 / holders.length)) * (Math.PI / 180);
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const isFrozen = holder.status === 'frozen';
                    
                    return (
                        <line 
                            key={`line-${index}`}
                            x1={centerX} y1={centerY} x2={x} y2={y} 
                            stroke={isFrozen ? '#ef4444' : '#38bdf8'} 
                            strokeWidth="1.5"
                            strokeOpacity={0.4}
                            strokeDasharray={isFrozen ? "4" : "0"}
                        />
                    );
                })}
                <g className="cursor-pointer hover:opacity-90 transition-opacity">
                    <circle cx={centerX} cy={centerY} r="35" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                    <text x={centerX} y={centerY} dy="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">ISSUER</text>
                </g>
                {holders.map((holder, index) => {
                    const angle = (index * (360 / holders.length)) * (Math.PI / 180);
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const isFrozen = holder.status === 'frozen';

                    return (
                        <g 
                            key={`node-${index}`} 
                            onClick={() => setSelectedHolderAction({holder, action: 'freeze'})}
                            className="cursor-pointer transition-all duration-300"
                        >
                            <circle 
                                cx={x} cy={y} r="18" fill="#0f172a" 
                                stroke={isFrozen ? '#ef4444' : '#10b981'} strokeWidth="2"
                                className="hover:r-20 transition-all"
                            />
                            <text x={x} y={y} dy="24" textAnchor="middle" fill="#cbd5e1" fontSize="10" className="bg-nexus-900">
                                {holder.address.substring(0,4)}...
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {isCreateModalOpen && (
          <AssetCreationModal 
            onClose={() => setIsCreateModalOpen(false)} 
            onCreate={handleCreateAsset} 
            defaultIssuer={walletAddress || "rK...ColdWallet"}
          />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-nexus-accent" /> Asset Management
          </h2>
          <p className="text-gray-400 mt-1">Enterprise control for issued currencies and compliance.</p>
        </div>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-nexus-600"
        >
          <Plus size={16} /> Issue New Asset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 overflow-hidden">
             <div className="p-4 bg-nexus-900/50 border-b border-nexus-700">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Managed Assets</h3>
             </div>
             <div className="divide-y divide-nexus-700 max-h-[500px] overflow-y-auto">
               {assets.map(asset => (
                 <button 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`w-full text-left p-4 hover:bg-nexus-700/50 transition-colors flex items-center justify-between group ${selectedAsset?.id === asset.id ? 'bg-nexus-700/30 border-l-2 border-nexus-accent' : ''}`}
                 >
                    <div>
                      <div className="font-bold text-white group-hover:text-nexus-accent transition-colors">{asset.currency}</div>
                      <div className="text-xs text-gray-500 font-mono">Supply: {asset.supply}</div>
                    </div>
                    {asset.flags.requireAuth && (
                      <span title="Auth Required"><Lock size={14} className="text-nexus-warning" /></span>
                    )}
                 </button>
               ))}
               {assets.length === 0 && <div className="p-4 text-xs text-gray-500 text-center">No assets found. Issue one to begin.</div>}
             </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 flex flex-col min-h-[500px]">
            <div className="flex border-b border-nexus-700">
              <button 
                onClick={() => setActiveTab('config')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'border-nexus-accent text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                <Settings size={16} /> Compliance & Configuration
              </button>
              <button 
                onClick={() => setActiveTab('trustlines')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'trustlines' ? 'border-nexus-accent text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                <Users size={16} /> Cap Table & Holders
              </button>
            </div>

            <div className="p-6 flex-1">
              {activeTab === 'config' && selectedAsset ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Cold Wallet (Issuer)</label>
                        <input disabled value={issuerAddress} className="w-full bg-nexus-900/50 border border-nexus-700 rounded p-2 text-gray-500 font-mono text-sm cursor-not-allowed" />
                      </div>
                      <div className="bg-nexus-900 rounded-lg p-4 border border-nexus-700 space-y-3">
                         <h4 className="text-sm font-bold text-white mb-2">Account Flags</h4>
                         <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <span className="block text-sm text-gray-300 group-hover:text-white">Default Ripple</span>
                            </div>
                            <div onClick={() => setDefaultRipple(!defaultRipple)} className={`w-10 h-5 rounded-full relative transition-colors ${defaultRipple ? 'bg-nexus-success' : 'bg-gray-600'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${defaultRipple ? 'left-6' : 'left-1'}`} />
                            </div>
                         </label>
                         <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <span className="block text-sm text-gray-300 group-hover:text-white">Require Auth</span>
                            </div>
                            <div onClick={() => setRequireAuth(!requireAuth)} className={`w-10 h-5 rounded-full relative transition-colors ${requireAuth ? 'bg-nexus-accent' : 'bg-gray-600'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${requireAuth ? 'left-6' : 'left-1'}`} />
                            </div>
                         </label>
                      </div>
                      <button onClick={handleDeploy} className="w-full bg-nexus-accent hover:bg-sky-400 text-nexus-900 font-bold py-2 rounded transition-colors">Update Configuration</button>
                   </div>
                   <div className="bg-nexus-900 rounded-lg border border-nexus-700 h-full">
                      <JsonViewer data={accountSetTx} title="Payload Preview" />
                   </div>
                </div>
              ) : activeTab === 'trustlines' && selectedAsset ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                   <div className="xl:col-span-2 flex flex-col">
                        <div className="flex gap-2 mb-4 justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                                <input value={searchHolder} onChange={(e) => setSearchHolder(e.target.value)} placeholder="Search..." className="w-full bg-nexus-900 border border-nexus-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-nexus-600" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-nexus-700 border-nexus-600 text-white' : 'bg-nexus-800 border-nexus-700 text-gray-400'}`}><LayoutGrid size={18} /></button>
                                <button onClick={() => setViewMode('graph')} className={`p-2 rounded-lg border ${viewMode === 'graph' ? 'bg-nexus-700 border-nexus-600 text-nexus-accent' : 'bg-nexus-800 border-nexus-700 text-gray-400'}`}><Network size={18} /></button>
                            </div>
                        </div>
                        {viewMode === 'list' ? (
                            <div className="bg-nexus-900/50 border border-nexus-700 rounded-lg overflow-hidden flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-nexus-800 text-gray-400 text-xs uppercase font-bold">
                                        <tr><th className="p-3">Holder Address</th><th className="p-3 text-right">Balance</th><th className="p-3 text-center">Status</th><th className="p-3 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-nexus-800">
                                        {holders.filter(h => h.address.includes(searchHolder)).map((holder) => (
                                            <tr key={holder.address} className="hover:bg-nexus-800/50 transition-colors">
                                                <td className="p-3 font-mono text-nexus-accent">{holder.address}</td>
                                                <td className="p-3 text-right font-mono text-white">{holder.balance}</td>
                                                <td className="p-3 text-center">
                                                    {holder.status === 'active' ? <span className="text-nexus-success">Active</span> : <span className="text-nexus-danger">Frozen</span>}
                                                </td>
                                                <td className="p-3 flex justify-end gap-2">
                                                    <button onClick={() => setSelectedHolderAction({holder, action: 'freeze'})} className="p-1.5 rounded hover:bg-nexus-danger/20 text-gray-500 hover:text-nexus-danger"><Lock size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (<TopologyGraph />)}
                   </div>
                   <div className="xl:col-span-1 bg-nexus-900 border border-nexus-700 rounded-lg p-4 flex flex-col">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><AlertOctagon size={16} className="text-nexus-warning" /> Compliance Action</h4>
                        {selectedHolderAction ? (
                            <div className="space-y-4 flex-1 flex flex-col">
                                <div className="p-3 bg-nexus-800 rounded border border-nexus-700 text-sm">
                                    <div className="text-gray-400 text-xs mb-1">Target Account</div>
                                    <div className="font-mono text-white break-all">{selectedHolderAction.holder.address}</div>
                                    <div className="mt-2 text-gray-400 text-xs mb-1">Action Type</div>
                                    <div className={`font-bold ${selectedHolderAction.action === 'freeze' ? 'text-nexus-danger' : 'text-nexus-warning'}`}>{selectedHolderAction.action.toUpperCase()}</div>
                                </div>
                                <div className="flex-1 min-h-[150px]"><JsonViewer data={complianceTx} title="Payload" /></div>
                                <button onClick={handleExecuteCompliance} className={`w-full py-3 rounded-lg font-bold text-nexus-900 transition-colors ${selectedHolderAction.action === 'freeze' ? 'bg-nexus-danger hover:bg-red-400' : 'bg-nexus-warning hover:bg-amber-400'}`}>Confirm Execution</button>
                                <button onClick={() => setSelectedHolderAction(null)} className="w-full py-2 text-gray-500 hover:text-white transition-colors text-sm">Cancel</button>
                            </div>
                        ) : (<div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a holder to initiate action.</div>)}
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <Shield size={48} className="mb-4 opacity-20" />
                    <p>Select an asset to configure.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreateProps { onClose: () => void; onCreate: (asset: Asset) => void; defaultIssuer: string; }
const AssetCreationModal: React.FC<CreateProps> = ({ onClose, onCreate, defaultIssuer }) => {
    const [currency, setCurrency] = useState('');
    const [supply, setSupply] = useState('10000000');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-nexus-900 border border-nexus-700 rounded-xl w-full max-w-lg shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-white">Issue Token</h3><button onClick={onClose}><X size={20} className="text-gray-400"/></button></div>
                <div className="space-y-4">
                    <input className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-white" placeholder="Currency (USD)" value={currency} onChange={e => setCurrency(e.target.value.toUpperCase().slice(0, 4))} />
                    <input type="number" className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-white" value={supply} onChange={e => setSupply(e.target.value)} />
                    <button onClick={() => onCreate({ id: Math.random().toString(), currency, supply, issuer: defaultIssuer, flags: { requireAuth: false, defaultRipple: true, freeze: false }})} className="w-full bg-nexus-accent text-nexus-900 font-bold py-2 rounded">Issue</button>
                </div>
            </div>
        </div>
    );
}