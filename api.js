import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, UserPlus, Filter, ShieldAlert, Sparkles, User, FileText } from 'lucide-react';
import PaymentModal from './PaymentModal';

export default function GuestRegister({ user }) {
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    expectedCheckOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const roomsData = await api.getRooms();
      const guestsData = await api.getGuests();
      setRooms(roomsData);
      setGuests(guestsData);
      setFilteredGuests(guestsData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch rooms or guests registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter guest list dynamically
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let result = guests;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(query) ||
        g.roomNumber.includes(query) ||
        g.phone.includes(query) ||
        g.idNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Checked In') {
        result = result.filter(g => g.status === 'Checked In');
      } else if (statusFilter === 'Checked Out') {
        result = result.filter(g => g.status === 'Checked Out');
      } else if (statusFilter === 'Overdue') {
        result = result.filter(g => g.status === 'Checked In' && g.expectedCheckOutDate < todayStr);
      }
    }

    setFilteredGuests(result);
  }, [searchQuery, statusFilter, guests]);

  const handleOpenCheckIn = (roomNum) => {
    setSelectedRoomNumber(roomNum);
    setFormData({
      name: '',
      idNumber: '',
      phone: '',
      checkInDate: new Date().toISOString().split('T')[0],
      expectedCheckOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    setFormError('');
    setCheckInModalOpen(true);
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.name.trim()) return setFormError('Guest name is required.');
    if (!formData.idNumber.trim()) return setFormError('Govt ID number is required.');
    if (!formData.phone.trim()) return setFormError('Phone number is required.');
    if (!selectedRoomNumber) return setFormError('Please select a room.');
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkIn = new Date(formData.checkInDate);
    checkIn.setHours(0,0,0,0);
    const checkOut = new Date(formData.expectedCheckOutDate);
    checkOut.setHours(0,0,0,0);

    if (checkIn < today) {
      return setFormError('Check-in date cannot be in the past.');
    }
    if (checkOut <= checkIn) {
      return setFormError('Expected check-out date must be at least 1 day after check-in.');
    }

    setFormLoading(true);
    try {
      await api.checkIn({
        name: formData.name.trim(),
        idNumber: formData.idNumber.trim(),
        phone: formData.phone.trim(),
        roomNumber: selectedRoomNumber,
        checkInDate: formData.checkInDate,
        expectedCheckOutDate: formData.expectedCheckOutDate
      });
      setCheckInModalOpen(false);
      // Reload lists
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Check-in failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoomClick = (room) => {
    if (room.status === 'Available') {
      handleOpenCheckIn(room.number);
    } else {
      // Find active guest checked-in to this room
      const activeGuest = guests.find(g => g.roomNumber === room.number && g.status === 'Checked In');
      if (activeGuest) {
        handleOpenPaymentModal(activeGuest);
      }
    }
  };

  const handleOpenPaymentModal = (guest) => {
    setSelectedGuest(guest);
    setPaymentModalOpen(true);
  };

  const handlePaymentModalClose = async (reload = false) => {
    setPaymentModalOpen(false);
    setSelectedGuest(null);
    if (reload) {
      await loadData();
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Rooms & Guest Registry</h2>
        <button className="btn btn-primary" onClick={() => handleOpenCheckIn('')}>
          <UserPlus size={18} /> New Check-In
        </button>
      </div>

      {error && (
        <div className="alert-panel danger" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Room Grid View */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} /> Interactive Room Status Grid
        </h3>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading rooms layout...</div>
        ) : (
          <div className="room-grid">
            {rooms.map(room => (
              <div 
                key={room.id} 
                className={`room-card ${room.status}`} 
                onClick={() => handleRoomClick(room)}
              >
                <div className="room-number">{room.number}</div>
                <div className="room-type">{room.type}</div>
                <span className="room-status-badge">
                  {room.status === 'Available' ? 'Available' : 'Occupied'}
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  ₹{room.rate.toLocaleString()}/day
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest Table Filters */}
      <div className="section-header" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h3 className="section-title">Guest Registry & Invoices</h3>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by guest name, room number, phone, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="select-filter" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Guests</option>
            <option value="Checked In">Active (Checked In)</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Overdue">Overdue Departures</option>
          </select>
        </div>
      </div>

      {/* Guest List Table */}
      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading registry records...</div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Total Charges</th>
                <th>Received</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length > 0 ? (
                filteredGuests.map(guest => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isOverdue = guest.status === 'Checked In' && guest.expectedCheckOutDate < todayStr;
                  
                  return (
                    <tr key={guest.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{guest.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ID: {guest.idNumber} | Tel: {guest.phone}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>Room {guest.roomNumber}</td>
                      <td>{guest.checkInDate}</td>
                      <td>
                        {guest.status === 'Checked Out' ? (
                          <span>{guest.actualCheckOutDate}</span>
                        ) : (
                          <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                            {guest.expectedCheckOutDate} (Est)
                          </span>
                        )}
                      </td>
                      <td>₹{guest.charges.toLocaleString()}</td>
                      <td style={{ color: 'var(--secondary)' }}>₹{guest.paymentsReceived.toLocaleString()}</td>
                      <td style={{ 
                        fontWeight: 600, 
                        color: guest.balanceDue > 0 ? 'var(--accent)' : 'var(--secondary)'
                      }}>
                        ₹{guest.balanceDue.toLocaleString()}
                      </td>
                      <td>
                        {guest.status === 'Checked Out' ? (
                          <span className="badge badge-info">Checked Out</span>
                        ) : isOverdue ? (
                          <span className="badge badge-danger">Overdue Out</span>
                        ) : (
                          <span className="badge badge-success">Checked In</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleOpenPaymentModal(guest)}
                        >
                          <FileText size={14} /> Ledger & PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No guests matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Check-In Form Modal */}
      {checkInModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">New Guest Check-In</h3>
              <button className="modal-close" onClick={() => setCheckInModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleCheckInSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-panel danger" style={{ marginBottom: '1.25rem' }}>
                    <ShieldAlert size={18} />
                    <div>{formError}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Guest Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter guest name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Govt ID Number (Passport / Aadhaar)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 1234-5678-9012"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Room Number</label>
                  <select 
                    className="form-input" 
                    value={selectedRoomNumber}
                    onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  >
                    <option value="">-- Choose a Room --</option>
                    {rooms.map(room => (
                      <option 
                        key={room.id} 
                        value={room.number} 
                        disabled={room.status === 'Occupied'}
                      >
                        Room {room.number} - {room.type} (₹{room.rate.toLocaleString()}/day) {room.status === 'Occupied' ? '[OCCUPIED]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Check-In Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Expected Check-Out Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expectedCheckOutDate}
                      onChange={(e) => setFormData({ ...formData, expectedCheckOutDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCheckInModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Check-In Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment and Checkout Modal */}
      {paymentModalOpen && selectedGuest && (
        <PaymentModal
          guest={selectedGuest}
          user={user}
          onClose={handlePaymentModalClose}
        />
      )}
    </div>
  );
}
