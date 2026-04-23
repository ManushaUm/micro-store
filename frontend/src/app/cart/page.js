"use client";
import { useAppContext } from "@/context/AppContext";
import { cartAPI, checkoutAPI } from "@/lib/api";
import { Trash2, CreditCard, ShoppingBag, ArrowLeft, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Cart() {
  const { cart, refreshCart, user } = useAppContext();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);
  const [removing, setRemoving] = useState(null);

  if (!user) return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass" style={{ padding: '3rem' }}>
        <ShoppingBag size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.75rem' }}>Sign in to view your cart</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>You need to be logged in to access your cart.</p>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push('/login')}>
          Login
        </button>
      </div>
    </div>
  );

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await cartAPI.removeFromCart(productId);
      await refreshCart();
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const itemCount = cart?.items?.reduce((a, i) => a + i.quantity, 0) || 0;
  const shipping = cart?.total >= 100 ? 0 : 9.99;
  const grandTotal = ((cart?.total || 0) + shipping).toFixed(2);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Shopping Cart</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {!cart?.items || cart.items.length === 0 ? (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
          <ShoppingBag size={64} style={{ color: '#94a3b8', marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '0.75rem' }}>Your cart is empty</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Looks like you haven&apos;t added anything yet.</p>
          <button className="btn-primary" style={{ padding: '0.875rem 2rem' }} onClick={() => router.push('/')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Items list */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            {cart.items.map((item, idx) => (
              <div key={item.productId} style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem',
                borderBottom: idx < cart.items.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none'
              }}>
                {/* Image */}
                <img src={item.imageUrl} alt={item.name}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.75rem', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => router.push(`/products/${item.productId}`)} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px', cursor: 'pointer' }}
                    onClick={() => router.push(`/products/${item.productId}`)}>
                    {item.name}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                    ${parseFloat(item.price).toFixed(2)} each
                  </p>
                </div>

                {/* Quantity display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
                  <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem' }}>
                    {item.quantity}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: '6px' }}>qty</span>
                </div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--primary)' }}>
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  disabled={removing === item.productId}
                  style={{ color: removing === item.productId ? '#94a3b8' : 'var(--error)', padding: '6px', borderRadius: '0.4rem', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', flexShrink: 0, display: 'flex' }}
                  title="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Order Summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Subtotal ({itemCount} items)</span>
                  <span>${(cart.total || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? '#10b981' : 'inherit' }}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: '#f59e0b' }}>
                    Add ${(100 - cart.total).toFixed(2)} more for free shipping!
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem' }}>Total</span>
                <span style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--primary)' }}>${grandTotal}</span>
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.95rem' }}
                onClick={handleCheckout} disabled={checkingOut}>
                <CreditCard size={18} />
                {checkingOut ? 'Processing...' : 'Checkout & Pay'}
              </button>

              <button className="btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '0.625rem', fontSize: '0.85rem', marginTop: '0.75rem' }}
                onClick={() => router.push('/')}>
                Continue Shopping
              </button>
            </div>

            <div className="glass" style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>🔒</span> Secure 256-bit SSL checkout
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>↩</span> 30-day free returns
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}