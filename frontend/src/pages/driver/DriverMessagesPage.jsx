import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DriverMessages from './DriverMessages';
import { MockSimulator } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import wsService from '../../services/websocket'; 
import { MessageSquare, Loader2 } from 'lucide-react';

export default function DriverMessagesPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [truck, setTruck] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. KEEPING MOCK SIMULATOR INTACT
  useEffect(() => {
    const sim = new MockSimulator(
      (fleet) => setTruck(fleet[0]),
      (alert) => {
        if (!truck || alert.truckId === truck?.id) {
          const mockMsg = {
            id: alert.id,
            type: 'ai_suggestion',
            icon: alert.icon,
            title: `[MOCK] ${alert.title}`,
            text: `${alert.description} ${alert.suggestedRoute?.description || ''}`,
            timeSaved: alert.suggestedRoute?.timeSaved,
            extraDistance: alert.suggestedRoute?.additionalDistance,
            timestamp: alert.timestamp,
            status: 'pending',
          };
          setMessages((prev) => [mockMsg, ...prev]);
        }
      }
    );
    sim.start();
    return () => sim.stop();
  }, [truck?.id]);

  // 2. Real WebSocket Logic + Initial Fetch
  useEffect(() => {
    if (!user?.driverId) return;

    const token = localStorage.getItem('token');
    wsService.connect(token);

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/alerts/driver/${user.driverId}`);
        const formatted = res.data.map(msg => ({
          ...msg,
          status: msg.status || 'pending',
          type: 'ai_suggestion'
        }));
        setMessages(prev => {
          const mocks = prev.filter(m => m.title.includes('[MOCK]'));
          return [...formatted, ...mocks];
        });
        setLoading(false);
      } catch (err) { setLoading(false); }
    };

    fetchMessages();

    // Listen for real-time alerts
    const unsubscribe = wsService.subscribe(`/topic/driver/${user.driverId}`, (update) => {
      if (update.type === 'NEW_ALERT' || update.type === 'REROUTE_REQUEST') {
        const newMsg = { ...update.alert, status: 'pending', type: 'ai_suggestion' };
        setMessages(prev => [newMsg, ...prev]);
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [user?.driverId]);

  const handleAccept = async (msgId) => {
    const isMock = messages.find(m => m.id === msgId)?.title.includes('[MOCK]');
    if (!isMock) {
      try { await api.post(`/alerts/${msgId}/accept`); } 
      catch (err) { console.error("Sync failed"); }
    }
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, status: 'accepted' } : m)
    );
  };

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="p-6 border-b border-white/5 bg-brand-dark/50 backdrop-blur-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-blue/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-neon-blue" />
            </div>
            <h1 className="text-xl font-bold text-white">AI Communication Center</h1>
          </div>
          {loading && <Loader2 className="w-4 h-4 text-neon-blue animate-spin" />}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DriverMessages 
            messages={messages} 
            onAccept={handleAccept} 
          />
        </div>
      </main>
    </div>
  );
}