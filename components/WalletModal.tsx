import React, { useState } from 'react';
import { X, Smartphone, Usb, Loader2 } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [step, setStep] = useState<'select' | 'connecting'>('select');
  const [selectedWallet, setSelectedWallet] = useState<string>('');

  if (!isOpen) return null;

  const handleConnect = (walletType: string) => {
    setSelectedWallet(walletType);
    setStep('connecting');
    // Simulate network handshake
    setTimeout(() => {
      onConnect("rNexusTester...X7z9");
      setStep('select');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-nexus-900 border border-nexus-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-sm text-gray-400 mb-6">Select a provider to sign transactions on the XRPL Testnet.</p>

          {step === 'select' ? (
            <div className="space-y-3">
              <button 
                onClick={() => handleConnect('xaman')}
                className="w-full flex items-center justify-between p-4 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 hover:border-nexus-accent rounded-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Smartphone size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Xaman (Xumm)</div>
                    <div className="text-xs text-gray-400">Scan QR Code</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-nexus-success"></div>
              </button>

              <button 
                 onClick={() => handleConnect('ledger')}
                 className="w-full flex items-center justify-between p-4 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 hover:border-nexus-accent rounded-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-600/20 p-2.5 rounded-lg text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Usb size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Ledger Nano</div>
                    <div className="text-xs text-gray-400">USB / Bluetooth</div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-nexus-accent animate-spin mb-4" />
              <h3 className="text-lg font-medium text-white">Requesting Permission...</h3>
              <p className="text-sm text-gray-400 mt-2">Check your {selectedWallet === 'xaman' ? 'device' : 'hardware wallet'} to confirm.</p>
            </div>
          )}
        </div>
        
        <div className="bg-nexus-900 border-t border-nexus-800 p-4 text-center">
            <p className="text-xs text-gray-500">
                By connecting, you agree to the <a href="#" className="text-nexus-accent hover:underline">Terms of Service</a>.
            </p>
        </div>
      </div>
    </div>
  );
};