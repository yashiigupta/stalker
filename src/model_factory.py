"""
model_factory.py -- Multi-Model Training Factory

Trains 15 models across multiple horizons, frequencies, and assets.
Exports predictions to data/predictions/{MODEL_ID}.json for the dashboard.

Usage:
    python src/model_factory.py
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
import json
import os
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

SEED = 25
np.random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PRED_DIR = os.path.join(BASE_DIR, "data", "predictions")
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(PRED_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Model Registry ---
MODEL_REGISTRY = [
    {"id": "M01", "ticker": "SPY",  "freq": "minute", "horizon": 1, "engine": "VAR+LGBM"},
    {"id": "M02", "ticker": "SPY",  "freq": "minute", "horizon": 3, "engine": "VAR+LGBM"},
    {"id": "M03", "ticker": "SPY",  "freq": "daily",  "horizon": 1, "engine": "LGBM"},
    {"id": "M04", "ticker": "SPY",  "freq": "daily",  "horizon": 5, "engine": "LGBM"},
    {"id": "M05", "ticker": "SPY",  "freq": "weekly", "horizon": 1, "engine": "LGBM"},
    {"id": "M06", "ticker": "AAPL", "freq": "minute", "horizon": 1, "engine": "VAR+LGBM"},
    {"id": "M07", "ticker": "AAPL", "freq": "daily",  "horizon": 1, "engine": "LGBM"},
    {"id": "M08", "ticker": "AAPL", "freq": "weekly", "horizon": 1, "engine": "LGBM"},
    {"id": "M09", "ticker": "MSFT", "freq": "minute", "horizon": 1, "engine": "VAR+LGBM"},
    {"id": "M10", "ticker": "MSFT", "freq": "daily",  "horizon": 1, "engine": "LGBM"},
    {"id": "M11", "ticker": "JPM",  "freq": "daily",  "horizon": 1, "engine": "LGBM"},
    {"id": "M12", "ticker": "JPM",  "freq": "weekly", "horizon": 1, "engine": "LGBM"},
    {"id": "M13", "ticker": "GLD",  "freq": "daily",  "horizon": 1, "engine": "LGBM"},
    {"id": "M14", "ticker": "GLD",  "freq": "weekly", "horizon": 1, "engine": "LGBM"},
    {"id": "M15", "ticker": "ENSEMBLE", "freq": "daily", "horizon": 1, "engine": "META"},
    {"id": "H01", "ticker": "SPY",  "freq": "hourly", "horizon": 1, "engine": "VAR+LGBM"},
    {"id": "H02", "ticker": "AAPL", "freq": "hourly", "horizon": 1, "engine": "LGBM"},
    {"id": "H03", "ticker": "MSFT", "freq": "hourly", "horizon": 1, "engine": "LGBM"},
    {"id": "H04", "ticker": "JPM",  "freq": "hourly", "horizon": 1, "engine": "LGBM"},
    {"id": "H05", "ticker": "GLD",  "freq": "hourly", "horizon": 1, "engine": "LGBM"},
]

TICKERS = ["AAPL", "MSFT", "JPM", "SPY", "GLD"]


def _load_data(freq, ticker):
    """Load raw CSV, handling yfinance multi-level headers."""
    path = os.path.join(RAW_DIR, freq, f"{ticker}.csv")
    if not os.path.exists(path):
        return None
    return pd.read_csv(path, index_col=0, parse_dates=True, skiprows=[1, 2])


def _build_features(df, horizon):
    """Create lag-based features and target for a single-asset regression."""
    close = df["Close"].dropna()
    feat = pd.DataFrame(index=close.index)
    for lag in [1, 2, 3, 5, 10]:
        feat[f"ret_lag{lag}"] = close.pct_change(lag)
    feat["vol_5"] = close.pct_change().rolling(5).std()
    feat["vol_20"] = close.pct_change().rolling(20).std()
    feat["sma_ratio"] = close / close.rolling(10).mean()
    feat["target"] = close.shift(-horizon) / close - 1  # Forward return
    feat["close"] = close
    return feat.dropna()


def _build_var_features(freq, target_ticker, horizon):
    """Build multi-asset return matrix for VAR-based models."""
    dfs = {}
    for t in TICKERS:
        raw = _load_data(freq, t)
        if raw is not None and "Close" in raw.columns:
            dfs[t] = raw["Close"]
    if not dfs:
        return None

    prices = pd.DataFrame(dfs).dropna()
    returns = prices.pct_change().dropna()

    # Add lags as features
    feat = pd.DataFrame(index=returns.index)
    for t in returns.columns:
        for lag in [1, 2, 3]:
            feat[f"{t}_lag{lag}"] = returns[t].shift(lag)
    feat["target"] = returns[target_ticker].shift(-horizon)
    feat["close"] = prices[target_ticker].loc[feat.index]
    return feat.dropna()


def train_lgbm(model_cfg):
    """Train a LightGBM regressor for a single model config."""
    mid = model_cfg["id"]
    ticker = model_cfg["ticker"]
    freq = model_cfg["freq"]
    horizon = model_cfg["horizon"]

    df = _load_data(freq, ticker)
    if df is None:
        print(f"  [{mid}] SKIP -- No data for {ticker}/{freq}")
        return None

    feat = _build_features(df, horizon)
    feature_cols = [c for c in feat.columns if c not in ("target", "close")]

    X = feat[feature_cols]
    y = feat["target"]
    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    ds = lgb.Dataset(X_train, label=y_train)
    params = {"objective": "regression", "metric": "rmse", "seed": SEED, "verbose": -1,
              "num_leaves": 31, "learning_rate": 0.05}
    model = lgb.train(params, ds, num_boost_round=200)

    preds = model.predict(X_test)
    rmse = np.sqrt(np.mean((preds - y_test.values) ** 2))

    # Convert to prices for dual-line
    base_prices = feat["close"].iloc[split:]
    real_prices = base_prices * (1 + y_test)
    pred_prices = base_prices * (1 + preds)

    # Export last 100 points
    n = min(100, len(real_prices))
    export = []
    for i in range(-n, 0):
        idx = real_prices.index[i]
        time_str = idx.strftime("%Y-%m-%d %H:%M") if freq == "minute" else idx.strftime("%Y-%m-%d")
        export.append({
            "time": time_str,
            "real": round(float(real_prices.iloc[i]), 2),
            "predicted": round(float(pred_prices.iloc[i]), 2),
        })

    out_path = os.path.join(PRED_DIR, f"{mid}.json")
    with open(out_path, "w") as f:
        json.dump(export, f, indent=2)

    print(f"  [{mid}] {ticker}/{freq}/t+{horizon} -- RMSE: {rmse:.6f} -- {n} points exported")
    return {"id": mid, "rmse": float(rmse), "points": n}


def train_var_lgbm(model_cfg):
    """Train a VAR+LightGBM hybrid for minute-level models."""
    mid = model_cfg["id"]
    ticker = model_cfg["ticker"]
    freq = model_cfg["freq"]
    horizon = model_cfg["horizon"]

    feat = _build_var_features(freq, ticker, horizon)
    if feat is None or len(feat) < 100:
        print(f"  [{mid}] SKIP -- Insufficient VAR data for {ticker}/{freq}")
        return None

    feature_cols = [c for c in feat.columns if c not in ("target", "close")]
    X = feat[feature_cols]
    y = feat["target"]
    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    ds = lgb.Dataset(X_train, label=y_train)
    params = {"objective": "regression", "metric": "rmse", "seed": SEED, "verbose": -1,
              "num_leaves": 15, "learning_rate": 0.03}
    model = lgb.train(params, ds, num_boost_round=150)

    preds = model.predict(X_test)
    rmse = np.sqrt(np.mean((preds - y_test.values) ** 2))

    base_prices = feat["close"].iloc[split:]
    real_prices = base_prices * (1 + y_test)
    pred_prices = base_prices * (1 + preds)

    n = min(100, len(real_prices))
    export = []
    for i in range(-n, 0):
        idx = real_prices.index[i]
        time_str = idx.strftime("%H:%M:%S") if freq == "minute" else idx.strftime("%Y-%m-%d")
        export.append({
            "time": time_str,
            "real": round(float(real_prices.iloc[i]), 2),
            "predicted": round(float(pred_prices.iloc[i]), 2),
        })

    out_path = os.path.join(PRED_DIR, f"{mid}.json")
    with open(out_path, "w") as f:
        json.dump(export, f, indent=2)

    print(f"  [{mid}] {ticker}/{freq}/t+{horizon} -- RMSE: {rmse:.6f} -- {n} points exported")
    return {"id": mid, "rmse": float(rmse), "points": n}


def train_ensemble(model_cfg):
    """Simple averaging ensemble of all daily t+1 models."""
    mid = model_cfg["id"]
    daily_ids = [m["id"] for m in MODEL_REGISTRY if m["freq"] == "daily" and m["horizon"] == 1 and m["engine"] == "LGBM"]

    all_data = {}
    for did in daily_ids:
        path = os.path.join(PRED_DIR, f"{did}.json")
        if os.path.exists(path):
            with open(path) as f:
                all_data[did] = json.load(f)

    if not all_data:
        print(f"  [{mid}] SKIP -- No component models available")
        return None

    # Average predictions across all daily models
    ref = list(all_data.values())[0]
    export = []
    for i in range(len(ref)):
        avg_pred = np.mean([all_data[d][i]["predicted"] for d in all_data if i < len(all_data[d])])
        export.append({
            "time": ref[i]["time"],
            "real": ref[i]["real"],
            "predicted": round(float(avg_pred), 2),
        })

    out_path = os.path.join(PRED_DIR, f"{mid}.json")
    with open(out_path, "w") as f:
        json.dump(export, f, indent=2)

    print(f"  [{mid}] ENSEMBLE/daily/t+1 -- {len(export)} points exported")
    return {"id": mid, "rmse": 0.0, "points": len(export)}


def train_all():
    """Execute the full model factory."""
    print("=" * 60)
    print("MODEL FACTORY -- Training 15 Models")
    print("=" * 60)

    results = []
    for cfg in MODEL_REGISTRY:
        if cfg["engine"] == "META":
            r = train_ensemble(cfg)
        elif cfg["engine"] == "VAR+LGBM":
            r = train_var_lgbm(cfg)
        else:
            r = train_lgbm(cfg)
        if r:
            results.append(r)

    # Save training log
    log = {"timestamp": datetime.now().isoformat(), "models_trained": len(results), "results": results}
    log_path = os.path.join(BASE_DIR, "data", "training_log.json")
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"FACTORY COMPLETE: {len(results)}/15 models trained")
    print(f"Training log: {log_path}")
    return log


if __name__ == "__main__":
    train_all()
