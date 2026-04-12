import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ComingSoonPage from './pages/ComingSoonPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveMapPage from './pages/admin/LiveMapPage';
import FleetPage from './pages/admin/FleetPage';
import CreateShipment from './pages/admin/CreateShipment';
import ManageDrivers from './pages/admin/ManageDrivers';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverNavigation from './pages/driver/DriverNavigation';
import DriverMessagesPage from './pages/driver/DriverMessagesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/coming-soon" element={<ComingSoonPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/map" element={<LiveMapPage />} />
      <Route path="/admin/fleet" element={<FleetPage />} />
      <Route path="/admin/shipment" element={<CreateShipment />} />
      <Route path="/admin/drivers" element={<ManageDrivers />} />
      <Route path="/admin/alerts" element={<AdminDashboard />} />
      <Route path="/driver" element={<DriverDashboard />} />
      <Route path="/driver/navigation" element={<DriverNavigation />} />
      <Route path="/driver/messages" element={<DriverMessagesPage />} />
    </Routes>
  );
}

export default App;
