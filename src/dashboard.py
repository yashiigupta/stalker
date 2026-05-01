"""Streamlit dashboard for RLSH hybrid model results."""
import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json, os

ROOT      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTN_DIR  = os.path.join(ROOT, "data/features/attention_weights")
DIAG_DIR  = os.path.join(ROOT, "docs/diagrams")
RES_DIR   = os.path.join(ROOT, "data/results")
FEAT_CSV  = os.path.join(ROOT, "data/features/daily_features.csv")

TICKERS = ["SPY", "AAPL", "MSFT", "JPM", "GLD"]
THETA   = {"SPY": 0.35, "AAPL": 0.35, "MSFT": 0.45, "JPM": 0.40, "GLD": 0.40}

st.set_page_config(page_title="STALKER — RLSH Dashboard", layout="wide")
st.title("STALKER: RLSH Hybrid Model Dashboard")
st.caption("RATAN-LightGBM Synergistic Hybrid | Phase 3 Results")

tabs = st.tabs(["Architecture", "Per-Ticker Performance", "Attention Heatmap",
                "Ablation Study", "Confidence Sweep"])


# ── Tab 1: Architecture diagram ──────────────────────────────────────────────
with tabs[0]:
    arch_png = os.path.join(DIAG_DIR, "rlsh_architecture.png")
    if os.path.exists(arch_png):
        st.image(arch_png, caption="RLSH Architecture", use_container_width=True)
    else:
        st.warning("Run NB19 to generate the architecture diagram.")


# ── Tab 2: Per-ticker directional accuracy ────────────────────────────────────
with tabs[1]:
    abl_path = os.path.join(RES_DIR, "ablation_table.json")
    if not os.path.exists(abl_path):
        st.warning("Run NB18 first to generate ablation_table.json.")
    else:
        with open(abl_path) as f:
            abl = json.load(f)

        per = abl["gating_per_ticker"]
        rows = []
        for t in TICKERS:
            if t in per:
                p = per[t]
                rows.append({
                    "Ticker": t,
                    "Dir Accuracy": f"{p['dir_accuracy']:.1%}",
                    "Accuracy": f"{p['accuracy']:.1%}",
                    "Coverage": f"{p['coverage']:.1%}",
                    "θ": THETA[t],
                })
        df = pd.DataFrame(rows)
        st.dataframe(df, use_container_width=True)

        fig, ax = plt.subplots(figsize=(8, 4))
        dir_accs = [per[t]["dir_accuracy"] for t in TICKERS if t in per]
        colors = ["#1565C0", "#2E7D32", "#E65100", "#7B1FA2", "#F57F17"]
        bars = ax.bar(TICKERS, dir_accs, color=colors, edgecolor='white')
        ax.axhline(0.75, color='red', linestyle='--', linewidth=2, label='75% target')
        ax.axhline(np.mean(dir_accs), color='navy', linestyle=':', linewidth=1.5,
                   label=f'Avg: {np.mean(dir_accs):.1%}')
        for bar, val in zip(bars, dir_accs):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                    f'{val:.1%}', ha='center', fontsize=11, fontweight='bold')
        ax.set_ylim(0, 1.05)
        ax.set_ylabel("Directional Accuracy")
        ax.legend(); ax.grid(axis='y', alpha=0.3)
        st.pyplot(fig)
        plt.close()


# ── Tab 3: RATAN attention heatmap ───────────────────────────────────────────
with tabs[2]:
    ticker_sel = st.selectbox("Ticker", TICKERS)
    alpha_path = os.path.join(ATTN_DIR, f"alpha_{ticker_sel}.npy")
    if not os.path.exists(alpha_path):
        st.warning(f"alpha_{ticker_sel}.npy not found — run NB16 first.")
    else:
        alpha = np.load(alpha_path).mean(0)
        top_n = st.slider("Top N features", 5, 30, 20)
        top_idx = alpha.argsort()[-top_n:][::-1]

        feat_names = []
        if os.path.exists(FEAT_CSV):
            cols = pd.read_csv(FEAT_CSV, nrows=0).columns.tolist()
            feat_names = [c for c in cols if c != f"{ticker_sel}_Target"]
        top_names = [feat_names[i] if i < len(feat_names) else f"F{i}" for i in top_idx]

        fig, ax = plt.subplots(figsize=(10, max(4, top_n * 0.35)))
        ax.barh(top_names[::-1], alpha[top_idx][::-1], color='steelblue')
        ax.set_xlabel("Mean Attention Weight")
        ax.set_title(f"{ticker_sel}: Top {top_n} Features by RATAN-CE Attention")
        ax.grid(axis='x', alpha=0.3)
        st.pyplot(fig)
        plt.close()


# ── Tab 4: Ablation study table ───────────────────────────────────────────────
with tabs[3]:
    abl_path = os.path.join(RES_DIR, "ablation_table.json")
    if not os.path.exists(abl_path):
        st.warning("Run NB18 first.")
    else:
        with open(abl_path) as f:
            abl = json.load(f)
        rows = abl["rows"]
        df = pd.DataFrame(rows, columns=["Model", "Accuracy", "Dir Accuracy", "Coverage"])
        st.dataframe(df, use_container_width=True)


# ── Tab 5: Confidence sweep ───────────────────────────────────────────────────
with tabs[4]:
    ticker_sw = st.selectbox("Ticker for sweep", TICKERS, key="sweep_ticker")
    probs_path = os.path.join(ATTN_DIR, f"ratan_probs_{ticker_sw}.npy")
    true_path  = os.path.join(ATTN_DIR, f"true_labels_{ticker_sw}.npy")
    if not os.path.exists(probs_path):
        st.warning(f"Run NB16 first for {ticker_sw}.")
    else:
        probs = np.load(probs_path)
        true  = np.load(true_path)
        pred  = probs.argmax(1)
        conf  = probs.max(1)

        thetas = np.arange(0.33, 0.76, 0.02)
        sweep_rows = []
        for th in thetas:
            mask = conf >= th
            if mask.sum() < 10:
                continue
            cov = mask.mean()
            acc = (pred[mask] == true[mask]).mean()
            dm  = mask & (true != 1) & (pred != 1)
            da  = ((pred[dm] > 1) == (true[dm] > 1)).mean() if dm.sum() > 5 else 0.0
            sweep_rows.append({"θ": round(th, 2), "Coverage": f"{cov:.1%}",
                                "Accuracy": f"{acc:.1%}", "Dir Acc": f"{da:.1%}"})
        if sweep_rows:
            st.dataframe(pd.DataFrame(sweep_rows), use_container_width=True)
