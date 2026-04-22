"use client";
import Link from 'next/link';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function Navbar() {
  const { user, logout, cart } = useAppContext();

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', position: 'sticky', top: '1rem', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Package style={{ color: 'var(--primary)' }} />
        MicroShop
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart />
          <span>Cart</span>
          {cartItemCount > 0 && (
            <span style={{ position: 'absolute', top: '-8px', left: '-8px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {cartItemCount}
            </span>
          )}
        </Link>
        
        {user ? (
          <>
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User /> Profile
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin" style={{ color: 'var(--primary)' }}>Admin</Link>
            )}
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--error)' }}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="btn-primary">Login</Link>
        )}
      </div>
    </nav>
  );
}
