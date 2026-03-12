"""
retrain.py -- Full Retraining Pipeline

Orchestrates the complete refresh cycle:
  1. Fetch fresh data from yfinance
  2. Train all 15 models
  3. Export predictions to frontend

Usage:
    python src/retrain.py --all
    python src/retrain.py --data-only
    python src/retrain.py --models-only
"""

import argparse
import json
import os
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def copy_predictions_to_frontend():
    """Copy all prediction JSONs to the frontend data directory."""
    pred_dir = os.path.join(BASE_DIR, "data", "predictions")
    front_dir = os.path.join(BASE_DIR, "frontend", "src", "data")
    os.makedirs(front_dir, exist_ok=True)

    # Copy all prediction files
    count = 0
    for f in os.listdir(pred_dir):
        if f.endswith(".json"):
            shutil.copy2(os.path.join(pred_dir, f), os.path.join(front_dir, f))
            count += 1

    # Copy training log
    log_src = os.path.join(BASE_DIR, "data", "training_log.json")
    if os.path.exists(log_src):
        shutil.copy2(log_src, os.path.join(front_dir, "training_log.json"))

    # Build model registry for frontend
    from model_factory import MODEL_REGISTRY
    registry_path = os.path.join(front_dir, "model_registry.json")
    with open(registry_path, "w") as f:
        json.dump(MODEL_REGISTRY, f, indent=2)

    print(f"  Copied {count} predictions + registry to frontend/src/data/")


def main():
    parser = argparse.ArgumentParser(description="Stalker Retraining Pipeline")
    parser.add_argument("--all", action="store_true", help="Full pipeline: fetch + train + export")
    parser.add_argument("--data-only", action="store_true", help="Only fetch fresh data")
    parser.add_argument("--models-only", action="store_true", help="Only retrain models")
    args = parser.parse_args()

    print("=" * 60)
    print(f"STALKER RETRAIN PIPELINE -- {datetime.now().isoformat()}")
    print("=" * 60)

    if args.all or args.data_only:
        print("\n[STEP 1] Fetching fresh market data...")
        from data_fetcher import fetch_all
        fetch_all()

    if args.all or args.models_only:
        print("\n[STEP 2] Training all models...")
        from model_factory import train_all
        train_all()

    if args.all or args.models_only:
        print("\n[STEP 3] Exporting to frontend...")
        copy_predictions_to_frontend()

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
