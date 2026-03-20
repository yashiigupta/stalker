import React from 'react';
import { Mail, MessageSquare, ArrowRight } from 'lucide-react';

const Contact = () => {
  return (
    <div className="page-wrap container" style={{ paddingBottom: '120px' }}>
      
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '4rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="h1-hero" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem' }}>Contact Support</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Reach out to our engineering team for custom integration pipelines or dedicated enterprise nodes.</p>
        </div>
        
        <form className="s-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} onSubmit={e => e.preventDefault()}>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>First Name</label>
              <input type="text" placeholder="John" style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }} onFocus={e => e.target.style.borderColor = 'var(--text-tertiary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Last Name</label>
              <input type="text" placeholder="Doe" style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }} onFocus={e => e.target.style.borderColor = 'var(--text-tertiary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="var(--text-secondary)" /> Email Address</label>
            <input type="email" placeholder="john@company.com" style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }} onFocus={e => e.target.style.borderColor = 'var(--text-tertiary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>We'll never share your email with third-party partners.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={14} color="var(--text-secondary)" /> Message</label>
            <textarea rows="5" placeholder="How can our engineering teams collaborate?" style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--text-tertiary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'} />
          </div>

          <button className="s-btn s-btn-primary" style={{ marginTop: '1rem', padding: '1rem', width: '100%' }}>
            Submit Inquiry <ArrowRight size={16} />
          </button>
          
        </form>
        
      </div>

    </div>
  );
};

export default Contact;
