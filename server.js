import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'suitesops_super_secret_key_2026';

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'database.json');

// Helper to read database
function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database", err);
    return { users: [], rooms: [], guests: [], payments: [], inventory: [], logs: [] };
  }
}

// Helper to write database
function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database", err);
  }
}

// Log utility
function addLog(user, action, details) {
  const db = readDb();
  const newLog = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    user: user ? user.name : 'System',
    role: user ? user.role : 'System',
    action,
    details
  };
  db.logs.unshift(newLog); // Prepend to show latest first
  writeDb(db);
}

// JWT verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

// Role authorization middleware
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access forbidden: Requires " + role + " privileges" });
    }
    next();
  };
}

// Helper to calculate days between dates
function getDaysCount(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  // Reset time part to count days cleanly
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 1 : diffDays;
}

// Recalculate charges and balance for a guest
function updateGuestChargesAndBalance(guest, rooms, payments) {
  const room = rooms.find(r => r.number === guest.roomNumber);
  const rate = room ? room.rate : 0;
  
  const endPoint = guest.actualCheckOutDate || guest.expectedCheckOutDate;
  const days = getDaysCount(guest.checkInDate, endPoint);
  guest.charges = days * rate;

  const guestPayments = payments.filter(p => p.guestId === guest.id);
  guest.paymentsReceived = guestPayments.reduce((sum, p) => sum + p.amount, 0);
  guest.balanceDue = guest.charges - guest.paymentsReceived;
}

// --- API ROUTES ---

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  
  // Add log
  addLog(user, 'Login', 'Logged in to system');

  res.json({
    token,
    user: {
      name: user.name,
      role: user.role,
      username: user.username
    }
  });
});

// Get all rooms
app.get('/api/rooms', authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.rooms);
});

// Get all guests
app.get('/api/guests', authenticateToken, (req, res) => {
  const db = readDb();
  
  // Dynamic recalculation on fetch to keep balances accurate
  db.guests.forEach(guest => {
    updateGuestChargesAndBalance(guest, db.rooms, db.payments);
  });
  
  res.json(db.guests);
});

// Guest Check-In
app.post('/api/guests', authenticateToken, (req, res) => {
  const { name, idNumber, phone, roomNumber, checkInDate, expectedCheckOutDate } = req.body;
  const db = readDb();

  const roomIndex = db.rooms.findIndex(r => r.number === roomNumber);
  if (roomIndex === -1) {
    return res.status(404).json({ message: "Room not found" });
  }
  
  if (db.rooms[roomIndex].status === "Occupied") {
    return res.status(400).json({ message: "Room " + roomNumber + " is already occupied" });
  }

  // Create Guest
  const newGuest = {
    id: "g_" + Date.now(),
    name,
    idNumber,
    phone,
    roomNumber,
    checkInDate,
    expectedCheckOutDate,
    actualCheckOutDate: null,
    status: "Checked In",
    charges: 0,
    paymentsReceived: 0,
    balanceDue: 0
  };

  db.rooms[roomIndex].status = "Occupied";
  updateGuestChargesAndBalance(newGuest, db.rooms, db.payments);
  
  db.guests.unshift(newGuest); // Prepend so new checkins show first
  writeDb(db);

  addLog(req.user, 'Check-In', `Checked in guest ${name} into room ${roomNumber}`);

  res.status(201).json(newGuest);
});

// Guest Check-Out (updates actual check-out date, releases room)
app.post('/api/guests/:id/checkout', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { actualCheckOutDate } = req.body;
  const db = readDb();

  const guestIndex = db.guests.findIndex(g => g.id === id);
  if (guestIndex === -1) {
    return res.status(404).json({ message: "Guest record not found" });
  }

  const guest = db.guests[guestIndex];
  if (guest.status === "Checked Out") {
    return res.status(400).json({ message: "Guest is already checked out" });
  }

  guest.actualCheckOutDate = actualCheckOutDate || new Date().toISOString().split('T')[0];
  guest.status = "Checked Out";

  // Free the room
  const roomIndex = db.rooms.findIndex(r => r.number === guest.roomNumber);
  if (roomIndex !== -1) {
    db.rooms[roomIndex].status = "Available";
  }

  updateGuestChargesAndBalance(guest, db.rooms, db.payments);
  writeDb(db);

  addLog(req.user, 'Check-Out', `Checked out guest ${guest.name} from room ${guest.roomNumber}`);

  res.json(guest);
});

// Get Payments for a Guest
app.get('/api/guests/:id/payments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const guestPayments = db.payments.filter(p => p.guestId === id);
  res.json(guestPayments);
});

// Add Payment for a Guest
app.post('/api/guests/:id/payments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount, date, mode, reference } = req.body;
  const db = readDb();

  const guestIndex = db.guests.findIndex(g => g.id === id);
  if (guestIndex === -1) {
    return res.status(404).json({ message: "Guest not found" });
  }

  const guest = db.guests[guestIndex];

  // Add Payment
  const newPayment = {
    id: "pay_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    guestId: id,
    amount: Number(amount),
    date: date || new Date().toISOString().split('T')[0],
    mode,
    reference: reference || ''
  };

  db.payments.push(newPayment);
  
  // Recalculate guest balances
  updateGuestChargesAndBalance(guest, db.rooms, db.payments);
  writeDb(db);

  addLog(req.user, 'Payment Entry', `Recorded payment of ₹${amount} (${mode}) for guest ${guest.name}`);

  res.status(201).json({ guest, payment: newPayment });
});

// Get Inventory
app.get('/api/inventory', authenticateToken, (req, res) => {
  const db = readDb();
  res.json(db.inventory);
});

// Update Inventory Stock (Managers can adjust stock directly, front desk cannot edit stock but can view)
app.put('/api/inventory/:id', authenticateToken, requireRole('Manager'), (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const db = readDb();

  const itemIndex = db.inventory.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: "Inventory item not found" });
  }

  const item = db.inventory[itemIndex];
  const oldQty = item.quantity;
  item.quantity = Number(quantity);

  writeDb(db);

  addLog(req.user, 'Inventory Update', `Updated ${item.name} stock from ${oldQty} to ${quantity} ${item.unit}`);

  res.json(item);
});

// Get Analytics
app.get('/api/analytics', authenticateToken, (req, res) => {
  const db = readDb();
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  // Dynamic recalculation of guest stats
  db.guests.forEach(guest => {
    updateGuestChargesAndBalance(guest, db.rooms, db.payments);
  });

  const totalRooms = db.rooms.length;
  const occupiedRooms = db.rooms.filter(r => r.status === "Occupied").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Payments calculations
  const revenueToday = db.payments
    .filter(p => p.date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const revenueMonth = db.payments
    .filter(p => p.date.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amount, 0);

  // Checkins / Checkouts today
  const checkInsToday = db.guests.filter(g => g.checkInDate === todayStr).length;
  const checkOutsToday = db.guests.filter(g => g.actualCheckOutDate === todayStr).length;

  // Pending dues (from active guests or outstanding invoices)
  const totalPendingDues = db.guests
    .reduce((sum, g) => sum + Math.max(0, g.balanceDue), 0);

  res.json({
    occupiedRooms,
    occupancyRate,
    revenueToday,
    revenueMonth,
    checkInsToday,
    checkOutsToday,
    totalPendingDues
  });
});

// Get Audit Logs (Manager Only)
app.get('/api/logs', authenticateToken, requireRole('Manager'), (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

// Serve frontend static build in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
