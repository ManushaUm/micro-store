"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { checkoutAPI, cartAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { MapPin, CreditCard, Truck, CheckCircle, Package, ArrowLeft } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

function CheckoutForm() {
  const { cart, refreshCart, user } = useAppContext();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [deliveryDetails, setDeliveryDetails] = useState({
    fullName: "",
    address: "",
    city: "",
    zipCode: "",
    phone: "",
  });

  const handleInputChange = (e) => {
    setDeliveryDetails({ ...deliveryDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart?.items?.length) return;

    setLoading(true);

    try {
      // 1. Create order and get clientSecret if stripe
      const response = await checkoutAPI.placeOrder({
        items: cart.items,
        total: cart.total,
        deliveryDetails,
        paymentMethod,
        email: user.email // Dynamically pass the logged-in user's email
      });

      if (paymentMethod === "stripe" && response.clientSecret) {
        // 2. Confirm payment on frontend
        const result = await stripe.confirmCardPayment(response.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: deliveryDetails.fullName,
              phone: deliveryDetails.phone,
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      }

      // 3. Clear cart and redirect
      await cartAPI.clearCart();
      await refreshCart();
      router.push("/order-confirmation");
    } catch (err) {
      console.error(err);
      alert(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => router.push("/")} className="btn-primary">
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <button onClick={() => router.back()} className="back-btn">
        <ArrowLeft size={18} /> Back to Cart
      </button>
      
      <div className="checkout-grid">
        <div className="checkout-main">
          <form onSubmit={handleSubmit} className="glass-card">
            <section className="checkout-section">
              <h2 className="section-title">
                <MapPin size={20} /> Shipping Details
              </h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={deliveryDetails.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={deliveryDetails.address}
                    onChange={handleInputChange}
                    placeholder="123 Street Name"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={deliveryDetails.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={deliveryDetails.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={deliveryDetails.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
            </section>

            <section className="checkout-section mt-8">
              <h2 className="section-title">
                <CreditCard size={20} /> Payment Method
              </h2>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'stripe' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                  />
                  <span className="option-content">
                    <span className="option-icon"><CreditCard size={20} /></span>
                    <span className="option-text">
                      <strong>Credit/Debit Card</strong>
                      <span>Pay securely with Stripe</span>
                    </span>
                  </span>
                </label>
                <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span className="option-content">
                    <span className="option-icon"><Truck size={20} /></span>
                    <span className="option-text">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when you receive the order</span>
                    </span>
                  </span>
                </label>
              </div>

              {paymentMethod === "stripe" && (
                <div className="stripe-element-container">
                  <label>Card Information</label>
                  <div className="card-input-wrapper">
                    <CardElement options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#ffffff',
                          '::placeholder': { color: '#94a3b8' },
                        },
                        invalid: { color: '#ef4444' },
                      },
                    }} />
                  </div>
                </div>
              )}
            </section>

            <button type="submit" className="btn-checkout" disabled={loading}>
              {loading ? "Processing..." : paymentMethod === "stripe" ? "Pay & Place Order" : "Place Order (COD)"}
            </button>
          </form>
        </div>

        <div className="checkout-sidebar">
          <div className="glass-card sticky-sidebar">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-items">
              {cart.items.map((item) => (
                <div key={item.productId} className="summary-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="text-free">FREE</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
            <div className="trust-badge">
              <CheckCircle size={14} className="text-success" />
              <span>Secure checkout processed via ShopSwift</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          margin-bottom: 1.5rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .back-btn:hover {
          color: #ffffff;
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25rem;
          padding: 2rem;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #f1f5f9;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .form-group.full-width {
          grid-column: span 2;
        }
        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }
        .form-group input {
          width: 100%;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          color: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-group input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          outline: none;
        }
        .payment-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .payment-option {
          cursor: pointer;
          display: block;
        }
        .payment-option input {
          display: none;
        }
        .option-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.25rem;
          background: rgba(15, 23, 42, 0.4);
          border: 2px solid transparent;
          border-radius: 1rem;
          transition: all 0.2s;
        }
        .payment-option.active .option-content {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        .option-icon {
          margin-bottom: 0.75rem;
          color: #94a3b8;
        }
        .payment-option.active .option-icon {
          color: #3b82f6;
        }
        .option-text strong {
          display: block;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .option-text span {
          font-size: 0.75rem;
          color: #64748b;
        }
        .stripe-element-container {
          margin-top: 1.5rem;
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-input-wrapper {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1rem;
        }
        .btn-checkout {
          width: 100%;
          margin-top: 2rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-weight: 700;
          font-size: 1.125rem;
          padding: 1.125rem;
          border-radius: 0.875rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-checkout:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
        }
        .btn-checkout:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .summary-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .item-info {
          display: flex;
          flex-direction: column;
        }
        .item-name {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .item-qty {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .item-price {
          font-weight: 600;
        }
        .summary-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 1.25rem 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          color: #94a3b8;
          font-size: 0.9375rem;
        }
        .summary-row.total {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 800;
        }
        .text-free {
          color: #10b981;
          font-weight: 700;
        }
        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
          font-size: 0.75rem;
          color: #64748b;
          justify-content: center;
        }
        .sticky-sidebar {
          position: sticky;
          top: 2rem;
        }
      `}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
