import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, ShieldCheck, Zap, Layers, Target, RefreshCw, BarChart3, Wifi, WifiOff, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:5001/api';
const POLL_INTERVAL = 10000; // 10 seconds

const FREQ_LABELS = { minute: '1-Minute', daily: 'Daily', weekly: 'Weekly' };
const FREQ_ORDER = ['minute', 'daily', 'weekly'];

const App = () => {
  const [models, setModels] = useState([]);
  const [trainingLog, setTrainingLog] = useState({ results: [] });
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [selectedModel, setSelectedModel] = useState('M01');
  const [activeFreq, setActiveFreq] = useState('minute');
  const [predictions, setPredictions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);

  // Fetch model registry
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      const data = await res.json();
      setModels(data);
      setConnected(true);
    } catch { setConnected(false); }
  }, []);

  // Fetch predictions for selected model
  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/predictions/${selectedModel}`);
      const data = await res.json();
      if (Array.isArray(data)) setPredictions(data);
      setConnected(true);
    } catch { setConnected(false); }
  }, [selectedModel]);

  // Fetch training log + pipeline status
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

  // Initial load
  useEffect(() => { fetchModels(); }, [fetchModels]);

  // Poll for fresh predictions every 10s
  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  // Poll status every 15s
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Sync button handler
  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/sync`, { method: 'POST' });
    } catch {}
    // Poll quickly until done
    const check = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const s = await res.json();
        setPipelineStatus(s);
        if (!s.is_running) {
          clearInterval(check);
          setSyncing(false);
          fetchPredictions();
          fetchStatus();
        }
      } catch {}
    }, 3000);
  };

  const currentConfig = models.find(m => m.id === selectedModel) || {};
  const filteredModels = models.filter(m => m.freq === activeFreq);
  const lastReal = predictions.length ? predictions[predictions.length - 1].real : 0;
  const lastPred = predictions.length ? predictions[predictions.length - 1].predicted : 0;
  const delta = lastReal !== 0 ? ((lastPred - lastReal) / lastReal * 100).toFixed(4) : '0';

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
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid var(--accent-blue)', cursor: syncing ? 'not-allowed' : 'pointer',
              background: syncing ? 'rgba(0,210,255,0.2)' : 'transparent',
              color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            {syncing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </header>

      <div className="grid-layout">
        {/* Frequency Tabs + Pipeline Info */}
        <div className="card hero-card" style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', alignItems: 'center' }}>
          {FREQ_ORDER.map(freq => (
            <button key={freq} onClick={() => {
              setActiveFreq(freq);
              const first = models.find(m => m.freq === freq);
              if (first) setSelectedModel(first.id);
            }} style={{
              padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600,
              border: activeFreq === freq ? '1px solid var(--accent-blue)' : '1px solid #333',
              background: activeFreq === freq ? 'rgba(0,210,255,0.1)' : 'transparent',
              color: activeFreq === freq ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}>
              {FREQ_LABELS[freq]}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <div>Auto-retrain: {pipelineStatus.schedule || 'Every 1h'}</div>
            <div>Last: {pipelineStatus.last_train ? new Date(pipelineStatus.last_train).toLocaleTimeString() : 'Pending...'}</div>
          </div>
        </div>

        {/* Model Cards Row */}
        <div className="card hero-card" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '1rem' }}>
          {filteredModels.map(m => {
            const result = trainingLog.results?.find(r => r.id === m.id);
            return (
              <motion.div key={m.id} onClick={() => setSelectedModel(m.id)} whileHover={{ scale: 1.03 }}
                style={{
                  minWidth: '130px', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer',
                  border: selectedModel === m.id ? '1px solid var(--accent-blue)' : '1px solid #333',
                  background: selectedModel === m.id ? 'rgba(0,210,255,0.08)' : '#1a1a20',
                  transition: 'all 0.2s ease',
                }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.id}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{m.ticker}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>t+{m.horizon} | {m.engine}</div>
                {result && <div style={{ fontSize: '0.65rem', color: 'var(--accent-green)', marginTop: '0.25rem' }}>RMSE: {result.rmse?.toFixed(4)}</div>}
              </motion.div>
            );
          })}
        </div>

        {/* Signal Panel */}
        <motion.div className="card signal-card" key={selectedModel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="h2"><Target size={16} /> {currentConfig.id} Forecaster</div>
          <div className={`signal-direction ${delta > 0 ? 'direction-buy' : 'direction-sell'}`}>
            {delta > 0 ? 'LONG' : 'SHORT'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="stat-label">Real Price</span>
              <span className="stat-value">${lastReal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="stat-label">Predicted</span>
              <span className="stat-value" style={{ color: 'var(--accent-blue)' }}>${lastPred.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '0.4rem' }}>
              <span className="stat-label">Alpha</span>
              <span className="stat-value" style={{ color: delta > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{delta}%</span>
            </div>
          </div>
        </motion.div>

        {/* Dual-Line Chart */}
        <motion.div className="card chart-card" key={`chart-${selectedModel}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="h2">{currentConfig.ticker} | {FREQ_LABELS[currentConfig.freq]} | t+{currentConfig.horizon}</div>
          <div style={{ height: '300px', width: '100%' }}>
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

        {/* Pipeline Status */}
        <div className="card log-card">
          <div className="h2"><Activity size={16} /> Pipeline Status</div>
          {pipelineStatus.is_running ? (
            <div className="regime-alert" style={{ background: 'rgba(255,165,0,0.1)', borderColor: 'rgba(255,165,0,0.2)', color: '#ffb84d' }}>
              <Loader2 size={16} className="spin" />
              <span>Retraining in progress...</span>
            </div>
          ) : (
            <div className="regime-alert" style={{ background: 'rgba(0,255,170,0.1)', borderColor: 'rgba(0,255,170,0.2)', color: 'var(--accent-green)' }}>
              <ShieldCheck size={16} />
              <span>{pipelineStatus.models_trained || 15} models converged</span>
            </div>
          )}
          <div style={{ marginTop: '0.75rem' }}>
            <div className="signal-log-item">
              <span className="stat-label">Schedule</span>
              <span className="stat-value" style={{ fontSize: '0.85rem' }}>Every 1h</span>
            </div>
            <div className="signal-log-item">
              <span className="stat-label">Last Fetch</span>
              <span className="stat-value" style={{ fontSize: '0.85rem' }}>{pipelineStatus.last_fetch ? new Date(pipelineStatus.last_fetch).toLocaleTimeString() : '---'}</span>
            </div>
            <div className="signal-log-item">
              <span className="stat-label">Last Train</span>
              <span className="stat-value" style={{ fontSize: '0.85rem' }}>{pipelineStatus.last_train ? new Date(pipelineStatus.last_train).toLocaleTimeString() : '---'}</span>
            </div>
          </div>
        </div>

        {/* Training Results */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><BarChart3 size={16} /> Training RMSE</div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {trainingLog.results?.map((r, i) => (
              <div key={i} className="signal-log-item">
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.id}</span>
                <span className="stat-value" style={{ fontSize: '0.85rem', color: 'var(--accent-green)' }}>
                  {r.rmse ? r.rmse.toFixed(4) : 'META'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Inventory */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><Layers size={16} /> Model Inventory</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {models.map(m => (
              <div key={m.id} onClick={() => { setSelectedModel(m.id); setActiveFreq(m.freq); }}
                style={{
                  padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.65rem', cursor: 'pointer',
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
