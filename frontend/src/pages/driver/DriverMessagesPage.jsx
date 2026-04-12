import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DriverMessages from './DriverMessages';
import { MockSimulator } from '../../services/mockData';
import { MessageSquare } from 'lucide-react';

export default function DriverMessagesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [truck, setTruck] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const sim = new MockSimulator(
      (fleet) => setTruck(fleet[0]),
      (alert) => {
        if (!truck || alert.truckId === truck?.id) {
          setMessages((prev) => [{
            id: alert.id,
            type: 'ai_suggestion',
            icon: alert.icon,
            title: alert.title,
            text: `${alert.description} ${alert.suggestedRoute?.description || ''}`,
            timeSaved: alert.suggestedRoute?.timeSaved,
            extraDistance: alert.suggestedRoute?.additionalDistance,
            timestamp: alert.timestamp,
            status: 'pending',
          }, ...prev]);
        }
      }
    );
    sim.start();
    return () => sim.stop();
  }, []);

  const handleAccept = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, status: 'accepted' } : m)
    );
  };

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                <MessageSquare size={16} className="text-neon-blue" />
              </div>
              <h1 className="text-white font-semibold text-base">Messages</h1>
              {messages.filter(m => m.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[10px] font-medium">
                  {messages.filter(m => m.status === 'pending').length} pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages Content */}
        <div className="flex-1 overflow-hidden">
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
