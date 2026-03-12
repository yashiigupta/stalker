import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, AlertTriangle, ShieldCheck, Zap, Layers, Target, RefreshCw, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import modelRegistry from './data/model_registry.json';
import trainingLog from './data/training_log.json';

// Dynamic import of prediction data
const predictionFiles = import.meta.glob('./data/M*.json', { eager: true });

const loadPredictions = (modelId) => {
  const key = `./data/${modelId}.json`;
  return predictionFiles[key]?.default || [];
};

const FREQ_LABELS = { minute: '1-Minute', daily: 'Daily', weekly: 'Weekly' };
const FREQ_ORDER = ['minute', 'daily', 'weekly'];

const App = () => {
  const [selectedModel, setSelectedModel] = useState('M01');
  const [activeFreq, setActiveFreq] = useState('minute');

  const currentConfig = modelRegistry.find(m => m.id === selectedModel);
  const data = useMemo(() => loadPredictions(selectedModel), [selectedModel]);

  const filteredModels = modelRegistry.filter(m => m.freq === activeFreq);

  const lastReal = data.length ? data[data.length - 1].real : 0;
  const lastPred = data.length ? data[data.length - 1].predicted : 0;
  const delta = lastReal !== 0 ? ((lastPred - lastReal) / lastReal * 100).toFixed(4) : '0';

  const trainedCount = trainingLog.models_trained || 0;
  const trainTime = trainingLog.timestamp ? new Date(trainingLog.timestamp).toLocaleString() : 'N/A';

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="logo">STALKER v2.0 | MULTI-MODEL FACTORY</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="live-indicator"></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {trainedCount}/15 MODELS ACTIVE
          </span>
        </div>
      </header>

      <div className="grid-layout">
        {/* Frequency Tabs */}
        <div className="card hero-card" style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem' }}>
          {FREQ_ORDER.map(freq => (
            <button
              key={freq}
              onClick={() => {
                setActiveFreq(freq);
                const first = modelRegistry.find(m => m.freq === freq);
                if (first) setSelectedModel(first.id);
              }}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                border: activeFreq === freq ? '1px solid var(--accent-blue)' : '1px solid #333',
                background: activeFreq === freq ? 'rgba(0,210,255,0.1)' : 'transparent',
                color: activeFreq === freq ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {FREQ_LABELS[freq]}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} />
            Last Retrain: {trainTime}
          </div>
        </div>

        {/* Model Cards Row */}
        <div className="card hero-card" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '1rem' }}>
          {filteredModels.map(m => {
            const result = trainingLog.results?.find(r => r.id === m.id);
            return (
              <motion.div
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                whileHover={{ scale: 1.03 }}
                style={{
                  minWidth: '140px',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: selectedModel === m.id ? '1px solid var(--accent-blue)' : '1px solid #333',
                  background: selectedModel === m.id ? 'rgba(0,210,255,0.08)' : '#1a1a20',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.id}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{m.ticker}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>
                  t+{m.horizon} | {m.engine}
                </div>
                {result && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-green)', marginTop: '0.25rem' }}>
                    RMSE: {result.rmse?.toFixed(4) || 'N/A'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Signal Panel */}
        <motion.div
          className="card signal-card"
          key={selectedModel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h2"><Target size={16} /> {currentConfig?.id} Forecaster</div>
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
        <motion.div
          className="card chart-card"
          key={`chart-${selectedModel}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="h2">
            {currentConfig?.ticker} | {FREQ_LABELS[currentConfig?.freq]} | t+{currentConfig?.horizon}
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                  contentStyle={{ background: '#141419', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line name="Market (Real)" type="monotone" dataKey="real" stroke="#fff" strokeWidth={2} dot={false} animationDuration={800} />
                <Line name="Model (Predicted)" type="monotone" dataKey="predicted" stroke="#00d2ff" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Training Log */}
        <div className="card log-card">
          <div className="h2"><BarChart3 size={16} /> Training Results</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
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

        {/* Pipeline Status */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><RefreshCw size={16} /> Retrain Pipeline</div>
          <div className="regime-alert" style={{ background: 'rgba(0, 255, 170, 0.1)', borderColor: 'rgba(0, 255, 170, 0.2)', color: 'var(--accent-green)' }}>
            <ShieldCheck size={16} />
            <span>All {trainedCount} models converged</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Run <code style={{ color: 'var(--accent-blue)' }}>python src/retrain.py --all</code> to refresh data and retrain all models.
          </p>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="h2"><Layers size={16} /> Model Inventory</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {modelRegistry.map(m => (
              <div key={m.id} style={{
                padding: '0.2rem 0.5rem',
                border: '1px solid #333',
                borderRadius: '0.25rem',
                fontSize: '0.65rem',
                color: selectedModel === m.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderColor: selectedModel === m.id ? 'var(--accent-blue)' : '#333',
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
