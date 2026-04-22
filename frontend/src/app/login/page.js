"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authAPI.login({ email, password });
      login(data.user, data.token);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Welcome Back</h2>
        {error && <p className="text-error text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Sign In</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Don't have an account? <Link href="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
