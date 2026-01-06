import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Lock, FileJson, Plus, Settings, Users, AlertOctagon, X, Wallet, ArrowRight, Ban, RefreshCcw, Search } from 'lucide-react';
import { xrplService } from '../services/xrplService';
import { JsonViewer } from './JsonViewer';
import { Asset, TrustLineHolder } from '../types';

interface AssetLayerProps {
  walletAddress?: string;
  addToast?: (type: any, title: string, message: string) => void;
}

// Mock Data for Enterprise Portfolio
const INITIAL_ASSETS: Asset[] = [
  { 
    id: '1', 
    currency: 'USD', 
    supply: '10,000,000', 
    issuer: 'rK...ColdWallet',
    flags: { requireAuth: true, defaultRipple: true, freeze: false }
  },
  { 
    id: '2', 
    currency: 'EUR', 
    supply: '5,000,000', 
    issuer: 'rK...ColdWallet',
    flags: { requireAuth: true, defaultRipple: true, freeze: false }
  },
  { 
    id: '3', 
    currency: 'GOLD', 
    supply: '50,000', 
    issuer: 'rK...ColdWallet',
    flags: { requireAuth: false, defaultRipple: false, freeze: true }
  }
];

const MOCK_HOLDERS: Record<string, TrustLineHolder[]> = {
    'USD': [
        { address: 'rUser1...9xP2', balance: '150,000.00', limit: '1,000,000', status: 'active', kycLevel: 3 },
        { address: 'rUser2...8mK1', balance: '45,000.00', limit: '100,000', status: 'frozen', kycLevel: 1 },
        { address: 'rInst...L9pQ', balance: '2,500,000.00', limit: '10,000,000', status: 'active', kycLevel: 5 },
    ],
    'EUR': [
        { address: 'rUser3...7jN4', balance: '5,000.00', limit: '50,000', status: 'active', kycLevel: 2 },
    ]
};

export const AssetLayer: React.FC<AssetLayerProps> = ({ walletAddress, addToast }) => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const [activeTab, setActiveTab] = useState<'config' | 'trustlines'>('config');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Transaction Configuration State
  const [issuerAddress, setIssuerAddress] = useState(selectedAsset.issuer);
  const [requireAuth, setRequireAuth] = useState(selectedAsset.flags.requireAuth);
  const [defaultRipple, setDefaultRipple] = useState(selectedAsset.flags.defaultRipple);
  
  // Holder State
  const [holders, setHolders] = useState<TrustLineHolder[]>([]);
  const [searchHolder, setSearchHolder] = useState('');
  const [selectedHolderAction, setSelectedHolderAction] = useState<{holder: TrustLineHolder, action: 'freeze' | 'clawback'} | null>(null);

  useEffect(() => {
    // Reset form when asset changes
    setIssuerAddress(selectedAsset.issuer);
    setRequireAuth(selectedAsset.flags.requireAuth);
    setDefaultRipple(selectedAsset.flags.defaultRipple);
    setHolders(MOCK_HOLDERS[selectedAsset.currency] || []);
    setSelectedHolderAction(null);
  }, [selectedAsset]);

  const accountSetTx = xrplService.generateAccountSet(issuerAddress, requireAuth, defaultRipple);

  // Generate compliance payload based on selection
  const complianceTx = selectedHolderAction?.action === 'freeze'
    ? xrplService.generateTrustSet(issuerAddress, selectedHolderAction.holder.address, selectedAsset.currency, "0", false, true)
    : selectedHolderAction?.action === 'clawback'
        ? xrplService.generateClawback(issuerAddress, selectedHolderAction.holder.address, selectedAsset.currency, selectedHolderAction.holder.balance)
        : null;

  const handleDeploy = () => {
    if (addToast) addToast('success', 'Configuration Updated', `Asset flags for ${selectedAsset.currency} broadcasted to ledger.`);
  };

  const handleExecuteCompliance = () => {
    if (!selectedHolderAction) return;
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

  const handleCreateAsset = (newAsset: Asset) => {
    setAssets([...assets, newAsset]);
    setSelectedAsset(newAsset);
    setIsCreateModalOpen(false);
    if (addToast) addToast('success', 'Asset Created', `New asset ${newAsset.currency} added to portfolio.`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
      {/* Create Asset Modal */}
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
        
        {/* Asset Portfolio Sidebar */}
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
                    className={`w-full text-left p-4 hover:bg-nexus-700/50 transition-colors flex items-center justify-between group ${selectedAsset.id === asset.id ? 'bg-nexus-700/30 border-l-2 border-nexus-accent' : ''}`}
                 >
                    <div>
                      <div className="font-bold text-white group-hover:text-nexus-accent transition-colors">{asset.currency}</div>
                      <div className="text-xs text-gray-500 font-mono">Supply: {asset.supply}</div>
                    </div>
                    {asset.flags.requireAuth && (
                      <span title="Auth Required">
                        <Lock size={14} className="text-nexus-warning" />
                      </span>
                    )}
                 </button>
               ))}
             </div>
          </div>

          <div className="bg-nexus-800/30 rounded-xl p-4 border border-nexus-700/50 text-xs text-gray-400">
            <p className="mb-2"><strong className="text-white">Compliance Note:</strong></p>
            Changes to Asset Flags are permanent for the ledger version. Ensure legal clearance before toggling Freeze capabilities.
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 flex flex-col min-h-[500px]">
            
            {/* Tabs */}
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
              {activeTab === 'config' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Cold Wallet (Issuer)</label>
                        <input 
                          disabled
                          value={issuerAddress}
                          className="w-full bg-nexus-900/50 border border-nexus-700 rounded p-2 text-gray-500 font-mono text-sm cursor-not-allowed"
                        />
                      </div>

                      <div className="bg-nexus-900 rounded-lg p-4 border border-nexus-700 space-y-3">
                         <h4 className="text-sm font-bold text-white mb-2">Account Flags</h4>
                         
                         <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <span className="block text-sm text-gray-300 group-hover:text-white">Default Ripple</span>
                                <span className="text-xs text-gray-500">Allow balances to ripple (Required for Stablecoins)</span>
                            </div>
                            <div 
                              onClick={() => setDefaultRipple(!defaultRipple)}
                              className={`w-10 h-5 rounded-full relative transition-colors ${defaultRipple ? 'bg-nexus-success' : 'bg-gray-600'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${defaultRipple ? 'left-6' : 'left-1'}`} />
                            </div>
                         </label>

                         <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <span className="block text-sm text-gray-300 group-hover:text-white">Require Auth</span>
                                <span className="text-xs text-gray-500">Clawback capability & Whitelist Only (CBDC)</span>
                            </div>
                            <div 
                              onClick={() => setRequireAuth(!requireAuth)}
                              className={`w-10 h-5 rounded-full relative transition-colors ${requireAuth ? 'bg-nexus-accent' : 'bg-gray-600'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${requireAuth ? 'left-6' : 'left-1'}`} />
                            </div>
                         </label>
                      </div>

                      <button onClick={handleDeploy} className="w-full bg-nexus-accent hover:bg-sky-400 text-nexus-900 font-bold py-2 rounded transition-colors">
                        Update Configuration
                      </button>
                   </div>
                   
                   <div className="bg-nexus-900 rounded-lg border border-nexus-700 h-full">
                      <JsonViewer data={accountSetTx} title="Payload Preview" />
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                   {/* Table View */}
                   <div className="xl:col-span-2 flex flex-col">
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                                <input 
                                    value={searchHolder}
                                    onChange={(e) => setSearchHolder(e.target.value)}
                                    placeholder="Search by address..."
                                    className="w-full bg-nexus-900 border border-nexus-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-nexus-600"
                                />
                            </div>
                            <button className="bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 text-gray-300 p-2 rounded-lg">
                                <RefreshCcw size={18} />
                            </button>
                        </div>
                        
                        <div className="bg-nexus-900/50 border border-nexus-700 rounded-lg overflow-hidden flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-nexus-800 text-gray-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-3">Holder Address</th>
                                        <th className="p-3 text-right">Balance</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-nexus-800">
                                    {holders.filter(h => h.address.includes(searchHolder)).map((holder) => (
                                        <tr key={holder.address} className="hover:bg-nexus-800/50 transition-colors group">
                                            <td className="p-3 font-mono text-nexus-accent">{holder.address}</td>
                                            <td className="p-3 text-right font-mono text-white">{holder.balance}</td>
                                            <td className="p-3 text-center">
                                                {holder.status === 'active' && <span className="px-2 py-0.5 rounded text-[10px] bg-nexus-success/10 text-nexus-success border border-nexus-success/20">Active</span>}
                                                {holder.status === 'frozen' && <span className="px-2 py-0.5 rounded text-[10px] bg-nexus-danger/10 text-nexus-danger border border-nexus-danger/20">Frozen</span>}
                                            </td>
                                            <td className="p-3 flex justify-end gap-2">
                                                <button 
                                                    onClick={() => setSelectedHolderAction({holder, action: 'freeze'})}
                                                    title="Freeze Account"
                                                    className="p-1.5 rounded hover:bg-nexus-danger/20 text-gray-500 hover:text-nexus-danger transition-colors"
                                                >
                                                    <Lock size={14} />
                                                </button>
                                                {selectedAsset.flags.requireAuth && (
                                                    <button 
                                                        onClick={() => setSelectedHolderAction({holder, action: 'clawback'})}
                                                        title="Clawback Funds"
                                                        className="p-1.5 rounded hover:bg-nexus-warning/20 text-gray-500 hover:text-nexus-warning transition-colors"
                                                    >
                                                        <Ban size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {holders.length === 0 && (
                                        <tr><td colSpan={4} className="p-6 text-center text-gray-500">No active TrustLines found for {selectedAsset.currency}.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                   </div>

                   {/* Action Panel */}
                   <div className="xl:col-span-1 bg-nexus-900 border border-nexus-700 rounded-lg p-4 flex flex-col">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <AlertOctagon size={16} className="text-nexus-warning" /> Compliance Action
                        </h4>
                        
                        {selectedHolderAction ? (
                            <div className="space-y-4 flex-1 flex flex-col">
                                <div className="p-3 bg-nexus-800 rounded border border-nexus-700 text-sm">
                                    <div className="text-gray-400 text-xs mb-1">Target Account</div>
                                    <div className="font-mono text-white break-all">{selectedHolderAction.holder.address}</div>
                                    <div className="mt-2 text-gray-400 text-xs mb-1">Action Type</div>
                                    <div className={`font-bold ${selectedHolderAction.action === 'freeze' ? 'text-nexus-danger' : 'text-nexus-warning'}`}>
                                        {selectedHolderAction.action === 'freeze' ? 'FREEZE TRUSTLINE' : 'CLAWBACK FUNDS'}
                                    </div>
                                </div>

                                <div className="flex-1 min-h-[150px]">
                                     <JsonViewer data={complianceTx} title="Payload Preview" />
                                </div>

                                <button 
                                    onClick={handleExecuteCompliance}
                                    className={`w-full py-3 rounded-lg font-bold text-nexus-900 transition-colors ${selectedHolderAction.action === 'freeze' ? 'bg-nexus-danger hover:bg-red-400' : 'bg-nexus-warning hover:bg-amber-400'}`}
                                >
                                    Confirm Execution
                                </button>
                                <button 
                                    onClick={() => setSelectedHolderAction(null)}
                                    className="w-full py-2 text-gray-500 hover:text-white transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center p-4">
                                <Shield size={48} className="mb-3 opacity-20" />
                                <p className="text-sm">Select a holder from the list to initiate compliance actions.</p>
                            </div>
                        )}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Modal Component
interface CreateProps {
    onClose: () => void;
    onCreate: (asset: Asset) => void;
    defaultIssuer: string;
}

const AssetCreationModal: React.FC<CreateProps> = ({ onClose, onCreate, defaultIssuer }) => {
    const [currency, setCurrency] = useState('');
    const [supply, setSupply] = useState('10000000');
    const [issuer, setIssuer] = useState(defaultIssuer);
    const [requireAuth, setRequireAuth] = useState(false);
    const [defaultRipple, setDefaultRipple] = useState(true);

    const handleSubmit = () => {
        if (!currency || currency.length < 3) return;
        
        const newAsset: Asset = {
            id: Math.random().toString(36).substr(2, 9),
            currency: currency.toUpperCase(),
            supply: parseInt(supply).toLocaleString(),
            issuer: issuer,
            flags: { requireAuth, defaultRipple, freeze: false }
        };
        onCreate(newAsset);
    };

    // Preview Issuance TX
    const issuanceTx = xrplService.generatePayment(issuer, "rOperational...HotWallet", currency.toUpperCase(), issuer, supply);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-nexus-900 border border-nexus-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-nexus-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Plus size={18} className="text-nexus-accent" /> Issue New Token
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Currency Code</label>
                                <input 
                                    className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-white font-mono placeholder-gray-600 focus:border-nexus-accent focus:outline-none" 
                                    placeholder="e.g. USD, EUR, GLD"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value.toUpperCase().slice(0, 4))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Initial Supply</label>
                                <input 
                                    type="number"
                                    className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-white font-mono placeholder-gray-600 focus:border-nexus-accent focus:outline-none" 
                                    value={supply}
                                    onChange={e => setSupply(e.target.value)}
                                />
                            </div>
                             <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Issuer Address (Cold)</label>
                                <div className="flex items-center gap-2">
                                    <Wallet size={16} className="text-gray-500"/>
                                    <input 
                                        className="w-full bg-nexus-800/50 border border-nexus-700 rounded p-2 text-gray-400 font-mono text-xs" 
                                        value={issuer}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white">Asset Controls</h4>
                             <label className="flex items-start gap-3 p-3 bg-nexus-800/50 rounded-lg border border-nexus-700 cursor-pointer hover:bg-nexus-800 transition-colors">
                                <input type="checkbox" checked={defaultRipple} onChange={e => setDefaultRipple(e.target.checked)} className="mt-1" />
                                <div>
                                    <div className="text-sm font-medium text-white">Default Ripple</div>
                                    <div className="text-xs text-gray-500">Enable secondary market trading between users.</div>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 p-3 bg-nexus-800/50 rounded-lg border border-nexus-700 cursor-pointer hover:bg-nexus-800 transition-colors">
                                <input type="checkbox" checked={requireAuth} onChange={e => setRequireAuth(e.target.checked)} className="mt-1" />
                                <div>
                                    <div className="text-sm font-medium text-white">Require Authorization</div>
                                    <div className="text-xs text-gray-500">Restrict ownership to whitelisted TrustLines only.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-nexus-800">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Issuance Payload Preview</h4>
                        <JsonViewer data={issuanceTx} />
                    </div>
                </div>

                <div className="p-4 bg-nexus-800/50 border-t border-nexus-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!currency || currency.length < 3}
                        className="bg-nexus-accent hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-nexus-900 font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        Issue Token <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}