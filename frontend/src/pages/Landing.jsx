import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Cpu, ShieldAlert, CheckCircle2, Server, Command, Terminal } from 'lucide-react';

const Landing = () => {
  return (
    <div className="page-wrap container" style={{ paddingBottom: '120px' }}>
      
      {/* Refined Hero */}
      <section style={{ textAlign: 'center', paddingTop: '6rem', paddingBottom: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="s-badge s-badge-primary mb-8" style={{ padding: '4px 12px' }}>
          <Activity size={14} /> <span>System v2.4 Operational</span>
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h1-hero" style={{ maxWidth: '900px', margin: '0 auto 1.5rem auto' }}>
          The Intelligence Layer for Algorithmic Execution
        </motion.h1>
        
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 2.5rem auto' }}>
          Deploy self-healing VAR and LightGBM models instantly. Automate feature engineering and inference securely from an enterprise-grade terminal.
        </motion.p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/dashboard" className="s-btn s-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Open Platform <ArrowRight size={16} />
          </Link>
          <Link to="/story" className="s-btn s-btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Story of Stalker
          </Link>
          <a href="#features" className="s-btn s-btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
             Documentation
          </a>
        </motion.div>

        {/* Floating Detailed Simulated 3D Element */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} 
          style={{ width: '100%', maxWidth: '1000px', height: '400px', marginTop: '5rem', position: 'relative' }}>
          
          <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2), transparent 70%)', filter: 'blur(40px)', zIndex: -1 }}></div>
          
          <div className="s-card" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Mock Mac-style window header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '8px' }}>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: 'var(--border-focus)'}}></div>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: 'var(--border-focus)'}}></div>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: 'var(--border-focus)'}}></div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono' }}>stalker-production-cluster</div>
            </div>
            {/* Mock Content */}
            <div style={{ padding: '2rem', display: 'flex', gap: '2rem', height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({length: 4}).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <Server size={18} color="var(--text-secondary)"/>
                       <div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>TENSOR_NODE_{i+1}</div>
                         <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>ms-us-east</div>
                       </div>
                     </div>
                     <div className="s-badge s-badge-success"><div className="status-dot" style={{width:6, height:6}}></div> ACTIVE</div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 2, background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={14}/> LIVE INFERENCE TICK: M01 AAPL</div>
                 <div className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', lineHeight: 1.8 }}>
                   {'>'} Model M01_EN v4 successfully loaded.<br/>
                   {'>'} Ingesting socket ws://feed.data... [200 OK]<br/>
                   <span style={{color: '#fff'}}>{'>'} Calculating feature drifts over 60 epochs...</span><br/>
                   {'>'} Drift negligible. Bypassing retrain.<br/>
                   {'>'} Next target slice output: <span style={{color: 'var(--accent-primary)'}}>$192.45 (+0.12%)</span><br/>
                   {'>'} Action generated successfully.<span className="blinking-cursor"></span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid High Detail */}
      <section id="features" style={{ paddingTop: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="h2-section">Built for institutional scale.</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Designed from the ground up for zero-latency operations and extreme reliability.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          <div className="s-card s-card-hoverable" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
               <Cpu size={24} color="var(--text-primary)" />
             </div>
             <div>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Auto-Healing Engine</h3>
               <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Models actively calculate MSE/RMSE on real-time data against their own predictions. If accuracy drops below threshold, the daemon initiates a rolling re-train without blocking the event loop.</p>
             </div>
             <div style={{ marginTop: 'auto', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
                 <span className="text-muted">Drift Tolerance</span><span className="text-mono" style={{color: 'var(--accent-danger)'}}>1.05e-3</span>
               </div>
               <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                 <div style={{ width: '75%', height: '100%', background: 'var(--accent-primary)' }}></div>
               </div>
             </div>
          </div>

          <div className="s-card s-card-hoverable" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
               <Command size={24} color="var(--text-primary)" />
             </div>
             <div>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>VAR + LGBM Stack</h3>
               <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Utilizes Vector Autoregression to capture multivariate linear dependencies, piped into a LightGBM regressor to capture complex, non-linear market shocks.</p>
             </div>
             <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--accent-success)" /> Ridge/Lasso Regularization</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--accent-success)" /> Tree Depth Optimization</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><CheckCircle2 size={14} color="var(--accent-success)" /> Low memory footprint</div>
             </div>
          </div>

          <div className="s-card s-card-hoverable" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
               <ShieldAlert size={24} color="var(--text-primary)" />
             </div>
             <div>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bank-grade Security</h3>
               <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>APIs are secured with state-of-the-art tokenization. Strategy parameters and hyperparameter weights remain isolated per client container.</p>
             </div>
             <div style={{ marginTop: 'auto', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 }}>VPC Peering Enabled</span>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}></div>
             </div>
          </div>
          
        </div>
      </section>

    </div>
  );
};

export default Landing;
