import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldAlert, ListFilter, Calendar } from 'lucide-react';

export default function ActivityLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const data = await api.getLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch activity audit trail logs.');
      } finally {
        setLoading(false);
      }
    }

    if (user.role === 'Manager') {
      fetchLogs();
    } else {
      setError('Access Denied: You do not have permissions to view system logs.');
      setLoading(false);
    }
  }, [user.role]);

  if (user.role !== 'Manager') {
    return (
      <div className="alert-panel danger" style={{ marginTop: '2rem' }}>
        <ShieldAlert size={20} />
        <div>
          <strong>Security Violation:</strong> Staff Activity Log is restricted to Manager accounts. Action has been reported.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Staff Activity Log & Audit Trail</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Real-time accountability tracking for hotel operational events.
        </div>
      </div>

      {error && (
        <div className="alert-panel danger" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={20} />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading audit logs...</div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Role</th>
                <th>Action Type</th>
                <th>Operational Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.user}</td>
                    <td>
                      <span className={`badge ${log.role === 'Manager' ? 'badge-danger' : 'badge-info'}`}>
                        {log.role}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ 
                        background: log.action === 'Login' ? 'rgba(99,102,241,0.15)' : 
                                    log.action === 'Check-Out' ? 'rgba(239,68,68,0.15)' : 
                                    log.action === 'Inventory Update' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: log.action === 'Login' ? 'var(--primary)' :
                               log.action === 'Check-Out' ? 'var(--danger)' :
                               log.action === 'Inventory Update' ? 'var(--accent)' : 'var(--secondary)'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No system logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
