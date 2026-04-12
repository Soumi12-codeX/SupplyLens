import React from 'react';
import { X, Check, Clock, ArrowRight } from 'lucide-react';

export default function DriverMessages({ messages, onClose, onAccept }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">AI Messages</h3>
          <p className="text-slate-500 text-xs">{messages.length} messages</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
          <X size={18} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">AI suggestions will appear here</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-xl border transition-all ${
                msg.status === 'accepted'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : msg.status === 'pending'
                  ? 'border-neon-blue/20 bg-neon-blue/5'
                  : 'border-white/5 bg-white/3'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-2">
                <span className="text-lg">{msg.icon}</span>
                <div className="flex-1">
                  <h4 className="text-white text-sm font-medium">{msg.title}</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{msg.text}</p>
                </div>
              </div>

              {/* Time info */}
              {msg.timeSaved && (
                <div className="flex gap-3 mb-3 mt-3">
                  <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    ⏱ Saves {msg.timeSaved}
                  </span>
                  {msg.extraDistance && (
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10">
                      📏 +{msg.extraDistance}
                    </span>
                  )}
                </div>
              )}

              {/* Actions / Status */}
              {msg.status === 'pending' ? (
                <button
                  onClick={() => onAccept(msg.id)}
                  className="w-full mt-2 py-2 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-xs font-medium hover:bg-neon-blue/20 transition-all flex items-center justify-center gap-1.5"
                >
                  Accept Route <ArrowRight size={12} />
                </button>
              ) : msg.status === 'accepted' ? (
                <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs">
                  <Check size={14} />
                  <span>Route accepted</span>
                </div>
              ) : null}

              {/* Timestamp */}
              <div className="flex items-center gap-1 mt-2">
                <Clock size={10} className="text-slate-600" />
                <span className="text-[10px] text-slate-600">
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
