import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertTriangle, Plus, Minus, Package, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Inventory({ user }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Update state
  const [editItem, setEditItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory();
      setInventory(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setNewQuantity(item.quantity.toString());
    setActionError('');
    setActionSuccess('');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (newQuantity === '' || isNaN(newQuantity) || Number(newQuantity) < 0) {
      setActionError('Please enter a valid non-negative number.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await api.updateInventory(editItem.id, Number(newQuantity));
      
      // Update local state
      setInventory(inventory.map(item => item.id === editItem.id ? updated : item));
      setActionSuccess(`Successfully updated stock for ${editItem.name}.`);
      setEditItem(null);
    } catch (err) {
      setActionError(err.message || 'Failed to update stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const isManager = user.role === 'Manager';

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Hotel Inventory & Supplies</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Manage housekeeping, linen, minibar items, & toiletries.
        </div>
      </div>

      {error && (
        <div className="alert-panel danger" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={20} />
          <div>{error}</div>
        </div>
      )}

      {actionSuccess && (
        <div className="alert-panel success" style={{ background: 'var(--secondary-glow)', border: '1px solid rgba(16,185,129,0.2)', color: '#a7f3d0', marginBottom: '1.5rem' }}>
          <CheckCircle size={18} style={{ color: 'var(--secondary)' }} />
          <div>{actionSuccess}</div>
        </div>
      )}

      {/* Role Restriction Banner */}
      {!isManager && (
        <div className="alert-panel info" style={{ marginBottom: '1.5rem', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', color: '#a5f3fc' }}>
          <ShieldAlert size={18} />
          <div>
            <strong>Notice:</strong> Front Desk staff have <strong>Read-Only</strong> permissions for inventory levels. Restocking and quantity audits must be performed by a <strong>Manager</strong>.
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading inventory supplies...</div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Low-Stock Alert Level</th>
                <th>Status Alert</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const isLowStock = item.quantity <= item.threshold;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={16} style={{ color: 'var(--text-muted)' }} />
                        {item.name}
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 600 }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td>
                      {item.threshold} {item.unit}
                    </td>
                    <td>
                      {isLowStock ? (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-success">Sufficient</span>
                      )}
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleOpenEdit(item)}
                        >
                          Modify Stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modify Stock Modal */}
      {editItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Modify Supply Stock</h3>
              <button className="modal-close" onClick={() => setEditItem(null)}>×</button>
            </div>
            
            <form onSubmit={handleUpdateSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert-panel danger" style={{ marginBottom: '1rem' }}>
                    <ShieldAlert size={18} />
                    <div>{actionError}</div>
                  </div>
                )}

                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Item Selected:</p>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{editItem.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Category: {editItem.category} | Current: {editItem.quantity} {editItem.unit}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Update Stock Quantity ({editItem.unit})</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter new stock level"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)} disabled={actionLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
