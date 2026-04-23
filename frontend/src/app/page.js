"use client";
import { useAppContext } from "@/context/AppContext";
import { cartAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";

export default function Home() {
  const { products, loading, user, cart, refreshCart } = useAppContext();
  const router = useRouter();
  const [adding, setAdding] = useState(null);

  const handleUpdateCart = async (product, qtyChange) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setAdding(product._id);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: qtyChange,
        imageUrl: product.imageUrl
      });
      await refreshCart();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(null);
    }
  };

  if (loading) return <div className="text-center py-8">Loading products...</div>;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Discover Premium Tech
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Elevate your setup with our curated selection of high-end gear.</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center glass py-8">
          <p>No products available. Admins can seed the database.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {products.map(product => {
            const cartItem = user ? cart?.items?.find(item => item.productId === product._id) : null;
            const currentQty = cartItem ? cartItem.quantity : 0;

            return (
              <div key={product._id} className="glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{product.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>{product.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${parseFloat(product.price).toFixed(2)}</span>
                    
                    {currentQty > 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        padding: '6px 12px', 
                        borderRadius: '20px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <button 
                          onClick={() => handleUpdateCart(product, -1)}
                          disabled={adding === product._id}
                          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>
                          {adding === product._id ? '...' : currentQty}
                        </span>
                        <button 
                          onClick={() => handleUpdateCart(product, 1)}
                          disabled={adding === product._id || product.stock <= currentQty}
                          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn-primary" 
                        onClick={() => handleUpdateCart(product, 1)}
                        disabled={adding === product._id || product.stock <= 0}
                      >
                        {adding === product._id ? 'Adding...' : (
                          <>
                            <ShoppingCart size={16} />
                            {product.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
