"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { checkoutAPI } from '@/lib/api';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkoutAPI.getOrders()
        .then(setOrders)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await checkoutAPI.cancelOrder(id);
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o));
    } catch (err) {
      alert('Could not cancel order.');
    }
  };


  if (!user) return <div className="text-center py-8">Please login.</div>;
  if (loading) return <div className="text-center py-8">Loading orders...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="glass text-center py-8">
          <p>You have no orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.id} className="glass" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Order #{order.id}</p>
                  <p style={{ fontSize: '0.875rem' }}>{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 'bold',
                    background: order.status === 'Delivered' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                    color: order.status === 'Delivered' ? 'var(--success)' : 'var(--primary)'
                  }}>
                    {order.status === 'Delivered' ? <CheckCircle size={14} /> : <Clock size={14} />} {order.status}
                  </span>
                  <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginTop: '0.5rem' }}>${parseFloat(order.total).toFixed(2)}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                    <Package size={16} style={{ color: '#94a3b8' }}/>
                    <span>{item.quantity} × {item.name}</span>
                  </div>
                ))}
              </div>

              {['Placed', 'Processing'].includes(order.status) && (
                <button
                  className="btn-outline"
                  onClick={() => handleCancel(order.id)}
                  style={{ marginTop: '1rem' }}
                >
                  Cancel Order
                </button>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
