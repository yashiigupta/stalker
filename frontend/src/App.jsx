import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, ShieldCheck, Layers, Target, RefreshCw, BarChart3, Wifi, WifiOff, Loader2, Clock, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:5001/api';

const FREQ_LABELS = { minute: '1-Minute', daily: 'Daily', weekly: 'Weekly' };
const FREQ_ORDER = ['minute', 'daily', 'weekly'];

const App = () => {
  const [models, setModels] = useState([]);
  const [trainingLog, setTrainingLog] = useState({ results: [] });
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [selectedModel, setSelectedModel] = useState('M01');
  const [activeFreq, setActiveFreq] = useState('minute');
  const [liveHistory, setLiveHistory] = useState([]);
  const [livePrediction, setLivePrediction] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [retrainingAll, setRetrainingAll] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick clock every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      setModels(await res.json());
      setConnected(true);
    } catch { setConnected(false); }
  }, []);

  // Fetch the MOVING graph data (rolling prediction history)
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/prediction-history/${selectedModel}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setLiveHistory(data);
      setConnected(true);
    } catch { setConnected(false); }
  }, [selectedModel]);

  // Fetch live prediction for the hero
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
      setTrainingLog(await logRes.json());
      setPipelineStatus(await statusRes.json());
      setConnected(true);
    } catch { setConnected(false); }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  // Poll rolling history every 5 seconds (graph moves!)
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Poll live prediction every 30 seconds
  useEffect(() => {
    fetchLivePrediction();
    const interval = setInterval(fetchLivePrediction, 30000);
    return () => clearInterval(interval);
  }, [fetchLivePrediction]);

  // Poll status every 10s
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Sync button (fast: 5 best models)
  const handleSync = async () => {
    setSyncing(true);
    try { await fetch(`${API_BASE}/sync`, { method: 'POST' }); } catch {}
    const check = setInterval(async () => {
      try {
        const s = await (await fetch(`${API_BASE}/status`)).json();
        setPipelineStatus(s);
        if (!s.is_running) { clearInterval(check); setSyncing(false); fetchHistory(); fetchLivePrediction(); fetchStatus(); }
      } catch {}
    }, 2000);
  };

  // Retrain ALL button (full 15 models)
  const handleRetrainAll = async () => {
    setRetrainingAll(true);
    try { await fetch(`${API_BASE}/retrain-all`, { method: 'POST' }); } catch {}
    const check = setInterval(async () => {
      try {
        const s = await (await fetch(`${API_BASE}/status`)).json();
        setPipelineStatus(s);
        if (!s.is_running) { clearInterval(check); setRetrainingAll(false); fetchHistory(); fetchLivePrediction(); fetchStatus(); }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {connected ? (
            <><Wifi size={14} color="var(--accent-green)" /><span style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>LIVE</span></>
          ) : (
            <><WifiOff size={14} color="var(--accent-red)" /><span style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>OFFLINE</span></>
          )}
          <button onClick={handleSync} disabled={syncing || retrainingAll} style={{
            padding: '0.35rem 0.8rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 600,
            border: '1px solid var(--accent-green)', cursor: syncing ? 'not-allowed' : 'pointer',
            background: syncing ? 'rgba(0,255,170,0.15)' : 'transparent',
            color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            {syncing ? <Loader2 size={12} className="spin" /> : <Zap size={12} />}
            {syncing ? 'Syncing...' : 'Quick Sync'}
          </button>
          <button onClick={handleRetrainAll} disabled={syncing || retrainingAll} style={{
            padding: '0.35rem 0.8rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 600,
            border: '1px solid var(--accent-blue)', cursor: retrainingAll ? 'not-allowed' : 'pointer',
            background: retrainingAll ? 'rgba(0,210,255,0.15)' : 'transparent',
            color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            {retrainingAll ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
            {retrainingAll ? 'Training 15...' : 'Retrain All'}
          </button>
        </div>
      </header>

      <div className="grid-layout">
        {/* LIVE PREDICTION HERO */}
        <motion.div className="card hero-card" style={{
          background: 'linear-gradient(135deg, rgba(0,210,255,0.05) 0%, rgba(0,0,0,0) 60%)',
          border: '1px solid rgba(0,210,255,0.15)', padding: '1.25rem',
        }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Clock size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE PREDICTION</span>
                <div className="live-indicator" style={{ marginLeft: '0.3rem' }}></div>
              </div>
              {livePrediction ? (
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>GENERATED AT</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'monospace' }}>{livePrediction.timestamp}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>FORECASTING FOR</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{livePrediction.prediction_for}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>SIGNAL</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: livePrediction.signal === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{livePrediction.signal}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>NOW</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>${livePrediction.current_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>PREDICTED</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>${livePrediction.predicted_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>ALPHA</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: livePrediction.delta_pct > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {livePrediction.delta_pct > 0 ? '+' : ''}{livePrediction.delta_pct}%
                    </div>
                  </div>
                </div>
              ) : <div style={{ color: 'var(--text-secondary)' }}>Connecting...</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>WALL CLOCK (IST)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Freq Tabs */}
        <div className="card hero-card" style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 1.25rem', alignItems: 'center' }}>
          {FREQ_ORDER.map(freq => (
            <button key={freq} onClick={() => { setActiveFreq(freq); const f = models.find(m => m.freq === freq); if(f) setSelectedModel(f.id); }}
              style={{ padding: '0.35rem 1rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 600, border: activeFreq === freq ? '1px solid var(--accent-blue)' : '1px solid #333', background: activeFreq === freq ? 'rgba(0,210,255,0.1)' : 'transparent', color: activeFreq === freq ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer' }}>
              {FREQ_LABELS[freq]}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <div>{pipelineStatus.mode === 'fast' ? 'Fast mode (5 models)' : 'Full mode (15 models)'}</div>
            <div>Last: {pipelineStatus.last_train ? new Date(pipelineStatus.last_train).toLocaleTimeString() : '---'}</div>
          </div>
        </div>

        {/* Model Cards */}
        <div className="card hero-card" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.6rem' }}>
          {filteredModels.map(m => {
            const result = trainingLog.results?.find(r => r.id === m.id);
            return (
              <motion.div key={m.id} onClick={() => setSelectedModel(m.id)} whileHover={{ scale: 1.03 }}
                style={{ minWidth: '110px', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', border: selectedModel === m.id ? '1px solid var(--accent-blue)' : '1px solid #333', background: selectedModel === m.id ? 'rgba(0,210,255,0.08)' : '#1a1a20' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{m.id}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.ticker}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--accent-blue)' }}>t+{m.horizon} | {m.engine}</div>
                {result && <div style={{ fontSize: '0.55rem', color: 'var(--accent-green)', marginTop: '0.1rem' }}>RMSE: {result.rmse?.toFixed(4)}</div>}
              </motion.div>
            );
          })}
        </div>

        {/* MOVING CHART: Uses prediction-history (grows over time!) */}
        <motion.div className="card chart-card" key={`chart-${selectedModel}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="h2">{currentConfig.ticker} | {FREQ_LABELS[currentConfig.freq]} | t+{currentConfig.horizon}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-green)' }}>{liveHistory.length} predictions logged</div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveHistory}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#666' }} interval="preserveStartEnd" />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip contentStyle={{ background: '#141419', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={30} />
                <Line name="Market (Real)" type="monotone" dataKey="real" stroke="#fff" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line name="Model (Predicted)" type="monotone" dataKey="predicted" stroke="#00d2ff" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bottom panels */}
        <div className="card log-card">
          <div className="h2"><Activity size={14} /> Pipeline</div>
          {pipelineStatus.is_running ? (
            <div className="regime-alert" style={{ background: 'rgba(255,165,0,0.1)', borderColor: 'rgba(255,165,0,0.2)', color: '#ffb84d' }}>
              <Loader2 size={14} className="spin" /><span>Retraining ({pipelineStatus.mode})...</span>
            </div>
          ) : (
            <div className="regime-alert" style={{ background: 'rgba(0,255,170,0.1)', borderColor: 'rgba(0,255,170,0.2)', color: 'var(--accent-green)' }}>
              <ShieldCheck size={14} /><span>{pipelineStatus.models_trained || 5} converged</span>
            </div>
          )}
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><BarChart3 size={14} /> RMSE</div>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {trainingLog.results?.map((r, i) => (
              <div key={i} className="signal-log-item">
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{r.id}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>{r.rmse ? r.rmse.toFixed(4) : 'META'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><Layers size={14} /> Inventory</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
            {models.map(m => (
              <div key={m.id} onClick={() => { setSelectedModel(m.id); setActiveFreq(m.freq); }}
                style={{ padding: '0.15rem 0.35rem', borderRadius: '0.2rem', fontSize: '0.55rem', cursor: 'pointer', color: selectedModel === m.id ? 'var(--accent-blue)' : 'var(--text-secondary)', border: `1px solid ${selectedModel === m.id ? 'var(--accent-blue)' : '#333'}` }}>
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
