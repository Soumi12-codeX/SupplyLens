import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const id = localStorage.getItem('userId');
    const driverId = localStorage.getItem('driverId');
    const warehouse = JSON.parse(localStorage.getItem('warehouse'));

    return token ? { token, role, name, id, driverId, warehouse } : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser({
      token,
      role: localStorage.getItem('role'),
      name: localStorage.getItem('name'),
      id: localStorage.getItem('userId'),
      warehouse: JSON.parse(localStorage.getItem('warehouse'))
    });

    setLoading(false);
  }, []);
  // ✅ keeps same signature your LoginPage uses: login(role, data)
  const login = async (role, data) => {
    try {
      let token;
      if (role === 'admin') {
        const res = await api.post('/auth/admin/login', {
          email: data.email,
          password: data.password
        });

        const token = res.data.token;
        const userData = res.data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('role', 'admin');
        localStorage.setItem('name', userData.username);
        localStorage.setItem('userId', userData.id);

        // ✅ STORE WAREHOUSE
        localStorage.setItem('warehouse', JSON.stringify(userData.warehouse));

        setUser({
          token,
          role: 'admin',
          name: userData.username,
          id: userData.id,
          warehouse: userData.warehouse
        });
      } else {
        const res = await api.post('/auth/driver/login', {
          driverId: data.driverId,
          pin: data.pin
        });
        const token = res.data.token;
        const userData = res.data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('role', 'driver');
        localStorage.setItem('driverId', data.driverId);
        localStorage.setItem('name', userData.username);
        localStorage.setItem('userId', userData.id);

        setUser({
          token,
          role: 'driver',
          driverId: data.driverId,
          name: userData.username,
          id: userData.id
        });
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data || 'Invalid credentials'
      };
    }
  };

  const register = async (role, data) => {
    try {
      const payload = role === 'admin'
        ? {
          username: data.name,
          email: data.email,
          password: data.password,
          role: 'ADMIN',
          warehouse: { id: parseInt(data.warehouseId) }
        }
        : {
          username: data.name,
          pin: data.pin,
          role: 'DRIVER',
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude
        };

      const res = await api.post('/auth/register', payload);
      const assignedDriverId = role === 'driver' ? res.data?.driverId : null;
      return { success: true, driverId: assignedDriverId };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout,loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);