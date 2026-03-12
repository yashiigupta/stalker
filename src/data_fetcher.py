"""
data_fetcher.py -- Fresh Market Data Ingestion

Downloads OHLCV data from yfinance across three frequencies:
  - 1-Minute (last 7 days)
  - Daily (last 20 years)
  - Weekly (resampled from daily)

Usage:
    python src/data_fetcher.py
"""

import yfinance as yf
import pandas as pd
import os
import json
from datetime import datetime

TICKERS = ["AAPL", "MSFT", "JPM", "SPY", "GLD"]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")

CONFIGS = {
    "minute": {"period": "7d", "interval": "1m"},
    "daily": {"period": "20y", "interval": "1d"},
}


def fetch_all():
    """Download fresh data for all tickers and frequencies."""
    log = {"timestamp": datetime.now().isoformat(), "results": []}

    for freq, params in CONFIGS.items():
        out_dir = os.path.join(RAW_DIR, freq)
        os.makedirs(out_dir, exist_ok=True)

        for ticker in TICKERS:
            print(f"  [{freq.upper()}] Fetching {ticker}...")
            try:
                df = yf.download(
                    ticker,
                    period=params["period"],
                    interval=params["interval"],
                    progress=False,
                )
                path = os.path.join(out_dir, f"{ticker}.csv")
                df.to_csv(path)
                log["results"].append(
                    {"ticker": ticker, "freq": freq, "rows": len(df), "status": "ok"}
                )
            except Exception as e:
                log["results"].append(
                    {"ticker": ticker, "freq": freq, "rows": 0, "status": str(e)}
                )

    # Weekly: resample from daily
    weekly_dir = os.path.join(RAW_DIR, "weekly")
    os.makedirs(weekly_dir, exist_ok=True)
    for ticker in TICKERS:
        daily_path = os.path.join(RAW_DIR, "daily", f"{ticker}.csv")
        if os.path.exists(daily_path):
            df = pd.read_csv(daily_path, index_col=0, parse_dates=True, skiprows=[1, 2])
            weekly = df.resample("W").agg(
                {"Open": "first", "High": "max", "Low": "min", "Close": "last", "Volume": "sum"}
            ).dropna()
            weekly.to_csv(os.path.join(weekly_dir, f"{ticker}.csv"))
            log["results"].append(
                {"ticker": ticker, "freq": "weekly", "rows": len(weekly), "status": "ok"}
            )

    # Save fetch log
    log_path = os.path.join(BASE_DIR, "data", "fetch_log.json")
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)

    print(f"\nFetch complete. Log saved to {log_path}")
    return log


if __name__ == "__main__":
    fetch_all()
