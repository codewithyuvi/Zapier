"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Webhook, Mail, MessageSquare, Plus, Save, Play, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export default function ZapBuilder() {
  const router = useRouter();

  const [title, setTitle] = useState('Untitled Zap')
  const [actions, setActions] = useState([{ id: 1, type: "email" }]);

  const addAction = (type: string) => {
    setActions([...actions, { id: Date.now(), type }]);
  };

  const removeAction = (id: number) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const createZap = useMutation({
    mutationFn: (newZap: any) => trpc.createZap.mutate(newZap),
    onSuccess: () => {
      alert('Zap created');
      router.push('/')
    },
    onError: (err) => {
      alert(`Failed to publish: ${err.message}`);
    }


  })

  const handlePublish = () => {
    createZap.mutate({
      title: title,
      trigger: {
        availableTriggerId: "webhook", 
        config: {}
      },
      actions: actions.map(action => ({
        availableActionId: action.type, 
        config: {}
      }))
    })
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-[#ededed] font-sans selection:bg-purple-500/30 pb-20">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-10 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-lg font-medium placeholder:text-gray-600 w-64 hover:bg-white/5 px-2 py-1 rounded transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-gray-300 hover:bg-white/5 transition-colors border border-white/10">
            <Play className="w-4 h-4" />
            Test
          </button>

          <button 
            onClick={handlePublish}
            disabled={createZap.isPending}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-full font-medium hover:bg-purple-700 transition-all active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]">
            <Save className="w-4 h-4" />
            {createZap.isPending ? "Publishing..." : "Publish Zap"}
          </button>
        </div>
      </nav>

      {/* Builder Canvas */}
      <div className="max-w-3xl mx-auto mt-12 flex flex-col items-center">
        
        {/* Trigger Node */}
        <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.1)] relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl"></div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Webhook className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">1. Trigger</div>
              <h3 className="text-xl font-medium mb-1">Catch Hook</h3>
              <p className="text-sm text-gray-400">Waits for a new POST request to a unique URL.</p>
              
              <div className="mt-4 p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-xs text-gray-400 flex items-center justify-between">
                <span className="truncate">https://hooks.antigravity.io/catch/user_1/zap_...</span>
                <button className="text-purple-400 hover:text-purple-300 ml-2 shrink-0">Copy</button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Action Nodes */}
        {actions.map((action, index) => (
          <div key={action.id} className="flex flex-col items-center w-full">
            {/* Connector Line */}
            <div className="w-px h-12 bg-gradient-to-b from-purple-500/50 to-white/20"></div>
            
            {/* Action Card */}
            <div className="glass w-full max-w-lg rounded-2xl p-6 relative group hover:border-white/20 transition-colors">
              <button 
                onClick={() => removeAction(action.id)}
                className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${action.type === 'email' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-green-500/20 border-green-500/30'}`}>
                  {action.type === 'email' ? <Mail className="w-6 h-6 text-blue-400" /> : <MessageSquare className="w-6 h-6 text-green-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">{index + 2}. Action</div>
                  <h3 className="text-xl font-medium mb-1">{action.type === 'email' ? 'Send Email' : 'Send Slack Message'}</h3>
                  <p className="text-sm text-gray-400">
                    {action.type === 'email' ? 'Sends an outbound email via SMTP.' : 'Posts a message to a Slack channel.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Action Connector */}
        <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent"></div>
        
        {/* Add Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={() => addAction('email')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <Mail className="w-4 h-4 text-blue-400" />
            Add Email
          </button>
          
          <button 
            onClick={() => addAction('slack')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <MessageSquare className="w-4 h-4 text-green-400" />
            Add Slack
          </button>
        </div>

      </div>
    </div>
  );
}
