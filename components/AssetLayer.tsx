import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Lock, FileJson, Plus, Settings, Users, AlertOctagon, X, Wallet, ArrowRight } from 'lucide-react';
import { xrplService } from '../services/xrplService';
import { JsonViewer } from './JsonViewer';
import { Asset } from '../types';

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

export const AssetLayer: React.FC<AssetLayerProps> = ({ walletAddress, addToast }) => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const [activeTab, setActiveTab] = useState<'config' | 'trustlines'>('config');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Transaction Configuration State
  const [issuerAddress, setIssuerAddress] = useState(selectedAsset.issuer);
  const [requireAuth, setRequireAuth] = useState(selectedAsset.flags.requireAuth);
  const [defaultRipple, setDefaultRipple] = useState(selectedAsset.flags.defaultRipple);
  
  // TrustLine State
  const [targetUser, setTargetUser] = useState(walletAddress || "rU...UserWallet");
  const [limit, setLimit] = useState("1000000");

  useEffect(() => {
    // Reset form when asset changes
    setIssuerAddress(selectedAsset.issuer);
    setRequireAuth(selectedAsset.flags.requireAuth);
    setDefaultRipple(selectedAsset.flags.defaultRipple);
  }, [selectedAsset]);

  const accountSetTx = xrplService.generateAccountSet(issuerAddress, requireAuth, defaultRipple);
  const authTx = xrplService.generateTrustSet(issuerAddress, targetUser, selectedAsset.currency, "0", true);

  const handleDeploy = () => {
    if (addToast) addToast('success', 'Configuration Updated', `Asset flags for ${selectedAsset.currency} broadcasted to ledger.`);
  };

  const handleAuthorize = () => {
    if (addToast) addToast('success', 'TrustLine Authorized', `User ${targetUser.substring(0,8)}... authorized for ${selectedAsset.currency}.`);
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
          <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700">
            
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
                <Users size={16} /> TrustLine Authorization
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'config' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="space-y-6">
                   <div className="bg-nexus-warning/10 border border-nexus-warning/20 rounded-lg p-4 flex items-start gap-3">
                      <AlertOctagon className="text-nexus-warning shrink-0" size={20} />
                      <div>
                        <h4 className="text-nexus-warning font-bold text-sm">Authorization Required</h4>
                        <p className="text-gray-400 text-xs mt-1">
                          Asset <strong className="text-white">{selectedAsset.currency}</strong> requires explicit issuer approval. Users must first set a TrustLine to the issuer before you can authorize it here.
                        </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div>
                            <label className="block text-sm text-gray-400 mb-1">Target User Address</label>
                            <input 
                              value={targetUser}
                              onChange={(e) => setTargetUser(e.target.value)}
                              className="w-full bg-nexus-900 border border-nexus-700 rounded p-2 text-white font-mono text-sm focus:border-nexus-accent focus:outline-none"
                            />
                         </div>
                         <button onClick={handleAuthorize} className="w-full border border-nexus-success text-nexus-success hover:bg-nexus-success/10 font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} /> Authorize TrustLine
                         </button>
                      </div>
                      <div className="bg-nexus-900 rounded-lg border border-nexus-700">
                         <JsonViewer data={authTx} title="Authorization Payload" />
                      </div>
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