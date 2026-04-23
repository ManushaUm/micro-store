"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { checkoutAPI, catalogAPI } from '@/lib/api';

export default function Admin() {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', imageUrl: '', stock: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      checkoutAPI.getAdminOrders()
        .then(setOrders)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleStatusChange = async (id, status) => {
    try {
      await checkoutAPI.updateOrderStatus(id, status);
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeed = async () => {
    try {
      await catalogAPI.seed();
      alert('Database seeded! Please refresh.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async () => {
    setAdding(true);
    try {
      await catalogAPI.addProduct({
        ...newItem,
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock),
      });
      setShowModal(false);
      setNewItem({ name: '', description: '', price: '', imageUrl: '', stock: '' });
      alert('Item added successfully!');
    } catch (err) {
      alert('Failed to add item.');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  if (!user || user.role !== 'admin') return <div className="text-center py-8 text-error">Forbidden: Admin only</div>;
  if (loading) return <div className="text-center py-8">Loading admin panel...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
        <button className="btn-outline" onClick={handleSeed}>Seed Catalog DB</button>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Item</button>
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>All Orders</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>User ID</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>#{order.id}</td>
                <td style={{ padding: '1rem' }}>User {order.user_id}</td>
                <td style={{ padding: '1rem' }}>${parseFloat(order.total).toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: order.status === 'Delivered' ? 'var(--success)' : 'var(--primary)' }}>{order.status}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    className="input-field" 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{ width: 'auto', padding: '0.25rem 0.5rem', backgroundColor: '#0f172a' }}
                  >
                    <option value="Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass" style={{ padding: '2rem', width: '400px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New Item</h2>
            {['name', 'description', 'price', 'imageUrl', 'stock'].map(field => (
              <input
                key={field}
                className="input-field"
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={newItem[field]}
                onChange={e => setNewItem({ ...newItem, [field]: e.target.value })}
                style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
              />
            ))}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddItem} disabled={adding}>
                {adding ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
