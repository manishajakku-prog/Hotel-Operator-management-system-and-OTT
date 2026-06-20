import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
  import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Bed, 
  Coins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard({ user, onTabChange }) {
  const [analytics, setAnalytics] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [overdueGuests, setOverdueGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Fetch analytics
        const stats = await api.getAnalytics();
        setAnalytics(stats);

        // Fetch inventory to check for low stock
        const inventory = await api.getInventory();
        const lowStock = inventory.filter(item => item.quantity <= item.threshold);
        setInventoryAlerts(lowStock);

        // Fetch guests to check for overdue check-outs
        const guests = await api.getGuests();
        const todayStr = new Date().toISOString().split('T')[0];
        const overdue = guests.filter(guest => {
          return guest.status === 'Checked In' && guest.expectedCheckOutDate < todayStr;
        });
        setOverdueGuests(overdue);

      } catch (err) {
        console.error("Dashboard load error", err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Analytics...</div>;
  }

  if (error) {
    return (
      <div className="alert-panel danger">
        <ShieldAlert size={20} />
        <div>{error}</div>
      </div>
    );
  }

  const isManager = user.role === 'Manager';

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Operations Dashboard</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Occupancy Today</h3>
            <div className="stat-value">{analytics.occupiedRooms} / 9</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Rate: {analytics.occupancyRate}%
            </p>
          </div>
          <div className="stat-icon primary">
            <Bed size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Check-Ins Today</h3>
            <div className="stat-value">{analytics.checkInsToday}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Expected arrivals
            </p>
          </div>
          <div className="stat-icon success">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Check-Outs Today</h3>
            <div className="stat-value">{analytics.checkOutsToday}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Completed departures
            </p>
          </div>
          <div className="stat-icon info">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Pending Dues</h3>
            <div className="stat-value" style={{ color: isManager && analytics.totalPendingDues > 0 ? 'var(--accent)' : 'inherit' }}>
              {isManager ? `₹${analytics.totalPendingDues.toLocaleString()}` : 'Restricted'}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {isManager ? 'Outstanding balance' : 'Managers only'}
            </p>
          </div>
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Financials for Managers */}
      {isManager ? (
        <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(17, 24, 39, 0.85) 100%)' }}>
            <div className="stat-info">
              <h3>Revenue Collected (Today)</h3>
              <div className="stat-value" style={{ color: 'var(--secondary)' }}>
                ₹{analytics.revenueToday.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                All payment channels
              </p>
            </div>
            <div className="stat-icon success">
              <Coins size={24} />
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(17, 24, 39, 0.85) 100%)' }}>
            <div className="stat-info">
              <h3>Revenue Collected (This Month)</h3>
              <div className="stat-value" style={{ color: 'var(--info)' }}>
                ₹{analytics.revenueMonth.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Monthly accumulator
              </p>
            </div>
            <div className="stat-icon primary">
              <Coins size={24} />
            </div>
          </div>
        </div>
      ) : (
        <div className="alert-panel info" style={{ marginBottom: '2.5rem', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', color: '#a5f3fc' }}>
          <ShieldAlert size={20} />
          <div>
            <strong>Notice:</strong> Financial indicators (Revenue reports) are restricted to <strong>Manager</strong> accounts only. Front desk staff can record check-ins, check-outs, and payments in the Guest tab.
          </div>
        </div>
      )}

      {/* Warnings & Actionable Alerts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Overdue Check-Outs Alert Card */}
        <div className="table-container" style={{ padding: '1.5rem' }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: overdueGuests.length > 0 ? 'var(--danger)' : 'inherit', marginBottom: '1.25rem' }}>
            <AlertTriangle size={20} />
            Overdue Guests ({overdueGuests.length})
          </h3>
          {overdueGuests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {overdueGuests.map(guest => (
                <div key={guest.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{guest.name} (Room {guest.roomNumber})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Expected Out: {guest.expectedCheckOutDate}
                    </div>
                  </div>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={() => onTabChange('guests')}
                  >
                    Resolve / Bill
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No guests are currently overdue for checkout.
            </div>
          )}
        </div>

        {/* Low Stock Inventory Alert Card */}
        <div className="table-container" style={{ padding: '1.5rem' }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: inventoryAlerts.length > 0 ? 'var(--accent)' : 'inherit', marginBottom: '1.25rem' }}>
            <AlertTriangle size={20} />
            Low-Stock Supplies ({inventoryAlerts.length})
          </h3>
          {inventoryAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {inventoryAlerts.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Category: {item.category} | Min Threshold: {item.threshold} {item.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
              {isManager && (
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                  onClick={() => onTabChange('inventory')}
                >
                  Restock Inventory Items
                </button>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
              All hotel supplies are currently above safety stock thresholds.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
