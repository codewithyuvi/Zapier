"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export default function HistoryPage() {
  
  // Fetch the execution history from our new tRPC endpoint!
  const { data: runs, isLoading } = useQuery({
    queryKey: ['zapRuns'],
    queryFn: () => trpc.getZapRuns.query()
  });

  return (
    <div className="min-h-screen bg-[#0f0f13] text-[#ededed] p-8 font-sans selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center mb-12 gap-4">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/5">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Execution History</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        
        {isLoading ? (
          <div className="text-center text-gray-500 mt-20 animate-pulse">Loading history...</div>
        ) : runs?.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">No execution history found yet. Trigger a webhook!</div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-5 font-medium text-gray-400 text-sm tracking-wider uppercase">Zap Name</th>
                  <th className="p-5 font-medium text-gray-400 text-sm tracking-wider uppercase">Status</th>
                  <th className="p-5 font-medium text-gray-400 text-sm tracking-wider uppercase">Date</th>
                  <th className="p-5 font-medium text-gray-400 text-sm tracking-wider uppercase">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {runs?.map((run) => (
                  <tr key={run.id} className="hover:bg-white/[0.02] transition-colors group">
                    
                    {/* Zap Title */}
                    <td className="p-5 font-medium">{run.zapTitle}</td>
                    
                    {/* Status Badge */}
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
                        run.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        run.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {run.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
                        {run.status === 'failed' && <XCircle className="w-4 h-4" />}
                        {run.status === 'processing' && <Clock className="w-4 h-4" />}
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </div>
                    </td>
                    
                    {/* Date */}
                    <td className="p-5 text-gray-400 text-sm">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    
                    {/* Payload JSON */}
                    <td className="p-5">
                      <div className="bg-black/40 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs text-gray-400 truncate max-w-xs">
                        {JSON.stringify(run.payload)}
                      </div>
                      {run.errorMessage && (
                        <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                          {run.errorMessage}
                        </div>
                      )}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
