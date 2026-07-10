'use client'
import Link from "next/link";
import { Zap, Plus, ArrowRight, Settings, Activity, Clock } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  
  const {data: zaps, isLoading} = useQuery({
    queryKey: ['zaps'],
    queryFn: () => trpc.getZaps.query()
  })

  const createUserMutation = useMutation({
    mutationFn : () => trpc.createUser.mutate({name: 'testuser', email: 'test@gmail.com'}),
    onSuccess: (data) => {
      localStorage.setItem('userId', data.id.toString());
      alert(`user created! ${data.name}`)
    }
  })

  return (
    <div className="min-h-screen bg-[#0f0f13] text-[#ededed] p-8 font-sans selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Antigravity Automations</h1>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => createUserMutation.mutate()}
            className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-5 py-2.5 rounded-full font-medium hover:bg-purple-600/30 transition-all border border-purple-500/30"
          >
            Create Test User
          </button>
          
          <Link 
            href="/history"
            className="flex items-center gap-2 bg-white/5 text-gray-300 px-5 py-2.5 rounded-full font-medium hover:bg-white/10 transition-all border border-white/10"
          >
            <Clock className="w-4 h-4" />
            History
          </Link>
          
          <Link 
            href="/create"
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Create Zap
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto space-y-12">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-gray-400 font-medium">Tasks Automated</h3>
            </div>
            <p className="text-4xl font-bold">12,402</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-gray-400 font-medium">Active Zaps</h3>
            </div>
            <p className="text-4xl font-bold">4</p>
          </div>
        </div>

        {/* Zaps List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Zaps</h2>
          </div>
          
          <div className="space-y-4">
            {zaps?.map((zap) => (
              <div key={zap.id} className="glass rounded-xl p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group cursor-pointer border border-white/5 hover:border-white/10">
                <div className="flex items-center gap-6">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 w-24">
                    <div className={`w-2 h-2 rounded-full ${zap.isActive === 'true' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-500'}`}></div>
                    <span className="text-sm text-gray-400 font-medium">{zap.isActive === 'true' ? 'Active' : 'Paused'}</span>
                  </div>
                  
                  {/* Title & Flow */}
                  <div>
                    <h3 className="font-medium text-lg mb-1">{zap.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">{zap.trigger?.availableTrigger?.name}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">{zap.actions?.map(a => a.availableAction?.name).join(' + ') || "No Actions"}</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                  <Settings className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
