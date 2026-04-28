import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DriverMessages from './DriverMessages';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function DriverMessagesPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!user?.driverId) return;
    try {
      const res = await api.get(`/alerts/driver/${user.driverId}`);
      const formatted = res.data.map(msg => ({
        ...msg,
        status: msg.status || 'pending',
        type: 'ai_suggestion'
      }));
      setMessages(formatted);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user?.driverId]);

  const handleAccept = async (msgId) => {
    try {
      await api.post(`/alerts/${msgId}/accept`);
    } catch (err) {
      console.error("Sync failed", err);
    }
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, status: 'accepted' } : m)
    );
  };

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <div className="min-h-14 flex flex-wrap items-center justify-between px-3 md:px-6 py-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                <MessageSquare size={16} className="text-neon-blue" />
              </div>
              <h1 className="text-white font-semibold text-sm md:text-base">Messages</h1>
              {loading && <Loader2 className="w-4 h-4 text-neon-blue animate-spin" />}
              {messages.filter(m => m.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[10px] font-medium">
                  {messages.filter(m => m.status === 'pending').length} pending
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden pb-16 md:pb-0">
          <div className="max-w-2xl mx-auto h-full">
            <DriverMessages
              messages={messages}
              onClose={() => {}}
              onAccept={handleAccept}
            />
          </div>
        </div>
      </div>
    </div>
  );
}