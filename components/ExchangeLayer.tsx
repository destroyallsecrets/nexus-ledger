import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Droplets, TrendingUp, Activity, BarChart3, ArrowDown, ArrowUp, Settings, Sliders, ChevronsRight, GitCommit } from 'lucide-react';
import { xrplService } from '../services/xrplService';
import { JsonViewer } from './JsonViewer';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Order, SwapHop } from '../types';

const mockChartData = [
  { time: '10:00', price: 0.51 },
  { time: '10:05', price: 0.52 },
  { time: '10:10', price: 0.515 },
  { time: '10:15', price: 0.53 },
  { time: '10:20', price: 0.54 },
  { time: '10:25', price: 0.535 },
  { time: '10:30', price: 0.55 },
];

const MOCK_BIDS: Order[] = [
  { price: 0.5490, amount: 12000, total: 6588, type: 'bid' },
  { price: 0.5485, amount: 8500, total: 4662, type: 'bid' },
  { price: 0.5480, amount: 25000, total: 13700, type: 'bid' },
  { price: 0.5475, amount: 5000, total: 2737, type: 'bid' },
  { price: 0.5460, amount: 15400, total: 8408, type: 'bid' },
];

const MOCK_ASKS: Order[] = [
  { price: 0.5510, amount: 4500, total: 2479, type: 'ask' },
  { price: 0.5515, amount: 12000, total: 6618, type: 'ask' },
  { price: 0.5520, amount: 8000, total: 4416, type: 'ask' },
  { price: 0.5535, amount: 6500, total: 3597, type: 'ask' },
  { price: 0.5550, amount: 21000, total: 11655, type: 'ask' },
];

interface ExchangeLayerProps {
  walletAddress?: string;
  addToast?: (type: any, title: string, message: string) => void;
}

export const ExchangeLayer: React.FC<ExchangeLayerProps> = ({ walletAddress, addToast }) => {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'clob'>('clob');
  
  // AMM State
  const [xrpAmount, setXrpAmount] = useState("1000");
  const [tokenAmount, setTokenAmount] = useState("500");
  const [tradingFee, setTradingFee] = useState(500);

  // CLOB State
  const [orderType, setOrderType] = useState<'Buy' | 'Sell'>('Buy');
  const [limitPrice, setLimitPrice] = useState("0.55");
  const [limitAmount, setLimitAmount] = useState("100");

  // Swap Settings State
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [showSwapSettings, setShowSwapSettings] = useState(false);
  const [swapPath, setSwapPath] = useState<SwapHop[]>([]);

  const activeWallet = walletAddress || "rUser...Wallet";

  const ammCreateTx = xrplService.generateAMMCreate("rO...Operational", "rK...ColdWallet", "USD", xrpAmount, tokenAmount, tradingFee);
  const ammDepositTx = xrplService.generateAMMDeposit(activeWallet, "rK...ColdWallet", "USD", xrpAmount, tokenAmount);
  
  const offerCreateTx = xrplService.generateOfferCreate(
    activeWallet, 
    orderType, 
    "XRP", 
    "USD", 
    limitAmount, 
    limitPrice
  );

  // Simulate Pathfinding update
  useEffect(() => {
    if (activeTab === 'swap') {
        setSwapPath([
            { type: 'Source', detail: 'XRP', output: '100.0 XRP' },
            { type: 'CLOB', detail: 'XRP/EUR', output: '50.12 EUR' },
            { type: 'AMM', detail: 'EUR/USD', output: '55.00 USD' },
            { type: 'Destination', detail: 'USD', output: '55.00 USD' }
        ]);
    }
  }, [activeTab]);

  const handleSubmitOrder = () => {
    if (addToast) addToast('success', 'Order Submitted', `${orderType} order for ${limitAmount} XRP placed on CLOB.`);
  };

  const handleSwap = () => {
    if (addToast) addToast('success', 'Swap Executed', `Swapped 100 XRP for USD with ${slippage}% slippage limit.`);
  };

  const OrderBookRow = ({ order }: { order: Order }) => (
    <div className="grid grid-cols-3 text-xs font-mono py-1 hover:bg-nexus-700/50 cursor-pointer transition-colors relative group">
      <span className={order.type === 'bid' ? 'text-nexus-success' : 'text-nexus-danger'}>{order.price.toFixed(4)}</span>
      <span className="text-gray-400 text-right">{order.amount.toLocaleString()}</span>
      <span className="text-gray-500 text-right relative z-10">{order.total.toLocaleString()}</span>
      
      {/* Visual Depth Bar */}
      <div 
        className={`absolute right-0 top-0 bottom-0 opacity-10 ${order.type === 'bid' ? 'bg-nexus-success' : 'bg-nexus-danger'}`} 
        style={{ width: `${Math.random() * 100}%` }}
      />
    </div>
  );

  // Pathfinding Visualization Component
  const PathVisualizer = () => (
    <div className="mt-6 mb-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GitCommit size={14} className="text-nexus-accent" /> Optimal Path
        </h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {swapPath.map((hop, i) => (
                <div key={i} className="flex items-center shrink-0">
                    <div className={`
                        flex flex-col items-center justify-center p-2 rounded-lg border min-w-[80px]
                        ${hop.type === 'Source' || hop.type === 'Destination' ? 'bg-nexus-800 border-nexus-600' : 'bg-nexus-900 border-nexus-800'}
                    `}>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{hop.type}</span>
                        <span className="text-xs font-mono text-white font-medium">{hop.detail}</span>
                    </div>
                    {i < swapPath.length - 1 && (
                        <div className="flex flex-col items-center mx-1">
                            <div className="h-px w-6 bg-nexus-700"></div>
                            <span className="text-[9px] text-nexus-accent -mt-2 bg-nexus-900 px-1">{hop.output}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-nexus-accent" /> Exchange Layer
          </h2>
          <p className="text-gray-400 mt-1">Enterprise-grade trading terminal and liquidity management.</p>
        </div>
        <div className="flex bg-nexus-800 rounded-lg p-1 border border-nexus-700">
            <button 
                onClick={() => setActiveTab('clob')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'clob' ? 'bg-nexus-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Limit Order
            </button>
            <button 
                onClick={() => setActiveTab('liquidity')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'liquidity' ? 'bg-nexus-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                AMM Pool
            </button>
            <button 
                onClick={() => setActiveTab('swap')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'swap' ? 'bg-nexus-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Swap
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        
        {/* LEFT PANEL: Charts or Input Forms */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            
            {/* Chart Area */}
            <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700 h-1/2 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                      <TrendingUp size={16} /> XRP / USD
                  </h3>
                  <div className="flex gap-2">
                      <span className="text-xs bg-nexus-900 border border-nexus-700 px-2 py-1 rounded text-gray-400">1H</span>
                      <span className="text-xs bg-nexus-700 border border-nexus-600 px-2 py-1 rounded text-white">4H</span>
                      <span className="text-xs bg-nexus-900 border border-nexus-700 px-2 py-1 rounded text-gray-400">1D</span>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={mockChartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['dataMin', 'dataMax']} hide orientation='right' tick={{fontSize: 12, fill: '#64748b'}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#38bdf8' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke="#38bdf8" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorPrice)" 
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Input Forms Area */}
            <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700 flex-1 overflow-y-auto relative">
               {activeTab === 'clob' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-nexus-900 rounded-lg">
                            <button 
                                onClick={() => setOrderType('Buy')}
                                className={`flex-1 py-2 rounded text-sm font-bold transition-all ${orderType === 'Buy' ? 'bg-nexus-success text-nexus-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                BUY
                            </button>
                            <button 
                                onClick={() => setOrderType('Sell')}
                                className={`flex-1 py-2 rounded text-sm font-bold transition-all ${orderType === 'Sell' ? 'bg-nexus-danger text-nexus-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                SELL
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Limit Price (USD)</label>
                                <div className="relative">
                                  <input 
                                      type="number" 
                                      value={limitPrice}
                                      onChange={(e) => setLimitPrice(e.target.value)}
                                      className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-white font-mono focus:border-nexus-accent focus:outline-none"
                                  />
                                  <span className="absolute right-3 top-3 text-xs text-gray-500">USD</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Amount (XRP)</label>
                                <div className="relative">
                                  <input 
                                      type="number" 
                                      value={limitAmount}
                                      onChange={(e) => setLimitAmount(e.target.value)}
                                      className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-white font-mono focus:border-nexus-accent focus:outline-none"
                                  />
                                  <span className="absolute right-3 top-3 text-xs text-gray-500">XRP</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t border-nexus-700 pt-3 mt-2">
                             <span className="text-gray-400">Total Value</span>
                             <span className="font-mono text-white font-bold">${(parseFloat(limitPrice) * parseFloat(limitAmount)).toFixed(2)}</span>
                        </div>

                        <button 
                          onClick={handleSubmitOrder}
                          className={`w-full font-bold py-3 rounded-lg transition-colors ${orderType === 'Buy' ? 'bg-nexus-success hover:bg-emerald-400 text-nexus-900' : 'bg-nexus-danger hover:bg-red-400 text-nexus-900'}`}
                        >
                            Place {orderType} Order
                        </button>
                    </div>

                    <div className="h-full">
                       <JsonViewer data={offerCreateTx} title="Payload Preview" />
                    </div>
                 </div>
               )}

               {activeTab === 'swap' && (
                 <div className="max-w-md mx-auto space-y-4 pt-2 relative">
                     <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-bold text-gray-300">Instant Swap</h3>
                        <button 
                            onClick={() => setShowSwapSettings(!showSwapSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSwapSettings ? 'bg-nexus-700 text-white' : 'text-gray-400 hover:text-white hover:bg-nexus-800'}`}
                        >
                            <Sliders size={18} />
                        </button>
                     </div>
                     
                     {/* Swap Settings Panel */}
                     {showSwapSettings && (
                        <div className="bg-nexus-900 border border-nexus-700 rounded-xl p-4 mb-4 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Settings size={12}/> Transaction Settings</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-300 mb-2 block">Slippage Tolerance</label>
                                    <div className="flex gap-2">
                                        {[0.1, 0.5, 1.0].map((val) => (
                                            <button 
                                                key={val}
                                                onClick={() => setSlippage(val)}
                                                className={`px-3 py-1 rounded text-xs font-bold border ${slippage === val ? 'bg-nexus-accent text-nexus-900 border-nexus-accent' : 'bg-nexus-800 border-nexus-700 text-gray-400 hover:border-nexus-600'}`}
                                            >
                                                {val}%
                                            </button>
                                        ))}
                                        <div className="flex items-center gap-1 bg-nexus-800 border border-nexus-700 rounded px-2 w-20">
                                            <input 
                                                type="number" 
                                                value={slippage}
                                                onChange={(e) => setSlippage(parseFloat(e.target.value))}
                                                className="w-full bg-transparent text-xs text-white outline-none text-right"
                                            />
                                            <span className="text-xs text-gray-500">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-300 mb-2 block">Deadline (Minutes)</label>
                                    <input 
                                        type="number"
                                        value={deadline}
                                        onChange={(e) => setDeadline(parseInt(e.target.value))}
                                        className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-sm text-white focus:border-nexus-accent focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                     )}

                     <div className="bg-nexus-900 p-4 rounded-xl border border-nexus-700 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                           <span>You Pay</span>
                           <span>Balance: 5,000 XRP</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <input className="bg-transparent text-2xl w-full outline-none font-mono" placeholder="0.0" value="100" />
                           <span className="font-bold bg-nexus-800 px-2 py-1 rounded">XRP</span>
                        </div>
                     </div>

                     <div className="flex justify-center -my-4 relative z-10">
                        <div className="bg-nexus-700 p-2 rounded-full border-4 border-nexus-800">
                           <ArrowDown size={20} />
                        </div>
                     </div>

                     <div className="bg-nexus-900 p-4 rounded-xl border border-nexus-700 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                           <span>You Receive</span>
                           <span>Balance: 0.00 USD</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <input className="bg-transparent text-2xl w-full outline-none font-mono text-nexus-accent" placeholder="0.0" value="55.00" readOnly />
                           <span className="font-bold bg-nexus-800 px-2 py-1 rounded">USD</span>
                        </div>
                     </div>
                     
                     {/* Pathfinding Visualizer */}
                     <PathVisualizer />

                     <div className="text-xs text-gray-500 text-center pb-2">
                        <span className="mr-2">Slippage: <span className="text-nexus-warning">{slippage}%</span></span>
                        <span>Route: Best Price (CLOB + AMM)</span>
                     </div>

                     <button onClick={handleSwap} className="w-full bg-nexus-accent hover:bg-sky-400 text-nexus-900 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-nexus-accent/10">
                        Swap Assets
                     </button>
                 </div>
               )}

               {activeTab === 'liquidity' && (
                 <div className="flex flex-col h-full">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Droplets size={16}/> Pool Management</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <input type="number" value={xrpAmount} onChange={e => setXrpAmount(e.target.value)} className="bg-nexus-900 border border-nexus-700 p-3 rounded-lg" placeholder="XRP Amount" />
                       <input type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} className="bg-nexus-900 border border-nexus-700 p-3 rounded-lg" placeholder="USD Amount" />
                    </div>
                    <div className="mt-4">
                       <JsonViewer data={ammDepositTx} title="Deposit Payload" />
                    </div>
                 </div>
               )}
            </div>
        </div>

        {/* RIGHT PANEL: ORDER BOOK */}
        <div className="lg:col-span-4 bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 flex flex-col overflow-hidden h-full">
            <div className="p-3 border-b border-nexus-700 flex justify-between items-center bg-nexus-900/50">
               <span className="text-sm font-bold text-gray-300">Order Book</span>
               <span className="text-xs text-gray-500 font-mono">Spread: 0.08%</span>
            </div>
            
            <div className="grid grid-cols-3 px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
            </div>

            {/* ASKS (Sells) - Red */}
            <div className="flex-1 overflow-y-auto flex flex-col-reverse justify-end pb-2">
                {MOCK_ASKS.slice().reverse().map((order, i) => <OrderBookRow key={i} order={order} />)}
            </div>

            {/* Current Price */}
            <div className="py-2 border-y border-nexus-700 bg-nexus-900/80 text-center">
                 <div className="text-lg font-bold text-white flex items-center justify-center gap-2">
                    0.5505 <ArrowUp size={16} className="text-nexus-success" />
                 </div>
                 <div className="text-xs text-gray-400">$0.5505 USD</div>
            </div>

            {/* BIDS (Buys) - Green */}
            <div className="flex-1 overflow-y-auto pt-2">
                {MOCK_BIDS.map((order, i) => <OrderBookRow key={i} order={order} />)}
            </div>
        </div>

      </div>
    </div>
  );
};