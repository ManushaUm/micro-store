// import Link from 'next/link';
// import { Package, Github, Mail, Shield, Truck, RefreshCw } from 'lucide-react';

// export default function Footer() {
//   return (
//     <footer style={{
//       marginTop: '4rem',
//       borderTop: '1px solid rgba(255,255,255,0.07)',
//       background: 'rgba(15,23,42,0.8)',
//       backdropFilter: 'blur(12px)',
//     }}>
//       <div className="container" style={{ padding: '3rem 1.5rem 1.5rem' }}>

//         {/* Top row */}
//         <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>

//           {/* Brand col */}
//           <div>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
//               <Package style={{ color: 'var(--primary)' }} size={22} />
//               <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>MicroShop</span>
//             </div>
//             <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '280px', margin: '0 0 1.25rem' }}>
//               A cloud-native e-commerce platform built with microservices architecture. Fast, scalable, and secure.
//             </p>
//             <div style={{ display: 'flex', gap: '0.75rem' }}>
//               <a href="https://github.com/ManushaUm/micro-store" target="_blank" rel="noreferrer"
//                 style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
//                 <Github size={16} />
//               </a>
//               <a href="mailto:support@microshop.dev"
//                 style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
//                 <Mail size={16} />
//               </a>
//             </div>
//           </div>

//           {/* Shop col */}
//           <div>
//             <h4 style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Shop</h4>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
//               {[
//                 { label: 'All Products', href: '/#products' },
//                 { label: 'Audio',        href: '/#products' },
//                 { label: 'Displays',     href: '/#products' },
//                 { label: 'Accessories',  href: '/#products' },
//               ].map(l => (
//                 <Link key={l.label} href={l.href} style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
//                   {l.label}
//                 </Link>
//               ))}
//             </div>
//           </div>

//           {/* Account col */}
//           <div>
//             <h4 style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Account</h4>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
//               {[
//                 { label: 'Login',     href: '/login' },
//                 { label: 'Register',  href: '/register' },
//                 { label: 'My Orders', href: '/profile' },
//                 { label: 'Cart',      href: '/cart' },
//               ].map(l => (
//                 <Link key={l.label} href={l.href} style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
//                   {l.label}
//                 </Link>
//               ))}
//             </div>
//           </div>

//           {/* Policies col */}
//           <div>
//             <h4 style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Policies</h4>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
//               {['Privacy Policy', 'Terms of Service', 'Return Policy', 'Cookie Policy'].map(l => (
//                 <span key={l} style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{l}</span>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Trust strip */}
//         <div style={{ display: 'flex', gap: '2rem', padding: '1.25rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
//           {[
//             { icon: <Shield size={15} />, text: 'SSL Secured',             color: '#10b981' },
//             { icon: <Truck size={15} />,  text: 'Free Shipping over $100', color: '#3b82f6' },
//             { icon: <RefreshCw size={15} />, text: '30-Day Returns',       color: '#f59e0b' },
//           ].map((item, i) => (
//             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
//               <span style={{ color: item.color }}>{item.icon}</span>
//               {item.text}
//             </div>
//           ))}
//         </div>

//         {/* Bottom bar */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
//           <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
//             © 2025 MicroShop. Built with microservices architecture for EC7205 Cloud Computing.
//           </p>
//           <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
//             Auth · Catalog · Cart · Checkout services
//           </p>
//         </div>

//       </div>
//     </footer>
//   );
// }