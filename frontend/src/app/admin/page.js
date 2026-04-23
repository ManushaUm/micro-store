"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { checkoutAPI, catalogAPI } from '@/lib/api';

export default function Admin() {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!user || user.role !== 'admin') return <div className="text-center py-8 text-error">Forbidden: Admin only</div>;
  if (loading) return <div className="text-center py-8">Loading admin panel...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
        <button className="btn-outline" onClick={handleSeed}>Seed Catalog DB</button>
      </div>

      <div className="glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>All Orders</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>User ID</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Pay Method</th>
              <th style={{ padding: '1rem' }}>Address</th>
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
                <td style={{ padding: '1rem' }}>
                   <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>{order.payment_method || 'N/A'}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {order.delivery_details ? (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      <p>{order.delivery_details.fullName}</p>
                      <p>{order.delivery_details.address}, {order.delivery_details.city}</p>
                      <p>Tel: {order.delivery_details.phone}</p>
                    </div>
                  ) : 'N/A'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: order.status === 'Delivered' ? 'var(--success)' : 'var(--primary)', fontWeight: 'bold' }}>{order.status}</span>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{order.payment_status}</div>
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
    </div>
  );
}
