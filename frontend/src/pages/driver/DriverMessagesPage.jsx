import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DriverMessages from './DriverMessages';
import { MockSimulator } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function DriverMessagesPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [truck, setTruck] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Mock Simulator Logic (Visual Tracking)
  useEffect(() => {
    const sim = new MockSimulator(
      (fleet) => setTruck(fleet[0]),
      (alert) => {
        // Only add mock alerts if we don't have real ones or for testing simulation
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

  // 2. Real API Polling Logic (Official Alerts)
  useEffect(() => {
    if (!user?.driverId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/alerts/driver/${user.driverId}`);
        
        // Transform backend data to match your UI format if necessary
        const formattedRealMessages = res.data.map(msg => ({
          ...msg,
          // Ensure these fields exist for the DriverMessages component
          status: msg.status || 'pending', 
          type: 'ai_suggestion'
        }));

        // Merge or replace. Here we replace to keep the list clean with latest DB state
        setMessages(prev => {
          // Keep mock messages but update/add real ones
          const mocks = prev.filter(m => m.title.includes('[MOCK]'));
          return [...formattedRealMessages, ...mocks];
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch real messages:", err);
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); 
    return () => clearInterval(interval);
  }, [user?.driverId]);

  const handleAccept = async (msgId) => {
    // If it's a real message (not mock), sync with backend
    const isMock = messages.find(m => m.id === msgId)?.title.includes('[MOCK]');
    
    if (!isMock) {
      try {
        await api.post(`/alerts/${msgId}/accept`);
      } catch (err) {
        console.error("Failed to sync acceptance with backend");
      }
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