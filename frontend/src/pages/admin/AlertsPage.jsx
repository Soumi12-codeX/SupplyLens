import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import AINotification from '../../components/AINotification';
import api from '../../services/api';
import { AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function AlertsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts/all');
      const activeAlerts = res.data.filter(a => a.status === 'PENDING');
      const formattedAlerts = activeAlerts.map(a => ({
        id: a.id,
        truckId: a.affectedShipmentIds ? `SHP-${a.affectedShipmentIds.split(',')[0]}` : 'Unknown',
        driverName: "Affected Driver",
        title: "AI Route Optimization",
        description: a.messsage || "Obstacle detected. Rerouting recommended.",
        affectedArea: a.nodeName || "Unknown Node",
        timestamp: a.time,
        severity: a.severity === 1 ? 'critical' : (a.severity === 2 ? 'high' : 'medium'),
        icon: <AlertTriangle size={20} className="text-red-400" />,
        routeOptions: a.routeOptions?.map(ro => ({
          id: ro.id,
          label: ro.label,
          path: ro.path,
          estimatedHours: ro.estimatedHours,
          riskLevel: ro.riskLevel,
          tradeoff: ro.tradeoff
        })) || []
      }));
      
      // Sort so critical comes first, then high, then medium
      const sevRank = { critical: 1, high: 2, medium: 3 };
      formattedAlerts.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
      
      setAlerts(formattedAlerts);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveAlert = async (alert) => {
    try {
      const bestOption = alert.routeOptions?.[0];
      if (!bestOption) {
        alert("No AI suggested route found for this alert.");
        return;
      }

      const shipmentIdStr = alert.truckId.replace('SHP-', '');
      if (isNaN(shipmentIdStr)) {
        console.error("Invalid shipment ID:", shipmentIdStr);
        return;
      }

      const shipRes = await api.get(`/admin/shipments`);
      const shipment = shipRes.data.find(s => s.id.toString() === shipmentIdStr);
      
      const sourceWhId = shipment?.warehouse?.id || 1;
      const destWhId = shipment?.route?.destination?.id || 2;

      await api.post(`/alerts/${alert.id}/select-route/${bestOption.id}?sourceWhId=${sourceWhId}&destWhId=${destWhId}`);
      
      // Delay removal so the user sees the "Message sent to driver" button state
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 2000);
    } catch (err) {
      console.error("Failed to approve alert:", err);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/dismiss`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Command Center Alerts</h1>
              <p className="text-slate-400 text-sm">Review AI-detected obstacles and approve suggested detours.</p>
            </div>
            
            {alerts.length > 0 && (
              <div className="px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold text-sm flex items-center gap-2">
                <AlertTriangle size={18} />
                {alerts.length} Active Alerts
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-900/50 rounded-2xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">All Clear</h3>
              <p className="text-slate-400">No active obstacles or alerts in the network.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {alerts.map(alert => (
                <div key={alert.id} className="w-full max-w-md">
                  <AINotification
                    alert={alert}
                    onApprove={handleApproveAlert}
                    onDismiss={() => handleDismissAlert(alert.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16 shrink-0" />
    </div>
  );
}
