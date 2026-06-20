import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  CreditCard, 
  IndianRupee, 
  FileText, 
  Download, 
  Calendar, 
  User, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function PaymentModal({ guest: initialGuest, user, onClose }) {
  const [guest, setGuest] = useState(initialGuest);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch payments
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const data = await api.getPayments(guest.id);
      setPayments(data);
    } catch (err) {
      console.error(err);
      setActionError('Failed to load payment history.');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [guest.id]);

  // Calculate days count between dates
  const getDaysCount = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setActionError('');
    setSuccessMessage('');

    if (!payAmount || Number(payAmount) <= 0) {
      setActionError('Please enter a valid payment amount.');
      return;
    }

    setActionLoading(true);
    try {
      const result = await api.addPayment(guest.id, {
        amount: Number(payAmount),
        date: new Date().toISOString().split('T')[0],
        mode: payMode,
        reference: payRef.trim()
      });

      // Update local state with returned guest details
      setGuest(result.guest);
      setPayAmount('');
      setPayRef('');
      setSuccessMessage(`Payment of ₹${Number(payAmount).toLocaleString()} recorded successfully.`);
      
      // Reload payments list
      await fetchPayments();
    } catch (err) {
      setActionError(err.message || 'Failed to record payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionError('');
    setSuccessMessage('');
    
    // Warn if checkout has dues
    if (guest.balanceDue > 0) {
      if (!confirm(`Warning: The guest has outstanding dues of ₹${guest.balanceDue.toLocaleString()}. Are you sure you want to check out before full payment?`)) {
        return;
      }
    }

    setActionLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await api.checkOut(guest.id, {
        actualCheckOutDate: todayStr
      });
      setGuest(result);
      setSuccessMessage('Guest has been checked out successfully. Room status released.');
      await fetchPayments();
    } catch (err) {
      setActionError(err.message || 'Failed to execute checkout.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate jsPDF receipt
  const generatePDFInvoice = () => {
    const doc = new jsPDF();
    
    // Styling constants
    const primaryColor = [99, 102, 241]; // Indigo
    const darkSlate = [15, 23, 42];
    const lightSlate = [241, 245, 249];
    
    // Document header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("RK Suites", 20, 25);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Industry Internship Programme | Aurora Institute", 20, 31);
    doc.text("Hotels | Hyderabad, Telangana, India", 20, 36);
    doc.text("Email: operations@rksuites.com | Tel: +91 40 2345 6789", 20, 41);
    
    // Top border line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 46, 190, 46);
    
    // Invoice details heading
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("GUEST INVOICE / RECEIPT", 20, 56);
    
    // Receipt Metadata
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Receipt ID: SUITE-${guest.id.substring(2, 7).toUpperCase()}`, 130, 56);
    doc.text(`Issue Date: ${new Date().toISOString().split('T')[0]}`, 130, 61);
    doc.text(`Billing Mode: ${guest.status === 'Checked Out' ? 'Finalized' : 'Estimated'}`, 130, 66);
    
    // Guest Details Panel
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 72, 170, 24, "F");
    doc.setDrawColor(241, 245, 249);
    doc.rect(20, 72, 170, 24, "S");
    
    doc.setFont("Helvetica", "bold");
    doc.text("Guest Information", 25, 78);
    doc.setFont("Helvetica", "normal");
    doc.text(`Name: ${guest.name}`, 25, 84);
    doc.text(`Phone: ${guest.phone}`, 25, 90);
    doc.text(`Govt ID: ${guest.idNumber}`, 85, 84);
    
    // Stay Details Panel
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 102, 170, 24, "F");
    doc.rect(20, 102, 170, 24, "S");
    
    doc.setFont("Helvetica", "bold");
    doc.text("Stay & Room Details", 25, 108);
    doc.setFont("Helvetica", "normal");
    doc.text(`Room Allocated: Room ${guest.roomNumber}`, 25, 114);
    doc.text(`Check-In: ${guest.checkInDate}`, 25, 120);
    
    const checkoutVal = guest.actualCheckOutDate || `${guest.expectedCheckOutDate} (Est)`;
    doc.text(`Check-Out: ${checkoutVal}`, 105, 114);
    const totalDays = getDaysCount(guest.checkInDate, guest.actualCheckOutDate || guest.expectedCheckOutDate);
    doc.text(`Duration: ${totalDays} Day(s)`, 105, 120);
    
    // Billing Table
    doc.setFillColor(99, 102, 241);
    doc.rect(20, 132, 170, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Billing Item Description", 22, 137);
    doc.text("Rate/Day", 90, 137);
    doc.text("Days", 125, 137);
    doc.text("Total", 160, 137);
    
    // Row values
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    
    const roomRate = guest.charges / totalDays;
    doc.text(`Room Rental (Room ${guest.roomNumber})`, 22, 147);
    doc.text(`Rs. ${roomRate.toLocaleString()}`, 90, 147);
    doc.text(`${totalDays}`, 125, 147);
    doc.text(`Rs. ${guest.charges.toLocaleString()}`, 160, 147);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 152, 190, 152);
    
    // Summary
    let summaryY = 160;
    doc.text("Gross Charges:", 120, summaryY);
    doc.text(`Rs. ${guest.charges.toLocaleString()}`, 160, summaryY);
    
    summaryY += 6;
    doc.text("Payments Applied:", 120, summaryY);
    doc.setTextColor(16, 185, 129); // Green for payments
    doc.text(`Rs. -${guest.paymentsReceived.toLocaleString()}`, 160, summaryY);
    
    summaryY += 7;
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(guest.balanceDue > 0 ? 245 : 16, guest.balanceDue > 0 ? 158 : 185, guest.balanceDue > 0 ? 11 : 129);
    doc.text("Net Balance Due:", 120, summaryY);
    doc.text(`Rs. ${guest.balanceDue.toLocaleString()}`, 160, summaryY);
    
    // Payments history subsection
    let paymentsY = summaryY + 15;
    if (payments.length > 0) {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text("Payments History", 20, paymentsY);
      
      // Header for payments
      paymentsY += 6;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, paymentsY, 170, 6, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Payment Date", 22, paymentsY + 4);
      doc.text("Payment Method", 65, paymentsY + 4);
      doc.text("Reference No.", 110, paymentsY + 4);
      doc.text("Amount Received", 155, paymentsY + 4);
      
      doc.setFont("Helvetica", "normal");
      payments.forEach((p) => {
        paymentsY += 6;
        doc.text(p.date, 22, paymentsY + 4);
        doc.text(p.mode, 65, paymentsY + 4);
        doc.text(p.reference || 'N/A', 110, paymentsY + 4);
        doc.text(`Rs. ${p.amount.toLocaleString()}`, 155, paymentsY + 4);
      });
    }
    
    // Notes / Signoff
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for staying at RK Suites. We look forward to hosting you again!", 45, 275);
    
    doc.save(`Invoice_Room_${guest.roomNumber}_${guest.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Billing Ledger - Room {guest.roomNumber}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Guest: <strong>{guest.name}</strong> | Status: <strong>{guest.status}</strong>
            </span>
          </div>
          <button className="modal-close" onClick={() => onClose(true)}>×</button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {actionError && (
            <div className="alert-panel danger">
              <ShieldAlert size={18} />
              <div>{actionError}</div>
            </div>
          )}

          {successMessage && (
            <div className="alert-panel success" style={{ background: 'var(--secondary-glow)', border: '1px solid rgba(16,185,129,0.2)', color: '#a7f3d0' }}>
              <CheckCircle size={18} style={{ color: 'var(--secondary)' }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Ledger Numbers Summary Grid */}
          <div className="ledger-summary">
            <div className="ledger-item">
              <div className="label">Total Charges</div>
              <div className="value">₹{guest.charges.toLocaleString()}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {getDaysCount(guest.checkInDate, guest.actualCheckOutDate || guest.expectedCheckOutDate)} Day(s) Stay
              </span>
            </div>
            <div className="ledger-item paid">
              <div className="label">Total Paid</div>
              <div className="value">₹{guest.paymentsReceived.toLocaleString()}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Recorded payments
              </span>
            </div>
            <div className="ledger-item dues">
              <div className="label">Balance Due</div>
              <div className="value" style={{ 
                color: guest.balanceDue > 0 ? 'var(--accent)' : 'var(--secondary)' 
              }}>
                ₹{guest.balanceDue.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {guest.balanceDue > 0 ? 'Outstanding' : 'Fully Settled'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Record Payment Form */}
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IndianRupee size={16} /> Record Guest Payment
              </h4>
              
              <form onSubmit={handleAddPayment}>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter amount to pay"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-input" 
                    value={payMode} 
                    onChange={(e) => setPayMode(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reference Number (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Transaction ID, Check No."
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={actionLoading}>
                  Record Payment
                </button>
              </form>
            </div>

            {/* Billing History / Payments Table */}
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} /> Payments History
              </h4>
              {paymentsLoading ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading payments log...</div>
              ) : payments.length > 0 ? (
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <table className="responsive-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Mode</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{p.date}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <div>{p.mode}</div>
                            {p.reference && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ref: {p.reference}</div>}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--secondary)' }}>
                            ₹{p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  No payments recorded yet.
                </div>
              )}
            </div>

          </div>

          {/* Dues Alert Warning */}
          {guest.status === 'Checked In' && guest.balanceDue > 0 && (
            <div className="alert-panel warning" style={{ marginTop: '1.5rem', marginBottom: '0px' }}>
              <ShieldAlert size={20} />
              <div>
                <strong>Notice:</strong> Guest has an outstanding balance of <strong>₹{guest.balanceDue.toLocaleString()}</strong>. Settling the balance before completing Checkout is recommended.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            <button className="btn btn-secondary" onClick={generatePDFInvoice}>
              <Download size={14} /> Download Invoice PDF
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => onClose(true)}>Close</button>
            {guest.status === 'Checked In' && (
              <button className="btn btn-danger" onClick={handleCheckOut} disabled={actionLoading}>
                Check-Out Guest & Release Room
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
