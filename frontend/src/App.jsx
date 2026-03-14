import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, ShieldCheck, Zap, Layers, Target, RefreshCw, BarChart3, Wifi, WifiOff, Loader2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:5001/api';
const POLL_INTERVAL = 10000;

const FREQ_LABELS = { minute: '1-Minute', daily: 'Daily', weekly: 'Weekly' };
const FREQ_ORDER = ['minute', 'daily', 'weekly'];

const App = () => {
  const [models, setModels] = useState([]);
  const [trainingLog, setTrainingLog] = useState({ results: [] });
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [selectedModel, setSelectedModel] = useState('M01');
  const [activeFreq, setActiveFreq] = useState('minute');
  const [predictions, setPredictions] = useState([]);
  const [livePrediction, setLivePrediction] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick the clock every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      const data = await res.json();
      setModels(data);
      setConnected(true);
    } catch { setConnected(false); }
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/predictions/${selectedModel}`);
      const data = await res.json();
      if (Array.isArray(data)) setPredictions(data);
      setConnected(true);
    } catch { setConnected(false); }
  }, [selectedModel]);

  // Fetch live prediction every 60 seconds
  const fetchLivePrediction = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/live-prediction/${selectedModel}`);
      const data = await res.json();
      if (data.model_id) setLivePrediction(data);
      setConnected(true);
    } catch { setConnected(false); }
  }, [selectedModel]);

  const fetchStatus = useCallback(async () => {
    try {
      const [logRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/training-log`),
        fetch(`${API_BASE}/status`),
      ]);
      const log = await logRes.json();
      const status = await statusRes.json();
      if (log.results) setTrainingLog(log);
      setPipelineStatus(status);
      setConnected(true);
    } catch { setConnected(false); }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  // Live prediction: fetch immediately + every 60s
  useEffect(() => {
    fetchLivePrediction();
    const interval = setInterval(fetchLivePrediction, 60000);
    return () => clearInterval(interval);
  }, [fetchLivePrediction]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleSync = async () => {
    setSyncing(true);
    try { await fetch(`${API_BASE}/sync`, { method: 'POST' }); } catch {}
    const check = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const s = await res.json();
        setPipelineStatus(s);
        if (!s.is_running) {
          clearInterval(check);
          setSyncing(false);
          fetchPredictions();
          fetchLivePrediction();
          fetchStatus();
        }
      } catch {}
    }, 3000);
  };

  const currentConfig = models.find(m => m.id === selectedModel) || {};
  const filteredModels = models.filter(m => m.freq === activeFreq);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="logo">STALKER v2.0 | AUTONOMOUS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {connected ? (
            <><Wifi size={14} color="var(--accent-green)" /><span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>LIVE</span></>
          ) : (
            <><WifiOff size={14} color="var(--accent-red)" /><span style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>OFFLINE</span></>
          )}
          <button onClick={handleSync} disabled={syncing} style={{
            padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
            border: '1px solid var(--accent-blue)', cursor: syncing ? 'not-allowed' : 'pointer',
            background: syncing ? 'rgba(0,210,255,0.2)' : 'transparent',
            color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            {syncing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </header>

      <div className="grid-layout">
        {/* ===== LIVE PREDICTION HERO ===== */}
        <motion.div
          className="card hero-card"
          style={{
            background: 'linear-gradient(135deg, rgba(0,210,255,0.05) 0%, rgba(0,0,0,0) 60%)',
            border: '1px solid rgba(0,210,255,0.15)',
            padding: '1.5rem',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Clock size={18} color="var(--accent-blue)" />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE PREDICTION</span>
                <div className="live-indicator" style={{ marginLeft: '0.5rem' }}></div>
              </div>

              {livePrediction ? (
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PREDICTION GENERATED AT</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
                      {livePrediction.timestamp}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>FORECASTING FOR</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
                      {livePrediction.prediction_for}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>SIGNAL</div>
                    <div style={{
                      fontSize: '1.5rem', fontWeight: 800,
                      color: livePrediction.signal === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {livePrediction.signal}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PRICE NOW</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>${livePrediction.current_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PREDICTED</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-blue)' }}>${livePrediction.predicted_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ALPHA</div>
                    <div style={{
                      fontSize: '1.3rem', fontWeight: 700,
                      color: livePrediction.delta_pct > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>{livePrediction.delta_pct > 0 ? '+' : ''}{livePrediction.delta_pct}%</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>Connecting to backend...</div>
              )}
            </div>

            {/* Live ticking clock */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>WALL CLOCK (IST)</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', letterSpacing: '0.05em' }}>
                {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--accent-blue)', marginTop: '0.25rem' }}>
                Next refresh in {60 - currentTime.getSeconds()}s
              </div>
            </div>
          </div>
        </motion.div>

        {/* Frequency Tabs */}
        <div className="card hero-card" style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem', alignItems: 'center' }}>
          {FREQ_ORDER.map(freq => (
            <button key={freq} onClick={() => {
              setActiveFreq(freq);
              const first = models.find(m => m.freq === freq);
              if (first) setSelectedModel(first.id);
            }} style={{
              padding: '0.4rem 1.2rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
              border: activeFreq === freq ? '1px solid var(--accent-blue)' : '1px solid #333',
              background: activeFreq === freq ? 'rgba(0,210,255,0.1)' : 'transparent',
              color: activeFreq === freq ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
              {FREQ_LABELS[freq]}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <div>Auto-retrain: {pipelineStatus.schedule || 'Every 1h'}</div>
            <div>Last: {pipelineStatus.last_train ? new Date(pipelineStatus.last_train).toLocaleTimeString() : 'Pending...'}</div>
          </div>
        </div>

        {/* Model Cards */}
        <div className="card hero-card" style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', padding: '0.75rem' }}>
          {filteredModels.map(m => {
            const result = trainingLog.results?.find(r => r.id === m.id);
            return (
              <motion.div key={m.id} onClick={() => setSelectedModel(m.id)} whileHover={{ scale: 1.03 }}
                style={{
                  minWidth: '120px', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer',
                  border: selectedModel === m.id ? '1px solid var(--accent-blue)' : '1px solid #333',
                  background: selectedModel === m.id ? 'rgba(0,210,255,0.08)' : '#1a1a20',
                }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{m.id}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.ticker}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-blue)' }}>t+{m.horizon} | {m.engine}</div>
                {result && <div style={{ fontSize: '0.6rem', color: 'var(--accent-green)', marginTop: '0.15rem' }}>RMSE: {result.rmse?.toFixed(4)}</div>}
              </motion.div>
            );
          })}
        </div>

        {/* Dual-Line Chart */}
        <motion.div className="card chart-card" key={`chart-${selectedModel}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="h2">{currentConfig.ticker} | {FREQ_LABELS[currentConfig.freq]} | t+{currentConfig.horizon}</div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip contentStyle={{ background: '#141419', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} />
                <Line name="Market (Real)" type="monotone" dataKey="real" stroke="#fff" strokeWidth={2} dot={false} animationDuration={800} />
                <Line name="Model (Predicted)" type="monotone" dataKey="predicted" stroke="#00d2ff" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bottom Panels */}
        <div className="card log-card">
          <div className="h2"><Activity size={16} /> Pipeline</div>
          {pipelineStatus.is_running ? (
            <div className="regime-alert" style={{ background: 'rgba(255,165,0,0.1)', borderColor: 'rgba(255,165,0,0.2)', color: '#ffb84d' }}>
              <Loader2 size={16} className="spin" /><span>Retraining...</span>
            </div>
          ) : (
            <div className="regime-alert" style={{ background: 'rgba(0,255,170,0.1)', borderColor: 'rgba(0,255,170,0.2)', color: 'var(--accent-green)' }}>
              <ShieldCheck size={16} /><span>{pipelineStatus.models_trained || 15} converged</span>
            </div>
          )}
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><BarChart3 size={16} /> RMSE</div>
          <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {trainingLog.results?.map((r, i) => (
              <div key={i} className="signal-log-item">
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{r.id}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>{r.rmse ? r.rmse.toFixed(4) : 'META'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><Layers size={16} /> Inventory</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
            {models.map(m => (
              <div key={m.id} onClick={() => { setSelectedModel(m.id); setActiveFreq(m.freq); }}
                style={{
                  padding: '0.15rem 0.4rem', borderRadius: '0.2rem', fontSize: '0.6rem', cursor: 'pointer',
                  color: selectedModel === m.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: `1px solid ${selectedModel === m.id ? 'var(--accent-blue)' : '#333'}`,
                }}>
                {m.id}: {m.ticker}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
