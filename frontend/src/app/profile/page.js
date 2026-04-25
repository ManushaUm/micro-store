"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { checkoutAPI } from '@/lib/api';
import {
  Package, Clock, CheckCircle, ShoppingBag, User,
  ChevronDown, ChevronUp, MapPin, Phone, Mail,
  Edit3, Save, X, Shield, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_STYLES = {
  Delivered:  { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', icon: <CheckCircle size={13} /> },
  Placed:     { bg: 'rgba(59,130,246,0.15)',   color: '#3b82f6', icon: <Clock size={13} /> },
  Processing: { bg: 'rgba(245,158,11,0.15)',   color: '#f59e0b', icon: <Clock size={13} /> },
  Shipped:    { bg: 'rgba(139,92,246,0.15)',   color: '#8b5cf6', icon: <Package size={13} /> },
  Cancelled:  { bg: 'rgba(239,68,68,0.15)',    color: '#ef4444', icon: <X size={13} /> },
};

const TAB_STYLE = (active) => ({
  padding: '0.6rem 1.25rem',
  borderRadius: '0.5rem',
  fontWeight: '600',
  fontSize: '0.875rem',
  cursor: 'pointer',
  border: 'none',
  background: active ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
  color: active ? 'white' : '#94a3b8',
  transition: 'all 0.2s',
});

export default function Profile() {
  const { user } = useAppContext();
  const router   = useRouter();

  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [tab,      setTab]      = useState('orders'); // 'orders' | 'profile' | 'address'

  // Delivery address state (stored locally — extend to backend later)
  const [address, setAddress]     = useState({ fullName: '', phone: '', street: '', city: '', state: '', zip: '', country: '' });
  const [editAddr, setEditAddr]   = useState(false);
  const [addrSaved, setAddrSaved] = useState(false);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`delivery_address_${user.id}`);
      if (saved) setAddress(JSON.parse(saved));
    }
  }, [user]);

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

  const saveAddress = () => {
    localStorage.setItem(`delivery_address_${user.id}`, JSON.stringify(address));
    setEditAddr(false);
    setAddrSaved(true);
    setTimeout(() => setAddrSaved(false), 2500);
  };

  if (!user) return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass" style={{ padding: '3rem' }}>
        <User size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.75rem' }}>Please log in</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Sign in to view your profile and orders.</p>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => router.push('/login')}>Login</button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const totalSpent    = orders.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Profile header card ── */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900', color: 'white', flexShrink: 0, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
            {user.email?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</h1>
              <span style={{ background: user.role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: user.role === 'admin' ? '#ef4444' : '#3b82f6', fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                {user.role === 'admin' ? '⭐ Admin' : 'Customer'}
              </span>
            </div>
            {address.fullName && <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>{address.fullName} · {address.city || 'No city set'}</p>}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
            {[
              { value: orders.length, label: 'Orders', color: 'var(--primary)' },
              { value: deliveredCount, label: 'Delivered', color: '#10b981' },
              { value: `$${totalSpent.toFixed(0)}`, label: 'Total Spent', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={TAB_STYLE(tab === 'orders')}  onClick={() => setTab('orders')}>
          <Package size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />My Orders
        </button>
        <button style={TAB_STYLE(tab === 'profile')} onClick={() => setTab('profile')}>
          <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Profile Details
        </button>
        <button style={TAB_STYLE(tab === 'address')} onClick={() => setTab('address')}>
          <MapPin size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Delivery Address
        </button>
      </div>

      {/* ════════════ ORDERS TAB ════════════ */}
      {tab === 'orders' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Order History</h2>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          </div>

          {orders.length === 0 ? (
            <div className="glass" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <ShoppingBag size={56} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No orders yet</h3>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Your order history will appear here.</p>
              <button className="btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={() => router.push('/')}>Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {orders.map(order => {
                const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES['Placed'];
                const items       = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                const isOpen      = expanded === order.id;

                return (
                  <div key={order.id} className="glass" style={{ overflow: 'hidden' }}>
                    {/* Row */}
                    <div style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                      onClick={() => setExpanded(isOpen ? null : order.id)}>

                      <div style={{ width: '38px', height: '38px', borderRadius: '0.6rem', background: statusStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusStyle.color, flexShrink: 0 }}>
                        {statusStyle.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Order #{order.id}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                          {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {' · '}{items.length} item{items.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: statusStyle.bg, color: statusStyle.color, fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>
                        {statusStyle.icon} {order.status}
                      </div>

                      <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--primary)', flexShrink: 0, minWidth: '70px', textAlign: 'right' }}>
                        ${parseFloat(order.total).toFixed(2)}
                      </div>

                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>

                    {/* Expanded items */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600' }}>{item.name}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.quantity} × ${parseFloat(item.price).toFixed(2)}</div>
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--primary)' }}>${(item.quantity * item.price).toFixed(2)}</div>
                          </div>
                        ))}
                        {order.delivery_details && (
                          <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                            <MapPin size={12} style={{ display: 'inline', marginRight: '6px' }} />
                            {order.delivery_details.address}, {order.delivery_details.city}
                          </div>
                        )}
                        {['Placed', 'Processing'].includes(order.status) && (
                          <button
                            className="btn-outline"
                            onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                            style={{ marginTop: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.8rem', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.4)' }}>
                            <X size={14} /> Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════ PROFILE TAB ════════════ */}
      {tab === 'profile' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Account Details</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: <Mail size={16} />,   label: 'Email Address', value: user.email },
              { icon: <Shield size={16} />, label: 'Role',          value: user.role === 'admin' ? 'Administrator' : 'Customer' },
              { icon: <Star size={16} />,   label: 'Member Since',  value: 'Active Member' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.6rem', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                  {row.icon}
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '2px' }}>{row.label}</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59,130,246,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.8rem', color: '#94a3b8' }}>
            To change your email or password, please contact support.
          </div>
        </div>
      )}

      {/* ════════════ ADDRESS TAB ════════════ */}
      {tab === 'address' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Delivery Address</h2>
            {!editAddr ? (
              <button className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => setEditAddr(true)}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={saveAddress}>
                  <Save size={14} /> {addrSaved ? 'Saved!' : 'Save'}
                </button>
                <button className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setEditAddr(false)}>
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>

          {addrSaved && (
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.6rem', padding: '0.75rem 1rem', color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem' }}>
              ✓ Address saved successfully!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { key: 'fullName', label: 'Full Name',    placeholder: 'John Doe',         col: '1 / -1' },
              { key: 'phone',    label: 'Phone Number', placeholder: '+1 234 567 8900'  },
              { key: 'street',   label: 'Street Address', placeholder: '123 Main St',   col: '1 / -1' },
              { key: 'city',     label: 'City',          placeholder: 'New York'         },
              { key: 'state',    label: 'State / Province', placeholder: 'NY'            },
              { key: 'zip',      label: 'ZIP / Postal Code', placeholder: '10001'        },
              { key: 'country',  label: 'Country',       placeholder: 'United States',   col: '1 / -1' },
            ].map(field => (
              <div key={field.key} style={{ gridColumn: field.col || 'auto' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </label>
                {editAddr ? (
                  <input
                    value={address[field.key]}
                    onChange={e => setAddress({ ...address, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.6rem', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', fontSize: '0.9rem', color: address[field.key] ? 'white' : '#475569', fontStyle: address[field.key] ? 'normal' : 'italic' }}>
                    {address[field.key] || `No ${field.label.toLowerCase()} set`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!editAddr && !address.fullName && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245,158,11,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} /> Add your delivery address to speed up checkout.
            </div>
          )}
        </div>
      )}

    </div>
  );
}