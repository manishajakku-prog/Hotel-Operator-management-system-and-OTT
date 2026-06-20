const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  async login(username, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  async getRooms() {
    const res = await fetch(`${API_URL}/rooms`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  async getGuests() {
    const res = await fetch(`${API_URL}/guests`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch guests');
    return res.json();
  },

  async checkIn(guestData) {
    const res = await fetch(`${API_URL}/guests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(guestData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Check-in failed');
    }
    return res.json();
  },

  async checkOut(guestId, checkOutData) {
    const res = await fetch(`${API_URL}/guests/${guestId}/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(checkOutData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Checkout failed');
    }
    return res.json();
  },

  async getPayments(guestId) {
    const res = await fetch(`${API_URL}/guests/${guestId}/payments`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  async addPayment(guestId, paymentData) {
    const res = await fetch(`${API_URL}/guests/${guestId}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to add payment');
    }
    return res.json();
  },

  async getInventory() {
    const res = await fetch(`${API_URL}/inventory`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async updateInventory(itemId, quantity) {
    const res = await fetch(`${API_URL}/inventory/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update inventory');
    }
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_URL}/analytics`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getLogs() {
    const res = await fetch(`${API_URL}/logs`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  }
};
