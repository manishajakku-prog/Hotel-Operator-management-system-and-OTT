import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GuestRegister from './components/GuestRegister';
import Inventory from './components/Inventory';
import ActivityLog from './components/ActivityLog';
import { 
  Hotel, 
  LayoutDashboard, 
  Users, 
  Boxes, 
  ClipboardList, 
  LogOut 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user session exists in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('dashboard');
  };

  if (checkingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#0b0f19',
        color: '#9ca3af'
      }}>
        Verifying Session...
      </div>
    );
  }

  // If not authenticated, render Login
  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  const isManager = user.role === 'Manager';

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <nav className="navbar">
        <div className="nav-brand">
          <Hotel size={24} style={{ color: '#6366f1' }} />
          <span>SuitesOps</span>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ 
              background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderColor: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)'
            }}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          
          <button 
            className={`btn btn-secondary ${activeTab === 'guests' ? 'active' : ''}`}
            style={{ 
              background: activeTab === 'guests' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderColor: activeTab === 'guests' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'guests' ? 'var(--primary)' : 'var(--text-muted)'
            }}
            onClick={() => setActiveTab('guests')}
          >
            <Users size={16} /> Guests & Rooms
          </button>
          
          <button 
            className={`btn btn-secondary ${activeTab === 'inventory' ? 'active' : ''}`}
            style={{ 
              background: activeTab === 'inventory' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderColor: activeTab === 'inventory' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'inventory' ? 'var(--primary)' : 'var(--text-muted)'
            }}
            onClick={() => setActiveTab('inventory')}
          >
            <Boxes size={16} /> Inventory
          </button>

          {isManager && (
            <button 
              className={`btn btn-secondary ${activeTab === 'logs' ? 'active' : ''}`}
              style={{ 
                background: activeTab === 'logs' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderColor: activeTab === 'logs' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'logs' ? 'var(--primary)' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('logs')}
            >
              <ClipboardList size={16} /> Audit Log
            </button>
          )}
        </div>

        {/* User profile & logout */}
        <div className="nav-user">
          <div className="user-badge">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.5rem 0.75rem' }}>
            <LogOut size={16} style={{ color: 'var(--danger)' }} />
          </button>
        </div>
      </nav>

      {/* Main Dashboard Workspace */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard user={user} onTabChange={setActiveTab} />
        )}
        
        {activeTab === 'guests' && (
          <GuestRegister user={user} />
        )}

        {activeTab === 'inventory' && (
          <Inventory user={user} />
        )}

        {activeTab === 'logs' && isManager && (
          <ActivityLog user={user} />
        )}
      </main>
    </div>
  );
}
