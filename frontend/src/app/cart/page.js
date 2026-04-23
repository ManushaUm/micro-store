"use client";
import { useAppContext } from "@/context/AppContext";
import { cartAPI, checkoutAPI } from "@/lib/api";
import { Trash2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Cart() {
  const { cart, refreshCart, user } = useAppContext();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  if (!user) {
    return <div className="text-center py-8">Please login to view your cart.</div>;
  }

  const handleRemove = async (productId) => {
    try {
      await cartAPI.removeFromCart(productId);
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Shopping Cart</h1>
      
      {!cart?.items || cart.items.length === 0 ? (
        <div className="glass text-center py-8">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="glass" style={{ padding: '2rem' }}>
          {cart.items.map(item => (
            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={item.imageUrl} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                <div>
                  <h3 style={{ fontWeight: '600' }}>{item.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>${(item.quantity * item.price).toFixed(2)}</span>
                <button onClick={() => handleRemove(item.productId)} style={{ color: 'var(--error)' }} title="Remove item">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Total: ${cart.total.toFixed(2)}</h2>
            <button className="btn-primary" onClick={handleCheckout} disabled={checkingOut}>
              <CreditCard size={18} /> {checkingOut ? 'Processing...' : 'Checkout & Pay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
