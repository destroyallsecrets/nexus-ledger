import React, { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle2, AlertTriangle, Box, Clock, Hash, FileText, ArrowUpRight, Filter, Download, Sparkles, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { GoogleGenAI } from "@google/genai";
import { xrplService } from '../services/xrplService';

export const RefinementLayer: React.FC = () => {
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'failed' | 'pending'>('all');
  const [verifyHash, setVerifyHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<null | { success: boolean, delivered: string }>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<Array<{uri: string, title: string}>>([]);

  useEffect(() => {
    const fetchHistory = async () => {
        const data = await xrplService.getTransactions();
        setHistory(data);
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      const matchesSearch = entry.hash.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, history]);

  const handleVerify = () => {
    if (!verifyHash) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setTimeout(() => {
        setIsVerifying(false);
        const exists = history.find(h => h.hash.includes(verifyHash) || verifyHash.includes(h.hash));
        if (exists) {
             setVerificationResult({ success: true, delivered: 'Confirmed on Ledger' });
        } else {
             setVerificationResult({ success: false, delivered: 'Tx Not Found' });
        }
    }, 1500);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Hash', 'Type', 'Status', 'Timestamp', 'Details'];
    const rows = filteredHistory.map(e => [e.id, e.hash, e.type, e.status, e.timestamp, e.details]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nexus_ledger_audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: XRPL Analyst. Internal Data: ${JSON.stringify(history.slice(0, 5))} Query: "${aiQuery}"`,
        config: { tools: [{googleSearch: {}}] }
      });
      setAiResponse(response.text || "No output.");
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setGroundingSources(response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => c.web).filter(Boolean));
      }
    } catch (error) { setAiResponse("AI Service unavailable."); } finally { setIsAiSearching(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Search className="text-nexus-accent" /> Refinement & Verification</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gradient-to-br from-nexus-800 to-nexus-900 border border-nexus-700/50 p-6 rounded-xl shadow-lg relative overflow-hidden">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Sparkles size={16} className="text-nexus-accent" /> AI Investigation</h3>
              <textarea value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask about transactions..." className="w-full bg-nexus-900/50 border border-nexus-700 rounded-lg p-3 text-sm text-white h-24" />
              <button onClick={handleAiSearch} disabled={isAiSearching || !aiQuery} className="w-full mt-3 bg-nexus-accent/10 hover:bg-nexus-accent/20 border border-nexus-accent/50 text-nexus-accent font-bold py-2 rounded-lg flex items-center justify-center gap-2">{isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />} Search</button>
              {aiResponse && <div className="mt-4 pt-4 border-t border-nexus-700/50 text-sm text-gray-300">{aiResponse}</div>}
           </div>
           <div className="bg-nexus-800/50 backdrop-blur-sm p-6 rounded-xl border border-nexus-700">
                <input type="text" value={verifyHash} onChange={(e) => setVerifyHash(e.target.value)} placeholder="TxID Hash" className="w-full bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-white mb-4" />
                <button onClick={handleVerify} disabled={isVerifying || !verifyHash} className="w-full bg-nexus-700 hover:bg-nexus-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{isVerifying ? 'Checking...' : 'Verify On-Chain'}</button>
                {verificationResult && (
                    <div className={`mt-4 border ${verificationResult.success ? 'border-nexus-success/30 bg-nexus-success/5' : 'border-nexus-danger/30 bg-nexus-danger/5'} rounded-lg p-4`}>
                        <div className={`flex items-center gap-2 font-bold ${verificationResult.success ? 'text-nexus-success' : 'text-nexus-danger'}`}>{verificationResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {verificationResult.success ? 'Validated' : 'Failed'}</div>
                        <div className="text-xs text-gray-400 mt-1">{verificationResult.delivered}</div>
                    </div>
                )}
          </div>
        </div>
        <div className="lg:col-span-2">
            <div className="bg-nexus-800/50 backdrop-blur-sm rounded-xl border border-nexus-700 h-full flex flex-col">
                <div className="p-4 border-b border-nexus-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="text-nexus-accent" size={20} /> Transaction Journal</h3>
                    <div className="flex gap-2">
                         <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filter logs..." className="bg-nexus-900 border border-nexus-700 rounded-lg py-1.5 px-3 text-sm text-white" />
                        <button onClick={handleExportCSV} className="bg-nexus-700 text-white p-2 rounded-lg"><Download size={18} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-nexus-900/50 text-gray-400 uppercase text-xs"><tr><th className="p-4">Status</th><th className="p-4">Type</th><th className="p-4">Hash / Details</th><th className="p-4">Time</th></tr></thead>
                        <tbody className="divide-y divide-nexus-700 text-gray-300">
                            {filteredHistory.map((entry) => (
                                <tr key={entry.id} className="hover:bg-nexus-700/30">
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold bg-nexus-success/10 text-nexus-success`}>{entry.status}</span></td>
                                    <td className="p-4 font-mono text-nexus-accent">{entry.type}</td>
                                    <td className="p-4"><div className="flex flex-col"><span className="font-mono text-xs text-gray-500">{entry.hash}</span><span className="font-medium text-white">{entry.details}</span></div></td>
                                    <td className="p-4 text-gray-500 text-xs"><Clock size={12} /> {entry.timestamp}</td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No logs found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};