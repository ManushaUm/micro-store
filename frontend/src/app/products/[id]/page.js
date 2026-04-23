"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { catalogAPI, cartAPI } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import { ArrowLeft, Plus, Minus, ShoppingCart, Star, Shield, Truck, RefreshCw } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, refreshCart } = useAppContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    catalogAPI.getProduct(id)
      .then(setProduct)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { router.push('/login'); return; }
    setAdding(true);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl
      });
      await refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!product) return null;

  const subtotal = (product.price * quantity).toFixed(2);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* Back button */}
      <button onClick={() => router.back()} className="btn-outline"
        style={{ marginBottom: '1.5rem', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

          {/* Left — image */}
          <div style={{ position: 'relative' }}>
            <img src={product.imageUrl} alt={product.name}
              style={{ width: '100%', height: '480px', objectFit: 'cover' }} />
            {product.stock <= 10 && product.stock > 0 && (
              <span style={{ position: 'absolute', top: '16px', left: '16px', background: '#f59e0b', color: '#000', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '999px' }}>
                Only {product.stock} left!
              </span>
            )}
            {product.stock === 0 && (
              <span style={{ position: 'absolute', top: '16px', left: '16px', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '999px' }}>
                Out of Stock
              </span>
            )}
          </div>

          {/* Right — details */}
          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Stars */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: '8px' }}>4.8 (128 reviews)</span>
            </div>

            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem', lineHeight: 1.2 }}>{product.name}</h1>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>{product.description}</p>
            </div>

            {/* Price */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem 0' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--primary)' }}>
                ${parseFloat(product.price).toFixed(2)}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>
                {product.stock > 0 ? `${product.stock} units in stock` : 'Currently unavailable'}
              </div>
            </div>

            {/* Quantity selector */}
            {product.stock > 0 && (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem 0 0 0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={16} />
                  </button>
                  <div style={{ width: '56px', height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1rem' }}>
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0.5rem 0.5rem 0', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} />
                  </button>
                  <span style={{ marginLeft: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                    Subtotal: <strong style={{ color: 'white' }}>${subtotal}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Add to cart button */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                onClick={handleAddToCart}
                disabled={adding || product.stock <= 0}
                style={{ flex: 1, padding: '0.875rem', fontSize: '1rem', justifyContent: 'center', background: added ? 'var(--success)' : '' }}>
                {added ? '✓ Added to Cart!' : adding ? 'Adding...' : <><ShoppingCart size={18} /> Add to Cart</>}
              </button>
              <button className="btn-outline" onClick={() => router.push('/cart')}
                style={{ padding: '0.875rem 1.25rem' }}>
                <ShoppingCart size={18} />
              </button>
            </div>

            {/* Trust icons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { icon: <Shield size={14} />, text: 'Secure payment & buyer protection' },
                { icon: <Truck size={14} />, text: 'Free shipping on orders over $100' },
                { icon: <RefreshCw size={14} />, text: '30-day hassle-free returns' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                  <span style={{ color: '#10b981' }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}