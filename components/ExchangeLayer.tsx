import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, TrendingUp, Activity, ArrowDown, ArrowUp, Settings, Sliders, GitCommit, RefreshCw, Coins } from 'lucide-react';
import { xrplService } from '../services/xrplService';
import { JsonViewer } from './JsonViewer';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceDot } from 'recharts';
import { Order, SwapHop } from '../types';

const MOCK_BIDS: Order[] = [
  { price: 0.5490, amount: 12000, total: 6588, type: 'bid' },
  { price: 0.5485, amount: 8500, total: 4662, type: 'bid' },
  { price: 0.5480, amount: 25000, total: 13700, type: 'bid' },
];

const MOCK_ASKS: Order[] = [
  { price: 0.5510, amount: 4500, total: 2479, type: 'ask' },
  { price: 0.5515, amount: 12000, total: 6618, type: 'ask' },
  { price: 0.5520, amount: 8000, total: 4416, type: 'ask' },
];

interface ExchangeLayerProps {
  walletAddress?: string;
  addToast?: (type: any, title: string, message: string) => void;
}

export const ExchangeLayer: React.FC<ExchangeLayerProps> = ({ walletAddress, addToast }) => {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'clob'>('clob');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Liquidity State
  const [liquidityMode, setLiquidityMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositStrategy, setDepositStrategy] = useState<'balanced' | 'single'>('balanced');
  const [xrpAmount, setXrpAmount] = useState("1000");
  const [tokenAmount, setTokenAmount] = useState("500");
  const [lpTokenAmount, setLpTokenAmount] = useState("150");

  // CLOB State
  const [orderType, setOrderType] = useState<'Buy' | 'Sell'>('Buy');
  const [limitPrice, setLimitPrice] = useState("0.55");
  const [limitAmount, setLimitAmount] = useState("100");

  // Swap Settings State
  const [swapInput, setSwapInput] = useState("100");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [showSwapSettings, setShowSwapSettings] = useState(false);
  const [swapPath, setSwapPath] = useState<SwapHop[]>([]);

  const activeWallet = walletAddress || "rUser...Wallet";
  const estimatedReceive = (parseFloat(swapInput) * 0.55).toFixed(2);
  const sendMaxXRP = (parseFloat(swapInput) * (1 + slippage / 100)).toFixed(2);
  
  const paymentTx = xrplService.generatePayment(
      activeWallet, "rDestination...Wallet", "USD", "rK...ColdWallet", estimatedReceive, sendMaxXRP
  );

  const ammDepositTx = xrplService.generateAMMDeposit(
      activeWallet, "rK...ColdWallet", "USD", 
      depositStrategy === 'balanced' || depositStrategy === 'single' ? xrpAmount : "0", 
      depositStrategy === 'balanced' || depositStrategy === 'single' ? tokenAmount : "0",
      depositStrategy
  );

  const ammWithdrawTx = xrplService.generateAMMWithdraw(activeWallet, "rK...ColdWallet", "USD", lpTokenAmount);
  
  const offerCreateTx = xrplService.generateOfferCreate(activeWallet, orderType, "XRP", "USD", limitAmount, limitPrice);

  useEffect(() => {
    if (activeTab === 'swap') {
        setSwapPath([
            { type: 'Source', detail: 'XRP', output: `${parseFloat(swapInput).toFixed(1)} XRP` },
            { type: 'CLOB', detail: 'XRP/EUR', output: `${(parseFloat(swapInput) * 0.5).toFixed(2)} EUR` },
            { type: 'AMM', detail: 'EUR/USD', output: `${(parseFloat(swapInput) * 0.55).toFixed(2)} USD` },
            { type: 'Destination', detail: 'USD', output: `${(parseFloat(swapInput) * 0.55).toFixed(2)} USD` }
        ]);
    }
  }, [activeTab, swapInput]);

  const handleSubmit = async (tx: any, successMsg: string) => {
      setIsSubmitting(true);
      try {
          await xrplService.submitTransaction(tx);
          if (addToast) addToast('success', 'Success', successMsg);
      } catch (e) {
          if (addToast) addToast('error', 'Error', 'Transaction Failed');
      } finally {
          setIsSubmitting(false);
      }
  };

  const OrderBookRow: React.FC<{ order: Order }> = ({ order }) => {
      const maxVol = 13700; // Simplified max for visual
      const widthPercentage = (order.total / maxVol) * 100;
      return (
        <div className="grid grid-cols-3 text-xs font-mono py-1 hover:bg-nexus-700/50 cursor-pointer transition-colors relative group z-0">
          <span className={`pl-2 relative z-10 ${order.type === 'bid' ? 'text-nexus-success' : 'text-nexus-danger'}`}>{order.price.toFixed(4)}</span>
          <span className="text-gray-400 text-right relative z-10">{order.amount.toLocaleString()}</span>
          <span className="text-gray-500 text-right pr-2 relative z-10">{order.total.toLocaleString()}</span>
          <div className={`absolute right-0 top-0 bottom-0 opacity-10 transition-all duration-500 ease-out ${order.type === 'bid' ? 'bg-nexus-success' : 'bg-nexus-danger'}`} style={{ width: `${widthPercentage}%` }} />
        </div>
      );
  };

  const generateCurveData = () => {
    const k = parseFloat(xrpAmount) * parseFloat(tokenAmount);
    const points = [];
    for (let x = parseFloat(xrpAmount) * 0.5; x <= parseFloat(xrpAmount) * 1.5; x += (parseFloat(xrpAmount)/20)) {
        points.push({ x, y: k / x });
    }
    return points;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Activity className="text-nexus-accent" /> Exchange Layer</h2>
          <p className="text-gray-400 mt-1">Enterprise-grade trading terminal and liquidity management.</p>
        </div>
        <div className="flex bg-nexus-800 rounded-lg p-1 border border-nexus-700">
            {['clob', 'liquidity', 'swap'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors uppercase ${activeTab === tab ? 'bg-nexus-700 text-white' : 'text-gray-400 hover:text-white'}`}>{tab}</button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700 h-1/2 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 z-10 relative">
                  <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2"><TrendingUp size={16} /> {activeTab === 'liquidity' ? 'AMM Curve' : 'XRP / USD'}</h3>
                </div>
                <div className="flex-1 w-full min-h-0 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateCurveData()}>
                            <Line type="monotone" dataKey="y" stroke="#38bdf8" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700 flex-1 overflow-y-auto relative">
               {activeTab === 'clob' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-nexus-900 rounded-lg">
                            <button onClick={() => setOrderType('Buy')} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${orderType === 'Buy' ? 'bg-nexus-success text-nexus-900' : 'text-gray-400'}`}>BUY</button>
                            <button onClick={() => setOrderType('Sell')} className={`flex-1 py-2 rounded text-sm font-bold transition-all ${orderType === 'Sell' ? 'bg-nexus-danger text-nexus-900' : 'text-gray-400'}`}>SELL</button>
                        </div>
                        <div className="space-y-3">
                            <div><label className="text-xs text-gray-500 uppercase">Price</label><input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-white" /></div>
                            <div><label className="text-xs text-gray-500 uppercase">Amount</label><input type="number" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-white" /></div>
                        </div>
                        <button onClick={() => handleSubmit(offerCreateTx, `${orderType} Order Placed`)} disabled={isSubmitting} className={`w-full font-bold py-3 rounded-lg ${orderType === 'Buy' ? 'bg-nexus-success' : 'bg-nexus-danger'} text-nexus-900`}>
                            {isSubmitting ? 'Placing...' : `Place ${orderType} Order`}
                        </button>
                    </div>
                    <div className="h-full"><JsonViewer data={offerCreateTx} title="Payload Preview" /></div>
                 </div>
               )}

               {activeTab === 'swap' && (
                 <div className="max-w-md mx-auto space-y-4 pt-2 relative">
                     <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-bold text-gray-300">Instant Swap</h3>
                        <button onClick={() => setShowSwapSettings(!showSwapSettings)} className="p-2 text-gray-400 hover:text-white"><Sliders size={18} /></button>
                     </div>
                     {showSwapSettings && (
                        <div className="bg-nexus-900 border border-nexus-700 rounded-xl p-4 mb-4">
                            <label className="text-sm text-gray-300 mb-2 block">Slippage: {slippage}%</label>
                            <input type="range" min="0.1" max="5" step="0.1" value={slippage} onChange={e => setSlippage(parseFloat(e.target.value))} className="w-full accent-nexus-accent"/>
                        </div>
                     )}
                     <div className="bg-nexus-900 p-4 rounded-xl border border-nexus-700 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400"><span>You Pay</span><span>Bal: 5,000 XRP</span></div>
                        <div className="flex items-center gap-2"><input className="bg-transparent text-2xl w-full outline-none font-mono" value={swapInput} onChange={e => setSwapInput(e.target.value)} /><span className="font-bold bg-nexus-800 px-2 py-1 rounded">XRP</span></div>
                     </div>
                     <div className="flex justify-center -my-4 relative z-10"><div className="bg-nexus-700 p-2 rounded-full border-4 border-nexus-800"><ArrowDown size={20} /></div></div>
                     <div className="bg-nexus-900 p-4 rounded-xl border border-nexus-700 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400"><span>You Receive</span></div>
                        <div className="flex items-center gap-2"><input className="bg-transparent text-2xl w-full outline-none font-mono text-nexus-accent" value={estimatedReceive} readOnly /><span className="font-bold bg-nexus-800 px-2 py-1 rounded">USD</span></div>
                     </div>
                     <button onClick={() => handleSubmit(paymentTx, `Swapped ${swapInput} XRP`)} disabled={isSubmitting} className="w-full bg-nexus-accent hover:bg-sky-400 text-nexus-900 font-bold py-3 rounded-xl transition-colors">{isSubmitting ? 'Swapping...' : 'Swap Assets'}</button>
                 </div>
               )}

               {activeTab === 'liquidity' && (
                 <div className="flex flex-col h-full">
                    <div className="flex bg-nexus-900 p-1 rounded-lg border border-nexus-700 mb-6">
                        <button onClick={() => setLiquidityMode('deposit')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${liquidityMode === 'deposit' ? 'bg-nexus-700 text-white' : 'text-gray-500'}`}>Deposit</button>
                        <button onClick={() => setLiquidityMode('withdraw')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${liquidityMode === 'withdraw' ? 'bg-nexus-700 text-white' : 'text-gray-500'}`}>Withdraw</button>
                    </div>
                    {liquidityMode === 'deposit' ? (
                        <>
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={depositStrategy === 'balanced'} onChange={() => setDepositStrategy('balanced')} className="text-nexus-accent" /><span className="text-sm text-gray-300">Balanced</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={depositStrategy === 'single'} onChange={() => setDepositStrategy('single')} className="text-nexus-accent" /><span className="text-sm text-gray-300">Single Asset</span></label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={xrpAmount} onChange={e => setXrpAmount(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 p-3 rounded-lg text-white font-mono" />
                                <input type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 p-3 rounded-lg text-white font-mono" />
                            </div>
                            <button onClick={() => handleSubmit(ammDepositTx, 'Liquidity Added')} disabled={isSubmitting} className="w-full mt-4 bg-nexus-accent hover:bg-sky-400 text-nexus-900 font-bold py-3 rounded-xl">{isSubmitting ? 'Depositing...' : 'Add Liquidity'}</button>
                        </>
                    ) : (
                        <>
                             <div className="space-y-4">
                                <div className="flex items-center gap-2"><Coins size={20} className="text-nexus-warning" /><input type="number" value={lpTokenAmount} onChange={(e) => setLpTokenAmount(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 p-3 rounded-lg text-white font-mono" /></div>
                                <div className="text-xs text-right text-gray-500 mt-1">Available: 1,450.22 LPT</div>
                             </div>
                             <button onClick={() => handleSubmit(ammWithdrawTx, 'Liquidity Withdrawn')} disabled={isSubmitting} className="w-full mt-4 bg-nexus-accent hover:bg-sky-400 text-nexus-900 font-bold py-3 rounded-xl">{isSubmitting ? 'Redeeming...' : 'Redeem LP Tokens'}</button>
                        </>
                    )}
                 </div>
               )}
            </div>
        </div>

        <div className="lg:col-span-4 bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 flex flex-col overflow-hidden h-full">
            <div className="p-3 border-b border-nexus-700 flex justify-between items-center bg-nexus-900/50">
               <span className="text-sm font-bold text-gray-300">Order Book</span>
               <span className="text-xs text-gray-500 font-mono flex items-center gap-1"><RefreshCw size={10} /> Live</span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col-reverse justify-end pb-2 custom-scrollbar">
                {MOCK_ASKS.slice().reverse().map((order, i) => <OrderBookRow key={i} order={order} />)}
            </div>
            <div className="py-3 border-y border-nexus-700 bg-nexus-900/80 text-center relative overflow-hidden">
                 <div className="text-xl font-bold text-white flex items-center justify-center gap-2 relative z-10">0.5505 <ArrowUp size={20} className="text-nexus-success" /></div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                {MOCK_BIDS.map((order, i) => <OrderBookRow key={i} order={order} />)}
            </div>
        </div>
      </div>
    </div>
  );
};