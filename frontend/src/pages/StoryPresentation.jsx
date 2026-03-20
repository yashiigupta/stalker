import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, X, Activity, ChevronRight, Quote, Terminal,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import edaData from '../data/edaData.json';
import './StoryPresentation.css';

// ───── CONSTANTS ─────
const C = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#6366f1'];
const TT = { backgroundColor:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#e2e8f0', fontSize:12 };
const AXIS = { fill:'#64748b', fontSize:11 };
const GRID = { strokeDasharray:'3 3', stroke:'rgba(255,255,255,0.06)' };

// ───── DERIVED DATA FROM edaData.json ─────

// Price chart: merge 4 tickers into one array by date
const priceChartData = edaData.normPrices.AAPL.map((p, i) => ({
  date: p.date.slice(2,7),
  AAPL: p.value,
  SPY: edaData.normPrices.SPY[i]?.value,
  GLD: edaData.normPrices.GLD[i]?.value,
  VIX: edaData.normPrices.VIX[i]?.value,
}));

// Cumulative returns chart
const cumRetData = edaData.cumRets.AAPL.map((p, i) => ({
  date: p.date.slice(2,7),
  AAPL: p.value,
  SPY: edaData.cumRets.SPY[i]?.value,
  GLD: edaData.cumRets.GLD[i]?.value,
}));

// Volatility area chart
const volChartData = edaData.volData.map(p => ({ date: p.date.slice(2,7), vol: p.vol }));

// Drawdown area chart
const ddChartData = edaData.ddData.map(p => ({ date: p.date.slice(2,7), dd: p.dd }));

// Kurtosis bar chart
const kurtosisData = edaData.distStats.map(d => ({ ticker: d.ticker, kurtosis: d.kurtosis }));

// Skewness bar chart  
const skewData = edaData.distStats.map(d => ({ ticker: d.ticker, skew: d.skew }));

// Std dev bar chart
const stdData = edaData.distStats.map(d => ({ ticker: d.ticker, std: d.std }));

// Volume bar chart
const volBarData = edaData.avgVolume;

// Correlation heatmap scatter
const corrScatter = edaData.corrData.map((d, i) => ({
  ...d,
  xIdx: edaData.corrTickers.indexOf(d.x),
  yIdx: edaData.corrTickers.indexOf(d.y),
  color: d.value > 0.5 ? '#10b981' : d.value < -0.3 ? '#ef4444' : d.value > 0 ? '#3b82f6' : '#f59e0b',
}));

// ───── MODEL / SYSTEM DATA ─────
const featureImportanceData = [
  { name:'Vol_Local', value:0.32 },{ name:'FFD_Price', value:0.24 },{ name:'VIX_RSI', value:0.18 },
  { name:'RSI_14', value:0.12 },{ name:'MACD', value:0.08 },{ name:'Others', value:0.06 },
];

const modelAccuracyData = [
  { model:'ARIMA', accuracy:52.4 },{ model:'GARCH', accuracy:48.1 },{ model:'LightGBM', accuracy:57.1 },
  { model:'FQI', accuracy:51.2 },{ model:'VAR+LGBM', accuracy:59.3 },{ model:'DQN', accuracy:45.8 },
];

const failTestData = [
  { test:'Ljung-Box', daily:12, hourly:8, total:15 },
  { test:'ARCH-LM', daily:14, hourly:11, total:15 },
  { test:'Jarque-Bera', daily:5, hourly:3, total:15 },
];

const platformData = [
  { subject:'Retraining', model:20, platform:95 },{ subject:'Data Feed', model:30, platform:90 },
  { subject:'Scalability', model:25, platform:85 },{ subject:'Visibility', model:15, platform:95 },
  { subject:'Multi-Asset', model:20, platform:90 },{ subject:'Autonomy', model:10, platform:95 },
];

const rmseData = [
  { model:'M01 AAPL', daily:0.012, hourly:0.004 },{ model:'M04 SPY', daily:0.009, hourly:0.002 },
  { model:'M05 GLD', daily:0.011, hourly:0.005 },{ model:'M07 DX', daily:0.014, hourly:0.003 },
  { model:'M10 XLF', daily:0.015, hourly:0.006 },
];

const tripleLabelData = [
  { name:'Long (+1)', value:35 },{ name:'Flat (0)', value:40 },{ name:'Short (-1)', value:25 },
];

// ───── SLIDES ─────
const slides = [
  // 1
  { type:'title', title:'The Story of STALKER', subtitle:'Statistical Temporal Analysis Layer for Kinetic Execution & Research', icon:<Activity size={56} className="accent-glow" /> },

  // 2
  { type:'content', topic:'THE PROBLEM', header:'Why Traditional Finance Fails',
    content:'Markets violate every assumption of classical models: stationarity, normality, constant β, and linear risk.',
    bullets:['Non-stationarity: Statistical properties drift over time.','Fat Tails: 5σ events occur regularly, not once per 3.5 million years.','Correlation Convergence: Diversification evaporates in crises.','Low SNR: True alpha is buried in market microstructure noise.'],
    cite:'López de Prado (2018). Advances in Financial Machine Learning.' },

  // 3
  { type:'content', topic:'OUR SOLUTION', header:'STALKER: Hybrid Intelligence Platform',
    content:'A hardware-efficient autonomous platform: FFD for stationarity, VAR+LGBM for forecasting, FQI for decision-making. No deep learning. No GPUs.',
    bullets:['Stationarity-Memory Balance via Fractional Differentiation (FFD).','Hybrid Forecasting: VAR (linear) + LightGBM (non-linear residuals).','Non-Neural RL: Fitted Q-Iteration with Extra-Trees.','Autonomous Retraining: ~90s full cycle via APScheduler daemon.'],
    cite:'report.tex §4 — System Architecture' },

  // 4
  { type:'content', topic:'LITERATURE', header:'FFD, FQI & Robust Optimization',
    content:'The theoretical foundations that make STALKER work — directly from the literature review.',
    bullets:['FFD (López de Prado 2018): Fractional d ∈ (0,1) balances stationarity & memory.','FQI (Ernst et al. 2005): Batch RL using Extra-Trees for Q-function approximation.','Huber Loss (Huber 1964): Quadratic near zero, linear at tails — outlier robust.','GARCH(1,1) (Bollerslev 1986): Conditional variance for regime-aware barriers.'],
    cite:'literature_review.tex §2-§6' },

  // 5
  { type:'content', topic:'LITERATURE', header:'Why Not Deep Learning?',
    content:'We tested and rejected DL for 4 empirically-grounded reasons.',
    bullets:['Sample Complexity: ~5k daily points — DL needs millions.','Overfitting: Neural nets memorize market noise instantly.','Interpretability: Black-box models are un-auditable.','Hardware: DL requires multi-GPU clusters; STALKER runs on laptops.'],
    cite:'Gu, Kelly & Xiu (2020). Empirical Asset Pricing via ML.' },

  // 6 — CHART: Normalized Prices
  { type:'recharts', topic:'EDA', header:'20-Year Normalized Price Series', chartId:'prices',
    bullets:['All prices indexed to 100 at start date for fair comparison across different price scales.','AAPL dominates with ~4,500% return — a clear outlier driven by the smartphone revolution.','VIX is mean-reverting (always returns to ~15-20) — confirming it measures fear, not trend.','SPY (benchmark) and GLD show steady uptrends; their divergence reveals macro regime shifts.'],
    cite:'02_eda.ipynb §4 — Price Time-Series Visualization' },

  // 7 — CHART: Kurtosis
  { type:'recharts', topic:'EDA', header:'Excess Kurtosis: Fat Tails Confirmed', chartId:'kurtosis',
    bullets:['Kurtosis > 3.0 means "fatter tails" than a Gaussian distribution — extreme events are more common.','Red bars: dangerously high kurtosis (>10). These assets will destroy MSE-based models.','VIX kurtosis is extreme — volatility itself is volatile, confirming heteroskedasticity.','This finding directly motivates our use of Huber Loss instead of MSE for model training.'],
    cite:'02_eda.ipynb §6 — Distribution Deep Dive' },

  // 8 — CHART: Skewness
  { type:'recharts', topic:'EDA', header:'Return Skewness: Asymmetric Risk', chartId:'skew',
    bullets:['Red bars (negative skew): Left tail is heavier — larger losses are more likely than equivalent gains.','Green bars (positive skew): Right tail is heavier — VIX and TNX spike upward during panic.','Equities (AAPL, MSFT, JPM) show negative skew — crashes are larger than rallies.','This asymmetry is why symmetric loss functions like MSE systematically underestimate risk.'],
    cite:'02_eda.ipynb §6 — Distribution Deep Dive' },

  // 9 — CHART: Volatility Clustering
  { type:'recharts', topic:'EDA', header:'SPY Volatility Clustering (30d Rolling, Annualized)', chartId:'volatility',
    bullets:['Volatility "clusters" — high-vol periods follow high-vol periods (and vice versa).','Major spikes: 2008 (~80%), 2011 (~30%), 2015 (~25%), 2018 (~30%), 2020 (~75%).','This pattern is called conditional heteroskedasticity — variance depends on past variance.','GARCH(1,1) explicitly models this: σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁.'],
    cite:'02_eda.ipynb §10 — Volatility Analysis' },

  // 10 — CHART: Drawdown
  { type:'recharts', topic:'EDA', header:'SPY Underwater Equity Curve (Drawdowns)', chartId:'drawdown',
    bullets:['The chart shows how far below the all-time high SPY fell at each point in time.','2008 GFC: -55% drawdown, took ~5.5 years to recover to break-even.','2020 COVID: -34% drawdown, but recovered in only ~5 months (Fed intervention).','Models must be regime-aware: a -55% crash and a -34% crash need different response strategies.'],
    cite:'02_eda.ipynb §11 — Drawdown Analysis' },

  // 11 — CHART: Correlation
  { type:'recharts', topic:'EDA', header:'Cross-Asset Return Correlations', chartId:'correlation',
    bullets:['Each row shows how one asset\'s returns correlate with all others.','VIX/SPY strong negative: when stocks drop, fear (VIX) spikes — the classic "fear gauge".','AAPL/SPY high positive (0.72): tech dominates the S&P 500, limiting diversification.','GLD shows near-zero correlation with equities — weak hedge in short (tactical) timeframes.'],
    cite:'02_eda.ipynb §12 — Cross-Asset Correlation' },

  // 12 — CHART: Std Dev
  { type:'recharts', topic:'EDA', header:'Daily Return Volatility Across Assets', chartId:'std',
    bullets:['Standard deviation of daily returns, expressed in percentage — higher = more volatile.','VIX has ~6x the daily volatility of SPY — a single "risk" number can\'t describe all assets.','This variance range is why STALKER trains per-asset models, not one universal model.','Low-vol assets (SPY, GLD) need tighter Triple Barrier thresholds; high-vol needs wider ones.'],
    cite:'02_eda.ipynb §5 — Summary Statistics' },

  // 13 — CHART: Avg Volume
  { type:'recharts', topic:'EDA', header:'Average Daily Trading Volume (Millions)', chartId:'volume',
    bullets:['Volume measures how many shares trade per day — a proxy for liquidity and market interest.','AAPL and SPY dominate: high liquidity means tighter bid-ask spreads and better execution.','Volume spikes often coincide with regime transitions (earnings, crashes, policy changes).','STALKER uses volume dynamics as an input for Triple Barrier width scaling.'],
    cite:'02_eda.ipynb §14 — Volume Analysis' },

  // 14 — CHART: Triple Barrier
  { type:'recharts', topic:'FEATURES', header:'Triple Barrier Label Distribution', chartId:'tripleBarrier',
    bullets:['Three barriers form a "box" around each trade: profit-take (top), stop-loss (bottom), time-out (right).','Flat (0) = 40%: Most trades expire at the time barrier — the market is noisy.','Long (+1) = 35%: Profit-take triggered more than stop-loss — slight bullish bias.','Barrier widths are scaled by rolling volatility so labels adapt to market conditions.'],
    cite:'03_feature_engineering.ipynb — López de Prado (2018)' },

  // 15 — CHART: Feature Importance
  { type:'recharts', topic:'FEATURES', header:'What Actually Predicts the Market?', chartId:'featureImportance',
    bullets:['Vol_Local (#1, 32%) — local volatility is the strongest predictor, not price lags.','FFD_Price (#2, 24%) — fractionally differentiated price preserves memory AND stationarity.','VIX_RSI (#3, 18%) — the momentum of fear itself is a powerful signal.','Key insight: markets price levels, but the "shock" is in the variance — variance features dominate.'],
    cite:'05_advanced_ml.ipynb — LightGBM Gain Importance' },

  // 16 — CHART: Model Accuracy
  { type:'recharts', topic:'MODELS', header:'Directional Accuracy Across Models', chartId:'modelAccuracy',
    bullets:['Green bars (>55% DA): LightGBM and VAR+LGBM hybrid — tree-based models win.','Yellow bars (50-55% DA): ARIMA and FQI — marginal edge, barely above coin-flip.','Red bars (<50% DA): GARCH and DQN — fail to predict direction consistently.','VAR+LGBM at 59.3% is the champion — combining linear + non-linear beats all standalone models.'],
    cite:'04_baseline_ml.ipynb, 05_advanced_ml.ipynb, 06_neural_refinement.ipynb' },

  // 17 — VAR+LGBM Architecture
  { type:'content', topic:'ARCHITECTURE', header:'The Winning Combo: VAR + LightGBM',
    content:'Vector Autoregression captures linear drift, LightGBM learns the residual non-linearities.',
    bullets:['Step 1: VAR captures multivariate linear dependencies.','Step 2: Calculate residuals (Market Noise).','Step 3: LightGBM learns non-linear patterns in residuals.','Impact: RMSE reduction of ~18% over standalone LGBM.'],
    cite:'report.tex §5.2 — Hybrid Architecture' },

  // 18 — CHART: RMSE
  { type:'recharts', topic:'TESTING', header:'Model RMSE Across Assets', chartId:'rmse',
    bullets:['Blue bars (Daily RMSE): ranges 0.009–0.015 — sub-1.5% average prediction error.','Purple bars (Hourly RMSE): consistently tighter — more data points improve precision.','SPY (M04) has the lowest RMSE — the most liquid asset is easiest to predict.','Regime spikes: AAPL daily RMSE jumps from 0.012 to 0.031 during earnings — a known fragility.'],
    cite:'09_fail_test.ipynb — RMSE Comparison' },

  // 19 — CHART: Diagnostics
  { type:'recharts', topic:'TESTING', header:'Statistical Diagnostic Pass Rates', chartId:'diagnostics',
    bullets:['Ljung-Box: Tests if model residuals are white noise (no leftover signal). 12/15 daily pass.','ARCH-LM: Tests if residual variance is constant. 14/15 daily pass after GARCH integration.','Jarque-Bera: Tests if residuals are normally distributed. Only 5/15 pass — expected with fat tails.','Grey bars show total models (15) — the gap between colored and grey bars reveals failure rates.'],
    cite:'09_fail_test.ipynb — Ljung-Box, ARCH-LM, Jarque-Bera' },

  // 20 — CHART: Cumulative Returns
  { type:'recharts', topic:'RESULTS', header:'Cumulative Returns Over 20 Years', chartId:'cumReturns',
    bullets:['AAPL: ~4,500% cumulative return — driven by iPhone, services, and buyback programs.','SPY: ~450% — broad market growth, the benchmark for any strategy.','GLD: ~220% — modest hedge, underperforms equities in long-horizon trending markets.','The divergence between lines reveals why multi-asset models need per-ticker calibration.'],
    cite:'02_eda.ipynb §20 — Cumulative Returns' },

  // 21 — Platform
  { type:'content', topic:'PLATFORM', header:'End-to-End Autonomous Pipeline',
    content:'STALKER is a containerized Flask + React system with autonomous retraining.',
    bullets:['Data Fetcher: yfinance → OHLCV + Macro (10 tickers).','Feature Engine: FFD, RSI-14, MACD, Rolling Vol → 95 features/ticker.','Model Factory: 15-model registry, VAR+LGBM hybrid core.','Daemon: APScheduler — Quick Sync ~20s, Full Retrain ~90s.'],
    cite:'report.tex §4 — System Pipeline' },

  // 22 — CHART: Platform Radar
  { type:'recharts', topic:'PLATFORM', header:'Why Platform, Not Just a Model?', chartId:'radar',
    bullets:['Blue area (STALKER): scores 85-95% across all operational dimensions.','Red area (Single Model): collapses to 10-30% — no automation, no monitoring, no scale.','Biggest gap: "Autonomy" — a script needs a human to run it; a platform runs itself.','"Visibility" — STALKER\'s React dashboard shows real-time predictions, a script shows nothing.'],
    cite:'report.tex — Platform vs. Single Model comparison' },

  // 23 — Model Registry Table
  { type:'table', topic:'PLATFORM', header:'The 15-Model Registry',
    tableHeader:['Registry','Assets','Horizon','Architecture'],
    tableRows:[
      ['M01–M03','AAPL, MSFT, JPM','Daily','VAR + LightGBM'],
      ['M04–M06','SPY, GLD, VIX','Daily','VAR + LightGBM'],
      ['M07–M09','DX, TNX, XLK','Hourly','LGBM + GARCH'],
      ['M10–M12','XLF, AAPL, SPY','Hourly','LGBM + GARCH'],
      ['M13–M15','Multi-Asset','Mixed','Ensemble Fusion'],
    ],
    cite:'report.tex Table II' },

  // 24 — Hardware
  { type:'content', topic:'HARDWARE', header:'Consumer Grade Alpha: No GPU Required',
    content:'Institutional-grade models on consumer machines.',
    bullets:['Single pass inference: < 15ms.','Full 15-model retraining: ~82s.','Memory footprint: < 450MB active RAM.','Target: Apple M-series / any modern CPU.'],
    cite:'report.tex — Hardware Benchmarks (Apple M3 Pro)' },

  // 25 — Future
  { type:'content', topic:'FUTURE', header:'The Roadmap: Post-STALKER Era',
    content:'Version 3.0 targets:',
    bullets:['Attention-based Transformer layers for temporal feature weighting.','Meta-labeling with Kelly Criterion for optimal bet sizing.','Cross-Asset Indicator Mapping via Graph Neural Networks.','GARCH Volatility Overlay for automated stop-loss scaling.','Real-time sentiment analysis from news/social feeds.'] },

  // 26
  { type:'title', title:'Built for Scale. Verified by Failure.', subtitle:'Questions? The terminal is open.', icon:<Terminal size={56} className="accent-glow" /> },
];

// ───── CHART RENDERER ─────
const RenderChart = ({ chartId }) => {
  const h = 260;
  switch (chartId) {
    case 'prices':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={priceChartData}><CartesianGrid {...GRID} />
            <XAxis dataKey="date" tick={AXIS} interval={Math.floor(priceChartData.length/6)} />
            <YAxis tick={AXIS} /><Tooltip contentStyle={TT} />
            <Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}} />
            <Line type="monotone" dataKey="AAPL" stroke="#3b82f6" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="SPY" stroke="#10b981" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="GLD" stroke="#f59e0b" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="VIX" stroke="#ef4444" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'kurtosis':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={kurtosisData}><CartesianGrid {...GRID} />
            <XAxis dataKey="ticker" tick={AXIS} /><YAxis tick={AXIS} /><Tooltip contentStyle={TT} />
            <Bar dataKey="kurtosis" radius={[4,4,0,0]}>
              {kurtosisData.map((e,i) => <Cell key={i} fill={e.kurtosis > 10 ? '#ef4444' : e.kurtosis > 5 ? '#f59e0b' : '#3b82f6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case 'skew':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={skewData}><CartesianGrid {...GRID} />
            <XAxis dataKey="ticker" tick={AXIS} /><YAxis tick={AXIS} /><Tooltip contentStyle={TT} />
            <Bar dataKey="skew" radius={[4,4,0,0]}>
              {skewData.map((e,i) => <Cell key={i} fill={e.skew < 0 ? '#ef4444' : '#10b981'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case 'volatility':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <AreaChart data={volChartData}><CartesianGrid {...GRID} />
            <XAxis dataKey="date" tick={AXIS} interval={Math.floor(volChartData.length/6)} />
            <YAxis tick={AXIS} unit="%" /><Tooltip contentStyle={TT} />
            <defs><linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
            <Area type="monotone" dataKey="vol" stroke="#ef4444" fill="url(#volGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'drawdown':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <AreaChart data={ddChartData}><CartesianGrid {...GRID} />
            <XAxis dataKey="date" tick={AXIS} interval={Math.floor(ddChartData.length/6)} />
            <YAxis tick={AXIS} unit="%" /><Tooltip contentStyle={TT} />
            <defs><linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.5}/></linearGradient></defs>
            <Area type="monotone" dataKey="dd" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'correlation':
      const corrForChart = edaData.corrTickers.map(t1 => {
        const row = { ticker: t1 };
        edaData.corrTickers.forEach(t2 => {
          const found = edaData.corrData.find(d => d.x === t1 && d.y === t2);
          row[t2] = found ? found.value : 0;
        });
        return row;
      });
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={corrForChart} layout="vertical"><CartesianGrid {...GRID} />
            <XAxis type="number" domain={[-1, 1]} tick={AXIS} />
            <YAxis type="category" dataKey="ticker" tick={AXIS} width={40} />
            <Tooltip contentStyle={TT} />
            <Legend wrapperStyle={{fontSize:10,color:'#94a3b8'}} />
            {edaData.corrTickers.map((t, i) => (
              <Bar key={t} dataKey={t} stackId="a" fill={C[i % C.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    case 'std':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={stdData}><CartesianGrid {...GRID} />
            <XAxis dataKey="ticker" tick={AXIS} /><YAxis tick={AXIS} unit="%" /><Tooltip contentStyle={TT} />
            <Bar dataKey="std" radius={[4,4,0,0]}>
              {stdData.map((e,i) => <Cell key={i} fill={C[i%C.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case 'volume':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={volBarData}><CartesianGrid {...GRID} />
            <XAxis dataKey="ticker" tick={AXIS} /><YAxis tick={AXIS} unit="M" /><Tooltip contentStyle={TT} />
            <Bar dataKey="volume" radius={[4,4,0,0]}>
              {volBarData.map((e,i) => <Cell key={i} fill={C[i%C.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case 'tripleBarrier':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart><Pie data={tripleLabelData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={4} dataKey="value" label={({name,value})=>`${name}: ${value}%`}>
            {tripleLabelData.map((_, i) => <Cell key={i} fill={C[i%C.length]} />)}
          </Pie><Tooltip contentStyle={TT} /></PieChart>
        </ResponsiveContainer>
      );
    case 'featureImportance':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={featureImportanceData} layout="vertical"><CartesianGrid {...GRID} />
            <XAxis type="number" tick={AXIS} /><YAxis type="category" dataKey="name" tick={AXIS} width={70} /><Tooltip contentStyle={TT} />
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {featureImportanceData.map((_, i) => <Cell key={i} fill={C[i%C.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case 'modelAccuracy':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={modelAccuracyData}><CartesianGrid {...GRID} />
            <XAxis dataKey="model" tick={AXIS} /><YAxis domain={[40,65]} tick={AXIS} /><Tooltip contentStyle={TT} />
            <Bar dataKey="accuracy" radius={[4,4,0,0]}>
              {modelAccuracyData.map((e,i) => <Cell key={i} fill={e.accuracy>=55?'#10b981':e.accuracy>=50?'#f59e0b':'#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case 'rmse':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={rmseData}><CartesianGrid {...GRID} />
            <XAxis dataKey="model" tick={AXIS} /><YAxis tick={AXIS} /><Tooltip contentStyle={TT} />
            <Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}} />
            <Bar dataKey="daily" fill="#3b82f6" name="Daily" radius={[4,4,0,0]} />
            <Bar dataKey="hourly" fill="#8b5cf6" name="Hourly" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'diagnostics':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={failTestData}><CartesianGrid {...GRID} />
            <XAxis dataKey="test" tick={AXIS} /><YAxis domain={[0,15]} tick={AXIS} /><Tooltip contentStyle={TT} />
            <Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}} />
            <Bar dataKey="daily" fill="#10b981" name="Daily Pass" radius={[4,4,0,0]} />
            <Bar dataKey="hourly" fill="#f59e0b" name="Hourly Pass" radius={[4,4,0,0]} />
            <Bar dataKey="total" fill="rgba(255,255,255,0.1)" name="Total" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'cumReturns':
      return (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={cumRetData}><CartesianGrid {...GRID} />
            <XAxis dataKey="date" tick={AXIS} interval={Math.floor(cumRetData.length/6)} />
            <YAxis tick={AXIS} unit="%" /><Tooltip contentStyle={TT} />
            <Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}} />
            <Line type="monotone" dataKey="AAPL" stroke="#3b82f6" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="SPY" stroke="#10b981" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="GLD" stroke="#f59e0b" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'radar':
      return (
        <ResponsiveContainer width="100%" height={h+40}>
          <RadarChart data={platformData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="subject" tick={{fill:'#94a3b8',fontSize:11}} />
            <PolarRadiusAxis domain={[0,100]} tick={{fill:'#475569',fontSize:9}} />
            <Radar name="Single Model" dataKey="model" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
            <Radar name="STALKER" dataKey="platform" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
            <Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}} />
          </RadarChart>
        </ResponsiveContainer>
      );
    default: return null;
  }
};

// ───── COMPONENT ─────
const StoryPresentation = () => {
  const [cur, setCur] = useState(0);
  const nav = useNavigate();
  const total = slides.length;

  const next = useCallback(() => setCur(p => Math.min(p+1, total-1)), [total]);
  const prev = useCallback(() => setCur(p => Math.max(p-1, 0)), []);
  const exit = useCallback(() => nav('/'), [nav]);

  useEffect(() => {
    const h = (e) => { if(e.key==='ArrowRight') next(); else if(e.key==='ArrowLeft') prev(); else if(e.key==='Escape') exit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [next, prev, exit]);

  const renderSlide = (s) => {
    const k = `slide-${cur}`;
    const anim = { initial:{opacity:0,x:60}, animate:{opacity:1,x:0}, exit:{opacity:0,x:-60}, transition:{duration:0.3} };

    if (s.type === 'title') return (
      <motion.div key={k} {...{...anim, initial:{opacity:0,scale:0.9}, exit:{opacity:0,scale:1.05}}} className="slide-content title-slide">
        <div className="title-icon-wrap">{s.icon}</div>
        <h1 className="h1-hero">{s.title}</h1>
        <p className="hero-subtitle">{s.subtitle}</p>
      </motion.div>
    );

    if (s.type === 'content') return (
      <motion.div key={k} {...anim} className="slide-content standard-slide">
        <div className="topic-tag">{s.topic}</div>
        <h2 className="slide-header">{s.header}</h2>
        <p className="body-text">{s.content}</p>
        {s.bullets && <ul className="slide-list">{s.bullets.map((b,i)=><li key={i}><ChevronRight size={14}/>{b}</li>)}</ul>}
        {s.cite && <div className="slide-citation"><Quote size={12} className="quote-icon"/><span>{s.cite}</span></div>}
      </motion.div>
    );

    if (s.type === 'recharts') return (
      <motion.div key={k} {...anim} className="slide-content chart-slide">
        <div className="topic-tag">{s.topic}</div>
        <h2 className="slide-header">{s.header}</h2>
        <div className="chart-with-text">
          <div className="recharts-wrap"><RenderChart chartId={s.chartId} /></div>
          {s.bullets && <ul className="chart-explainer">{s.bullets.map((b,i)=><li key={i}><ChevronRight size={13}/><span>{b}</span></li>)}</ul>}
        </div>
        {s.cite && <div className="slide-citation"><Quote size={12} className="quote-icon"/><span>{s.cite}</span></div>}
      </motion.div>
    );

    if (s.type === 'table') return (
      <motion.div key={k} {...anim} className="slide-content standard-slide">
        <div className="topic-tag">{s.topic}</div>
        <h2 className="slide-header">{s.header}</h2>
        <div className="table-body">
          <table className="s-table">
            <thead><tr>{s.tableHeader.map((h,i)=><th key={i}>{h}</th>)}</tr></thead>
            <tbody>{s.tableRows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {s.cite && <div className="slide-citation"><Quote size={12} className="quote-icon"/><span>{s.cite}</span></div>}
      </motion.div>
    );

    return null;
  };

  return (
    <div className="story-presentation-wrap">
      <button className="exit-btn" onClick={exit}><X size={18}/></button>
      <div className="slide-container">
        <AnimatePresence mode="wait">{renderSlide(slides[cur])}</AnimatePresence>
      </div>
      <div className="presentation-nav">
        <button onClick={prev} disabled={cur===0}><ArrowLeft size={16}/></button>
        <div className="nav-progress">
          <span>{cur+1} / {total}</span>
          <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{width:`${((cur+1)/total)*100}%`}}/></div>
        </div>
        <button onClick={next} disabled={cur===total-1}><ArrowRight size={16}/></button>
      </div>
    </div>
  );
};

export default StoryPresentation;
