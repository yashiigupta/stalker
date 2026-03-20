import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

const Pricing = () => {
  const [annual, setAnnual] = useState(true);

  const features = [
    { name: 'Observer Base', price: 0, desc: 'Community inference pipeline.', 
      items: [
        { name: 'Model Capacity', val: '5 Base Models' },
        { name: 'Latency', val: '1hr Delayed' },
        { name: 'Retraining Priority', val: 'Low (Scheduled)' },
        { name: 'API Access', val: false },
        { name: 'Custom Logic Hooks', val: false }
      ] 
    },
    { name: 'Pro Operator', price: annual ? 89 : 99, desc: 'Real-time production cluster access.', popular: true,
      items: [
        { name: 'Model Capacity', val: '15 Advanced Models' },
        { name: 'Latency', val: 'Real-time (WebSocket)' },
        { name: 'Retraining Priority', val: 'High (Auto-healing)' },
        { name: 'API Access', val: '1,000 req/mo' },
        { name: 'Custom Logic Hooks', val: true }
      ]
    },
    { name: 'Enterprise Node', price: 'Custom', desc: 'Dedicated bare-metal inferencing.', 
      items: [
        { name: 'Model Capacity', val: 'Unlimited / Custom' },
        { name: 'Latency', val: '< 50ms (NYSE Colocated)' },
        { name: 'Retraining Priority', val: 'Dedicated GPU' },
        { name: 'API Access', val: 'Unlimited' },
        { name: 'Custom Logic Hooks', val: true }
      ]
    }
  ];

  return (
    <div className="page-wrap container" style={{ paddingBottom: '120px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '4rem' }}>
        <h1 className="h1-hero" style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', marginBottom: '1.5rem' }}>Scale your intelligence.</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          Select the compute tier that aligns with your trading frequency and model complexity requirements. Cancel anytime.
        </p>
        
        {/* Toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '999px', padding: '6px' }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '0.6rem 2rem', borderRadius: '999px', border: 'none', background: !annual ? 'var(--text-primary)' : 'transparent', color: !annual ? '#000' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>
            Monthly
          </button>
          <button onClick={() => setAnnual(true)} style={{ padding: '0.6rem 2rem', borderRadius: '999px', border: 'none', background: annual ? 'var(--text-primary)' : 'transparent', color: annual ? '#000' : 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>
            Annually <span style={{ color: annual ? 'var(--accent-primary)' : 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600, marginLeft: '6px' }}>-10%</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {features.map((tier, i) => (
          <div key={i} className={`s-card ${tier.popular ? '' : 's-card-hoverable'}`} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', borderColor: tier.popular ? 'var(--accent-glow)' : '', boxShadow: tier.popular ? 'var(--shadow-glow)' : '' }}>
            
            {tier.popular && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: '#fff', padding: '4px 16px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RECOMMENDED</div>}

            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{tier.name}</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '2rem', minHeight: '40px' }}>{tier.desc}</p>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '2rem' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
              </span>
              {typeof tier.price === 'number' && <span className="text-muted" style={{ paddingBottom: '8px' }}>/mo</span>}
            </div>
            
            <button className={`s-btn ${tier.popular ? 's-btn-primary' : 's-btn-secondary'}`} style={{ width: '100%', marginBottom: '2rem', padding: '0.8rem' }}>
               {typeof tier.price === 'number' ? 'Get Started' : 'Contact Sales'}
            </button>

            <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)', marginBottom: '2rem' }}></div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>CORE CAPABILITIES</div>
              {tier.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.name} <HelpCircle size={12} color="var(--border-focus)" />
                  </span>
                  <span>
                    {typeof item.val === 'boolean' ? (
                      item.val ? <CheckCircle2 size={16} color="var(--accent-success)" /> : <XCircle size={16} color="var(--text-tertiary)" />
                    ) : (
                      <span style={{ fontWeight: 500 }}>{item.val}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default Pricing;
