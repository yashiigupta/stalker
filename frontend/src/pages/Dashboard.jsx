import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, Play, Square, Activity, Database, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';
const FREQ_ORDER = ['minute', 'daily', 'weekly'];

const rHex = () => Math.random().toString(16).slice(2, 8).toUpperCase();

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-focus)', padding: '0.75rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', minWidth: '150px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 500 }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ color: entry.color, fontSize: '0.8rem', fontWeight: 500 }}>{entry.name}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {entry.value ? `$${entry.value.toFixed(2)}` : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [models, setModels] = useState([]);
  const [trainingLog, setTrainingLog] = useState({ results: [] });
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [selectedModel, setSelectedModel] = useState('M01');
  const [activeFreq, setActiveFreq] = useState('minute');
  const [liveHistory, setLiveHistory] = useState([]);
  const [livePrediction, setLivePrediction] = useState(null);
  const [orderStream, setOrderStream] = useState([]);

  const fetchModels = useCallback(async () => {
    try { setModels(await (await fetch(`${API_BASE}/models`)).json()); } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await (await fetch(`${API_BASE}/prediction-history/${selectedModel}`)).json();
      setLiveHistory(data);
      if (Array.isArray(data) && data.length > 0) {
        const currentPrice = data[data.length-1].real || data[data.length-1].predicted || 4000;
        const newOrders = Array.from({ length: 3 }).map(() => ({
          time: new Date().toISOString().substring(11, 19),
          dir: Math.random() > 0.5 ? 'BUY' : 'SELL',
          price: (currentPrice + (Math.random() * 4 - 2)).toFixed(2),
          status: Math.random() > 0.1 ? 'FILLED' : 'PENDING'
        }));
        setOrderStream(prev => [...newOrders, ...prev].slice(0, 10));
      }
    } catch {}
  }, [selectedModel]);

  const fetchLivePrediction = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/live-prediction/${selectedModel}`);
      if (!res.ok) { setLivePrediction(null); return; }
      const data = await res.json();
      if (data.model_id) setLivePrediction(data);
    } catch {}
  }, [selectedModel]);

  const fetchStatus = useCallback(async () => {
    try {
      setTrainingLog(await (await fetch(`${API_BASE}/training-log`)).json());
      setPipelineStatus(await (await fetch(`${API_BASE}/status`)).json());
    } catch {}
  }, []);

  useEffect(() => { fetchModels(); fetchStatus(); }, [fetchModels, fetchStatus]);
  useEffect(() => { fetchHistory(); const intv = setInterval(fetchHistory, 5000); return () => clearInterval(intv); }, [fetchHistory]);
  useEffect(() => { fetchLivePrediction(); const intv = setInterval(fetchLivePrediction, 30000); return () => clearInterval(intv); }, [fetchLivePrediction]);
  useEffect(() => { fetchStatus(); const intv = setInterval(fetchStatus, 10000); return () => clearInterval(intv); }, [fetchStatus]);

  const currentConfig = models.find(m => m.id === selectedModel) || {};
  const isUp = livePrediction?.delta_pct > 0;

  return (
    <div className="page-wrap container" style={{ paddingBottom: '100px', paddingTop: '120px' }}>
      
      {/* Breadcrumbs & Header Actions */}
      <div className="flex-between mb-8" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span>Overview</span> <span style={{color: 'var(--border-subtle)'}}>/</span>
            <span>Production V2</span> <span style={{color: 'var(--border-subtle)'}}>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{currentConfig.ticker || 'Market'} Dashboard</span>
          </div>
          <h1 className="h2-section" style={{ fontSize: '1.5rem', marginBottom: 0 }}>Cluster Activity</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="s-badge" style={{ padding: '6px 14px' }}>
             <Activity size={14} color="var(--accent-primary)" /> {pipelineStatus.models_trained || 5} / 15 CONVERGED
          </div>
          <button 
             className="s-btn s-btn-secondary" 
             style={{ padding: '0.5rem 1rem', opacity: pipelineStatus.is_running ? 0.5 : 1 }} 
             disabled={pipelineStatus.is_running}
             onClick={() => { fetch(`${API_BASE}/retrain-all`, { method: 'POST' }); fetchStatus(); }}
          >
            <RefreshCw size={14} className={pipelineStatus.is_running ? "spin" : ""} /> 
            {pipelineStatus.is_running ? 'Syncing...' : 'Synchronize'}
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '2rem' }}>
        
        {/* Left Sidebar (Models & Config) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="s-card" style={{ padding: '1rem' }}>
             <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={14} /> Pipelines</h3>
             <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '4px', display: 'flex', marginBottom: '1rem' }}>
                {FREQ_ORDER.map(f => (
                  <button key={f} onClick={() => { setActiveFreq(f); const found = models.find(m => m.freq === f); if(found) setSelectedModel(found.id); }}
                    style={{ flex: 1, padding: '6px 0', border: 'none', background: activeFreq === f ? 'var(--border-focus)' : 'transparent', color: activeFreq === f ? '#fff' : 'var(--text-tertiary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               {models.filter(m => m.freq === activeFreq).map(m => (
                 <button key={m.id} onClick={() => setSelectedModel(m.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0.75rem 1rem', background: selectedModel === m.id ? 'var(--border-subtle)' : 'transparent', border: '1px solid transparent', borderColor: selectedModel === m.id ? 'var(--border-focus)' : 'transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedModel === m.id ? 'var(--accent-primary)' : 'var(--border-focus)' }}></div>
                     <span style={{ fontSize: '0.875rem', fontWeight: 500, color: selectedModel === m.id ? '#fff' : 'var(--text-secondary)' }}>{m.ticker}</span>
                   </div>
                   <span className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{m.id}</span>
                 </button>
               ))}
             </div>
          </div>

          <div className="s-card" style={{ padding: '1.25rem' }}>
             <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Metrics Edge</h3>
             {livePrediction ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Target Alpha</div>
                   <div style={{ fontSize: '1.5rem', fontWeight: 600, color: isUp ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                     {isUp ? '+' : ''}{livePrediction.delta_pct}%
                   </div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Trigger Signal</div>
                   <div className={`s-badge ${isUp ? 's-badge-success' : ''}`} style={{ border: !isUp && '1px solid rgba(239, 68, 68, 0.2)', color: !isUp && 'var(--accent-danger)', background: !isUp && 'rgba(239, 68, 68, 0.1)' }}>
                     {livePrediction.signal}
                   </div>
                 </div>
               </div>
             ) : <div className="text-muted" style={{ fontSize: '0.85rem' }}>Awaiting initial stream...</div>}
          </div>

        </div>

        {/* Right Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Chart Header Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="s-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Market Quote</div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                   {livePrediction ? `$${livePrediction.current_price.toFixed(2)}` : 'Syncing...'}
                 </div>
               </div>
               <Activity size={24} color="var(--border-focus)" />
            </div>
            <div className="s-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Inferred Projection</div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)' }}>
                   {livePrediction ? `$${livePrediction.predicted_price.toFixed(2)}` : 'Syncing...'}
                 </div>
               </div>
               <Zap size={24} color="var(--accent-primary)" opacity={0.5} />
            </div>
          </div>

          {/* Main Chart */}
          <div className="s-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Live Prediction Stream</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width: 8, height: 2, background: 'var(--border-focus)'}}></div> Market</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width: 8, height: 2, background: 'var(--accent-primary)'}}></div> Algotrading Vector</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: '1rem', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={{stroke: 'var(--border-subtle)'}} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="real" stroke="var(--border-focus)" strokeWidth={2} fillOpacity={0} isAnimationActive={false} />
                  <Area type="monotone" dataKey="predicted" stroke="var(--accent-primary)" strokeWidth={2} strokeDasharray="4 4" fill="url(#primaryGlow)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Book Table */}
          <div className="s-card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Executing Orders (Mocked Feed)</div>
            </div>
            <table className="s-table text-mono">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Direction</th>
                  <th>Execution Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orderStream.length === 0 ? <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--text-tertiary)'}}>Awaiting stream...</td></tr> : null}
                {orderStream.map((o, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-tertiary)' }}>{o.time}</td>
                    <td style={{ color: o.dir === 'BUY' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{o.dir}</td>
                    <td>${o.price}</td>
                    <td>
                      <span className={`s-badge ${o.status === 'FILLED' ? 's-badge-success' : ''}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
