"""
server.py -- Autonomous Live Backend

Flask server that:
  1. Serves model predictions via REST API
  2. Auto-retrains all 15 models on a configurable schedule
  3. Provides a /sync endpoint for manual catch-up
  4. Streams fresh predictions to the React dashboard

Usage:
    python src/server.py
"""

import os
import sys
import json
import threading
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

# Ensure src/ is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_fetcher import fetch_all
from model_factory import train_all, MODEL_REGISTRY

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRED_DIR = os.path.join(BASE_DIR, "data", "predictions")

# -- State --
pipeline_status = {
    "last_fetch": None,
    "last_train": None,
    "is_running": False,
    "models_trained": 0,
    "schedule": "Every 1 hour",
}


def run_full_pipeline():
    """Execute the full fetch + train + export cycle."""
    if pipeline_status["is_running"]:
        return {"status": "already_running"}

    pipeline_status["is_running"] = True
    print(f"\n[PIPELINE] Starting auto-retrain at {datetime.now().isoformat()}")

    try:
        # Step 1: Fetch fresh data
        fetch_log = fetch_all()
        pipeline_status["last_fetch"] = datetime.now().isoformat()

        # Step 2: Train all models
        train_log = train_all()
        pipeline_status["last_train"] = datetime.now().isoformat()
        pipeline_status["models_trained"] = train_log.get("models_trained", 0)

        print(f"[PIPELINE] Complete. {pipeline_status['models_trained']} models trained.")
    except Exception as e:
        print(f"[PIPELINE] Error: {e}")
    finally:
        pipeline_status["is_running"] = False


# -- API Routes --

@app.route("/api/status", methods=["GET"])
def get_status():
    """Return current pipeline status."""
    return jsonify(pipeline_status)


@app.route("/api/models", methods=["GET"])
def get_models():
    """Return the model registry."""
    return jsonify(MODEL_REGISTRY)


@app.route("/api/predictions/<model_id>", methods=["GET"])
def get_predictions(model_id):
    """Return predictions for a specific model."""
    path = os.path.join(PRED_DIR, f"{model_id}.json")
    if not os.path.exists(path):
        return jsonify({"error": f"No predictions for {model_id}"}), 404
    with open(path) as f:
        data = json.load(f)
    return jsonify(data)


@app.route("/api/training-log", methods=["GET"])
def get_training_log():
    """Return the latest training log."""
    path = os.path.join(BASE_DIR, "data", "training_log.json")
    if not os.path.exists(path):
        return jsonify({"error": "No training log"}), 404
    with open(path) as f:
        data = json.load(f)
    return jsonify(data)


@app.route("/api/sync", methods=["POST"])
def sync_all():
    """Manual sync: fetch all missing data and retrain."""
    if pipeline_status["is_running"]:
        return jsonify({"status": "already_running"}), 409
    # Run in background thread so response returns immediately
    t = threading.Thread(target=run_full_pipeline, daemon=True)
    t.start()
    return jsonify({"status": "sync_started", "timestamp": datetime.now().isoformat()})


# -- Scheduler --
scheduler = BackgroundScheduler()
scheduler.add_job(run_full_pipeline, "interval", hours=1, id="auto_retrain")
scheduler.start()


if __name__ == "__main__":
    print("=" * 60)
    print("STALKER AUTONOMOUS SERVER")
    print(f"Auto-retrain scheduled: Every 1 hour")
    print(f"API: http://localhost:5001")
    print("=" * 60)

    # Run initial pipeline on startup
    t = threading.Thread(target=run_full_pipeline, daemon=True)
    t.start()

    app.run(host="0.0.0.0", port=5001, debug=False)
