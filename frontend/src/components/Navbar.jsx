import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Documentation', path: '/about' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
      display: 'flex', alignItems: 'center', zIndex: 100,
      background: scrolled ? 'rgba(6, 6, 8, 0.8)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
      transition: 'all 0.2s ease'
    }}>
      <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid #000', borderRadius: '50%' }}></div>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Stalker</span>
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {links.map(l => {
              const active = location.pathname === l.path;
              return (
                <Link key={l.name} to={l.path} style={{ 
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                  color: active ? '#fff' : 'var(--text-secondary)', transition: 'color 0.2s'
                }}>
                  {l.name}
                </Link>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/contact" style={{ textDecoration: 'none', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Support</Link>
          <Link to="/dashboard" className="s-btn s-btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}>Platform</Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
