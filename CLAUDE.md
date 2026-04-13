# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stalker is a hybrid temporal financial forecaster that trains 20 models (M01-M15 + H01-H05) across multiple assets (SPY, AAPL, MSFT, JPM, GLD), frequencies (minute, hourly, daily, weekly), and horizons. It uses LightGBM and VAR+LightGBM engines with a Flask backend serving live predictions and a React (Vite) frontend dashboard.

## Commands

### Backend (Python)
```bash
# Start the live prediction server (port 5001)
python src/server.py

# Full pipeline: fetch data + train all models + export to frontend
python src/retrain.py --all

# Fetch fresh market data only
python src/retrain.py --data-only

# Retrain models only (uses existing data)
python src/retrain.py --models-only

# Train all models standalone
python src/model_factory.py

# Fetch data standalone
python src/data_fetcher.py
```

### Frontend (React/Vite)
```bash
cd frontend
npm run dev      # Dev server with HMR
npm run build    # Production build (output: frontend/dist/)
npm run lint     # ESLint
```

## Architecture

**Backend pipeline flow:** `data_fetcher.py` (yfinance OHLCV) -> `model_factory.py` (train LightGBM/VAR+LightGBM models) -> `data/predictions/{MODEL_ID}.json` -> `server.py` (Flask API + APScheduler)

- `server.py` runs two scheduled jobs: prediction tick every 30s (rolling history) and fast retrain every 1h (5 best models: M01, M07, M10, M11, M13)
- `model_factory.py` contains `MODEL_REGISTRY` (the single source of truth for all 20 model configs) and three training functions: `train_lgbm`, `train_var_lgbm`, `train_ensemble`
- `retrain.py` orchestrates the full pipeline and copies prediction JSONs to `frontend/src/data/`

**API endpoints:** `/api/status`, `/api/models`, `/api/predictions/<id>`, `/api/live-prediction/<id>`, `/api/prediction-history/<id>`, `/api/training-log`, `POST /api/sync` (fast 5-model retrain), `POST /api/retrain-all` (full 20-model retrain)

**Frontend:** React 19 + Vite 8, react-router-dom for routing, recharts/chart.js for visualization, framer-motion for animations. Pages: Landing, Dashboard, Pricing, About, Contact, StoryPresentation.

**Notebooks (01-09):** Sequential research narrative from data collection through EDA, feature engineering, baseline ML, advanced ML, neural refinement, microstructure stability, and forecasters. These are the primary development artifacts.

## Development Rules

- **No emojis** anywhere: code, comments, markdown, commit messages, documentation.
- **Notebook-first development:** All research in Jupyter notebooks following "novel format" -- every code cell has an explanatory markdown cell above it.
- **Random seed:** Always `SEED = 25`. Deviations must be documented.
- **Data immutability:** Never modify raw data in place. Raw -> `data/raw/`, processed -> `data/processed/`, features -> `data/features/`, predictions -> `data/predictions/`.
- **No magic numbers.** All thresholds/hyperparameters as named variables.
- `snake_case` for all Python names. Every function needs a docstring.
