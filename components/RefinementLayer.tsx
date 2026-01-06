import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, AlertTriangle, Box, Clock, Hash, FileText, ArrowUpRight, Filter, Download, Sparkles, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { GoogleGenAI } from "@google/genai";

const MOCK_HISTORY: AuditLogEntry[] = [
  { id: '1', hash: '5F2A...9B3C', type: 'OfferCreate', status: 'validated', timestamp: '2023-10-24 10:42:01', details: 'Buy 5000 XRP @ 0.55' },
  { id: '2', hash: '8D1E...2F4A', type: 'TrustSet', status: 'validated', timestamp: '2023-10-24 09:15:33', details: 'Set Trust USD (rK...)' },
  { id: '3', hash: '1C9B...7A2D', type: 'Payment', status: 'failed', timestamp: '2023-10-23 16:20:10', details: 'Pathfinding Error: No liquidity' },
  { id: '4', hash: '3A5F...8E1C', type: 'AMMDeposit', status: 'validated', timestamp: '2023-10-23 14:05:00', details: 'Pool: XRP/USD' },
  { id: '5', hash: '9B2C...1D4F', type: 'Payment', status: 'validated', timestamp: '2023-10-23 12:30:15', details: 'Sent 500 EUR to rUser...' },
  { id: '6', hash: '7E1A...5C3B', type: 'AccountSet', status: 'validated', timestamp: '2023-10-23 11:05:22', details: 'SetFlag: RequireAuth' },
  { id: '7', hash: '2F4D...8A1E', type: 'TrustSet', status: 'pending', timestamp: '2023-10-23 10:15:00', details: 'Auth Request: GOLD' },
];

export const RefinementLayer: React.FC = () => {
  // Standard Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'failed' | 'pending'>('all');
  
  // Verifier State
  const [verifyHash, setVerifyHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<null | { success: boolean, delivered: string }>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // AI Grounding State
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<Array<{uri: string, title: string}>>([]);

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return MOCK_HISTORY.filter(entry => {
      const matchesSearch = entry.hash.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Simulation Logic for Verification
  const handleVerify = () => {
    if (!verifyHash) return;
    setIsVerifying(true);
    setVerificationResult(null);
    
    setTimeout(() => {
        setIsVerifying(false);
        if (verifyHash.startsWith('1')) {
             setVerificationResult({ success: false, delivered: '0' });
        } else {
             setVerificationResult({ success: true, delivered: '1,000.00 USD' });
        }
    }, 1500);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Hash', 'Type', 'Status', 'Timestamp', 'Details'];
    const rows = filteredHistory.map(e => [e.id, e.hash, e.type, e.status, e.timestamp, e.details]);
    const csvContent = "data:text/csv;charset=utf-8," + 
        [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nexus_ledger_audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Search Grounding Logic
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    setAiResponse(null);
    setGroundingSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Context: You are an expert XRPL Ledger Analyst for the Nexus Ledger application.
          
          Internal Data (Current View): 
          ${JSON.stringify(MOCK_HISTORY)}

          User Query: "${aiQuery}"

          Instructions:
          1. Filter and analyze the Internal Data based on the user's criteria (e.g. "failed payments", "USD transactions").
          2. If the user asks about external entities, market conditions, or addresses (e.g. "Is address rK... safe?", "What is the price of XRP?"), use the Google Search tool to verify.
          3. Synthesize the internal data with any external findings into a concise, professional summary.
        `,
        config: {
          tools: [{googleSearch: {}}],
        }
      });

      setAiResponse(response.text || "Analysis complete. No text output generated.");

      // Extract grounding sources
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const sources = chunks
          .map((chunk: any) => chunk.web)
          .filter((web: any) => web && web.uri && web.title);
        setGroundingSources(sources);
      }

    } catch (error) {
      console.error("AI Search Error:", error);
      setAiResponse("Unable to complete AI investigation. Please check API configuration.");
    } finally {
      setIsAiSearching(false);
    }
  };

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
        
        {/* Left Column: Tools */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* AI Smart Analysis Widget */}
           <div className="bg-gradient-to-br from-nexus-800 to-nexus-900 border border-nexus-700/50 p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles size={64} className="text-nexus-accent" />
              </div>
              
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-nexus-accent" /> AI Investigation
              </h3>
              
              <div className="space-y-3">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask about transactions, addresses, or market context..."
                  className="w-full bg-nexus-900/50 border border-nexus-700 rounded-lg p-3 text-sm text-white focus:border-nexus-accent focus:outline-none resize-none h-24"
                />
                
                <button 
                  onClick={handleAiSearch}
                  disabled={isAiSearching || !aiQuery}
                  className="w-full bg-nexus-accent/10 hover:bg-nexus-accent/20 border border-nexus-accent/50 text-nexus-accent font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                  {isAiSearching ? 'Analyzing...' : 'Search with Grounding'}
                </button>
              </div>

              {/* AI Results Area */}
              {(aiResponse || isAiSearching) && (
                <div className="mt-4 pt-4 border-t border-nexus-700/50 animate-in fade-in slide-in-from-top-2">
                   {isAiSearching ? (
                     <div className="space-y-2">
                       <div className="h-2 bg-nexus-700 rounded w-3/4 animate-pulse"></div>
                       <div className="h-2 bg-nexus-700 rounded w-1/2 animate-pulse"></div>
                     </div>
                   ) : (
                     <>
                       <div className="text-sm text-gray-300 leading-relaxed mb-3">
                         {aiResponse}
                       </div>
                       
                       {groundingSources.length > 0 && (
                         <div className="space-y-1">
                           <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Sources</div>
                           <div className="flex flex-wrap gap-2">
                             {groundingSources.map((source, idx) => (
                               <a 
                                 key={idx} 
                                 href={source.uri} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="flex items-center gap-1 text-xs bg-nexus-900 border border-nexus-700 hover:border-nexus-accent px-2 py-1 rounded-full text-nexus-accent transition-colors truncate max-w-[200px]"
                               >
                                 <ExternalLink size={10} />
                                 <span className="truncate">{source.title}</span>
                               </a>
                             ))}
                           </div>
                         </div>
                       )}
                     </>
                   )}
                </div>
              )}
           </div>

           {/* Manual Verifier */}
           <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700">
            <div className="flex flex-col gap-4 mb-6">
                <label className="text-sm font-bold text-gray-300">Manual Verifier</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={verifyHash}
                        onChange={(e) => setVerifyHash(e.target.value)}
                        placeholder="TxID Hash" 
                        className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 pl-10 text-white focus:border-nexus-accent focus:outline-none font-mono text-sm"
                    />
                    <Hash size={16} className="absolute left-3 top-3.5 text-gray-500" />
                </div>
                <button 
                    onClick={handleVerify}
                    disabled={isVerifying || !verifyHash}
                    className="bg-nexus-700 hover:bg-nexus-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isVerifying ? (
                        <span className="animate-pulse">Checking Ledger...</span>
                    ) : (
                        <><Search size={16} /> Verify On-Chain</>
                    )}
                </button>
            </div>

            {verificationResult && (
                <div className={`border ${verificationResult.success ? 'border-nexus-success/30 bg-nexus-success/5' : 'border-nexus-danger/30 bg-nexus-danger/5'} rounded-lg p-4 animate-in zoom-in-95`}>
                    <div className={`flex items-center gap-2 font-bold mb-2 ${verificationResult.success ? 'text-nexus-success' : 'text-nexus-danger'}`}>
                        {verificationResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        {verificationResult.success ? 'Validated' : 'Failed'}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Delivered:</span>
                        <span className="font-mono text-white">{verificationResult.delivered}</span>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Audit Journal */}
        <div className="lg:col-span-2">
            <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 h-full flex flex-col">
                <div className="p-4 border-b border-nexus-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="text-nexus-accent" size={20} /> Transaction Journal
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                             <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                             <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter logs..." 
                                className="w-full bg-nexus-900 border border-nexus-700 rounded-lg py-1.5 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-nexus-600"
                             />
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="bg-nexus-700 hover:bg-nexus-600 text-white p-2 rounded-lg transition-colors" title="Export CSV">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-3 bg-nexus-900/30 border-b border-nexus-700 flex gap-2 overflow-x-auto">
                    {(['all', 'validated', 'pending', 'failed'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                                statusFilter === status 
                                ? 'bg-nexus-accent text-nexus-900' 
                                : 'bg-nexus-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
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
                            {filteredHistory.length > 0 ? filteredHistory.map((entry) => (
                                <tr key={entry.id} className="hover:bg-nexus-700/30 transition-colors">
                                    <td className="p-4">
                                        {entry.status === 'validated' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-nexus-success/10 text-nexus-success">Success</span>}
                                        {entry.status === 'failed' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-nexus-danger/10 text-nexus-danger">Failed</span>}
                                        {entry.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-nexus-warning/10 text-nexus-warning">Pending</span>}
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
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};