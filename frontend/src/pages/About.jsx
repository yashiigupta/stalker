import React from 'react';
import { ShieldCheck, Cpu, Network } from 'lucide-react';

const About = () => {
  return (
    <div className="page-wrap container" style={{ paddingBottom: '120px' }}>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem' }}>
        
        <div className="s-badge s-badge-primary mb-8">
          <ShieldCheck size={14} /> <span>Enterprise Intelligence</span>
        </div>
        
        <h1 className="h1-hero" style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', marginBottom: '2.5rem', textAlign: 'left' }}>
          Redefining autonomous inference for sequential market data.
        </h1>
        
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
          <p>
            Stalker is not just a dashboard; it is a distributed, self-healing pipeline designed explicitly for quantitative research and live trading operations. By marrying traditional Vector Autoregression with state-of-the-art LightGBM trees, we bypass the latency inherent in deep learning architectures while retaining superior predictive capacity over non-linear market shocks.
          </p>
          <p>
            Every 30 seconds, the engine autonomously fetches the latest market ticks, generates feature spaces, evaluates prediction drift, and—if threshold violations occur—spawns an asynchronous retraining thread.
          </p>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)', marginBottom: '4rem' }}></div>

        <h2 className="h2-section" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Core Architecture</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
           <div className="s-card s-card-hoverable" style={{ padding: '2rem' }}>
             <Cpu size={24} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Continuous Assessment</h3>
             <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Models are constantly polled against actual incoming real-world ticks. The MSE state acts as an invariant truth token.</p>
           </div>
           
           <div className="s-card s-card-hoverable" style={{ padding: '2rem' }}>
             <Network size={24} color="var(--accent-success)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Flask / Daemon Bridging</h3>
             <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>APScheduler manages the Python backend loops fully disconnected from the WebSocket client threads for absolute zero blocking.</p>
           </div>
        </div>

      </div>

    </div>
  );
};

export default About;
